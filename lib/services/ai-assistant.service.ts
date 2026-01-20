import api from '../api';

// Timeout plus long pour les requêtes IA (2 minutes)
const AI_TIMEOUT = 120000;

/**
 * Types pour l'AI Assistant
 */
export interface AIQueryRequest {
  question: string;
  annee?: number;
  contexte?: string;
}

export interface AIResponseMetadata {
  model: string;
  promptTokens: number;
  completionTokens: number;
  responseTimeMs: number;
  anneeAnalysee: number;
}

export interface AIResponse {
  status: 'success' | 'error' | 'partial';
  response: string;
  question: string;
  metadata: AIResponseMetadata;
  error?: string;
  timestamp: string;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export interface AICapabilitiesResponse {
  capabilities: AICapability[];
  version: string;
  model: string;
}

export interface AIHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  llmConnected: boolean;
  databaseConnected: boolean;
  lastCheck: string;
  responseTimeMs?: number;
  error?: string;
}

/**
 * Service pour l'AI Assistant RH
 */
export const aiAssistantService = {
  /**
   * Poser une question à l'assistant IA
   */
  async askQuestion(request: AIQueryRequest): Promise<AIResponse> {
    const response = await api.post<AIResponse>('/ai-assistant/ask', request, {
      timeout: AI_TIMEOUT, // 2 minutes pour les requêtes IA
    });
    return response.data;
  },

  /**
   * Récupérer les capacités de l'assistant
   */
  async getCapabilities(): Promise<AICapabilitiesResponse> {
    const response = await api.get<AICapabilitiesResponse>('/ai-assistant/capabilities');
    return response.data;
  },

  /**
   * Vérifier l'état de santé du service
   */
  async checkHealth(): Promise<AIHealthResponse> {
    const response = await api.get<AIHealthResponse>('/ai-assistant/health');
    return response.data;
  },
};
