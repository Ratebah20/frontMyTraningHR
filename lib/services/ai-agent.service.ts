import { API_URL } from '../api';
import api from '../api';
import { SseAgentEvent, AgentConversation } from '../types/ai-agent';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Parse SSE stream from a fetch Response.
 * Handles "event: type\ndata: {...}\n\n" format.
 */
async function parseSSEStream(
  response: Response,
  onEvent: (event: SseAgentEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE frames
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        if (!frame.trim() || frame.startsWith(': heartbeat')) continue;

        const lines = frame.split('\n');
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            eventData = line.slice(6);
          }
        }

        if (eventData) {
          try {
            const parsed = JSON.parse(eventData) as SseAgentEvent;
            onEvent(parsed);
          } catch {
            // Skip malformed events
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const aiAgentService = {
  /**
   * Stream a chat message with the AI agent via SSE
   */
  async streamChat(
    message: string,
    sessionId: string | undefined,
    onEvent: (event: SseAgentEvent) => void,
    onError: (error: string) => void,
    onComplete: () => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      onError('Non authentifié');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ai-agent/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, sessionId }),
        signal,
      });

      if (!response.ok) {
        const text = await response.text();
        onError(`Erreur ${response.status}: ${text}`);
        return;
      }

      await parseSSEStream(response, onEvent, signal);
      onComplete();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        onComplete();
        return;
      }
      onError(error.message || 'Erreur de connexion');
    }
  },

  /**
   * List user conversations from backend
   */
  async listConversations(limit?: number): Promise<AgentConversation[]> {
    const response = await api.get('/ai-agent/conversations', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get a specific conversation's messages
   */
  async getConversation(sessionId: string): Promise<{
    id: string;
    title: string;
    messages: { role: string; content: string; timestamp: number }[];
  }> {
    const response = await api.get(`/ai-agent/conversations/${sessionId}`);
    return response.data;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(sessionId: string): Promise<void> {
    await api.delete(`/ai-agent/conversations/${sessionId}`);
  },
};
