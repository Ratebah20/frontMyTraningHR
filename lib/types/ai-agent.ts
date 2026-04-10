// SSE Event types from backend
export interface SseTextDeltaEvent {
  type: 'text_delta';
  text: string;
}

export interface SseToolStartEvent {
  type: 'tool_start';
  toolName: string;
  toolId: string;
  input: unknown;
}

export interface SseToolEndEvent {
  type: 'tool_end';
  toolId: string;
  result: string;
  isError: boolean;
  durationMs: number;
}

export interface SseIterationEvent {
  type: 'iteration_start' | 'iteration_end';
  iteration: number;
  stopReason?: string;
}

export interface SseDoneEvent {
  type: 'done';
  iterations: number;
  toolCalls: { name: string; input: unknown }[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface SseErrorEvent {
  type: 'error';
  message: string;
  code?: string;
}

export type SseAgentEvent =
  | SseTextDeltaEvent
  | SseToolStartEvent
  | SseToolEndEvent
  | SseIterationEvent
  | SseDoneEvent
  | SseErrorEvent;

// Frontend state types
export interface ToolActivity {
  toolId: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  input?: unknown;
  result?: string;
  isError?: boolean;
  durationMs?: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  toolActivities?: ToolActivity[];
  metadata?: {
    iterations?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  isError?: boolean;
}

export interface AgentConversation {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  lastActiveAt: string;
}

// Tool name to display label mapping
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  create_formation: 'Création de formation',
  create_formations_batch: 'Création de formations en lot',
  list_formations: 'Recherche de formations',
  update_formation: 'Modification de formation',
  list_categories: 'Liste des catégories',
  list_organismes: 'Liste des organismes',
  create_session: 'Création de session',
  create_collective_session: 'Création de session collective',
  create_sessions_batch: 'Inscription en lot',
  list_sessions: 'Recherche de sessions',
  update_session: 'Modification de session',
  search_collaborateurs: 'Recherche de collaborateurs',
  invite_to_session: 'Invitation à une session',
  get_team_details: 'Détails de l\'équipe',
  check_compliance: 'Vérification conformité',
  list_overdue_trainings: 'Formations en retard',
  send_training_reminders: 'Envoi de rappels',
  get_dashboard_stats: 'Statistiques dashboard',
  get_budget_status: 'État du budget',
  get_ld_objectives: 'Objectifs L&D',
  draft_training_email: 'Rédaction d\'email',
  send_session_notification: 'Envoi de notification',
};
