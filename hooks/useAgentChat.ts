'use client';

import { useState, useCallback, useRef } from 'react';
import { aiAgentService } from '@/lib/services/ai-agent.service';
import {
  AgentMessage,
  ToolActivity,
  SseAgentEvent,
  AgentConversation,
} from '@/lib/types/ai-agent';

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantMessageRef = useRef<AgentMessage | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await aiAgentService.listConversations(30);
      setConversations(list);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const conv = await aiAgentService.getConversation(id);
      const loadedMessages: AgentMessage[] = conv.messages.map((m, i) => ({
        id: `loaded-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
      }));
      setMessages(loadedMessages);
      setSessionId(id);
      setError(null);
    } catch {
      setError('Impossible de charger la conversation');
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(null);

    // Generate session ID if first message
    const currentSessionId = sessionId || `session-${Date.now()}`;
    if (!sessionId) {
      setSessionId(currentSessionId);
    }

    // Add user message
    const userMessage: AgentMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Create assistant placeholder
    const assistantMessage: AgentMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      toolActivities: [],
    };

    assistantMessageRef.current = assistantMessage;

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const handleEvent = (event: SseAgentEvent) => {
      if (!assistantMessageRef.current) return;

      switch (event.type) {
        case 'text_delta':
          assistantMessageRef.current.content += event.text;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...assistantMessageRef.current! };
            return updated;
          });
          break;

        case 'tool_start': {
          const activity: ToolActivity = {
            toolId: event.toolId,
            toolName: event.toolName,
            status: 'running',
            input: event.input,
          };
          assistantMessageRef.current.toolActivities = [
            ...(assistantMessageRef.current.toolActivities || []),
            activity,
          ];
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMessageRef.current! };
            return updated;
          });
          break;
        }

        case 'tool_end': {
          const activities = assistantMessageRef.current.toolActivities || [];
          const idx = activities.findIndex((a) => a.toolId === event.toolId);
          if (idx >= 0) {
            activities[idx] = {
              ...activities[idx],
              status: event.isError ? 'error' : 'completed',
              result: event.result,
              isError: event.isError,
              durationMs: event.durationMs,
            };
            assistantMessageRef.current.toolActivities = [...activities];
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...assistantMessageRef.current! };
              return updated;
            });
          }
          break;
        }

        case 'done':
          assistantMessageRef.current.isStreaming = false;
          assistantMessageRef.current.metadata = {
            iterations: event.iterations,
            inputTokens: event.usage.inputTokens,
            outputTokens: event.usage.outputTokens,
          };
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMessageRef.current! };
            return updated;
          });
          break;

        case 'error':
          assistantMessageRef.current.isStreaming = false;
          assistantMessageRef.current.isError = true;
          assistantMessageRef.current.content =
            assistantMessageRef.current.content || event.message;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMessageRef.current! };
            return updated;
          });
          setError(event.message);
          break;
      }
    };

    await aiAgentService.streamChat(
      text.trim(),
      currentSessionId,
      handleEvent,
      (errMsg) => {
        setError(errMsg);
        if (assistantMessageRef.current) {
          assistantMessageRef.current.isStreaming = false;
          assistantMessageRef.current.isError = true;
          assistantMessageRef.current.content =
            assistantMessageRef.current.content || errMsg;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMessageRef.current! };
            return updated;
          });
        }
      },
      () => {
        setIsStreaming(false);
        assistantMessageRef.current = null;
        // Refresh conversation list
        loadConversations();
      },
      abortController.signal,
    );
  }, [isStreaming, sessionId, loadConversations]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    assistantMessageRef.current = null;
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await aiAgentService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (sessionId === id) {
        clearChat();
      }
    } catch {
      // Silently fail
    }
  }, [sessionId, clearChat]);

  return {
    messages,
    isStreaming,
    error,
    sessionId,
    conversations,
    isLoadingConversations,
    sendMessage,
    stopStreaming,
    clearChat,
    loadConversations,
    loadSession,
    deleteConversation,
  };
}
