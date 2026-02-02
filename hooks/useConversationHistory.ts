import { useState, useEffect, useCallback } from 'react';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    responseTimeMs?: number;
    tokens?: number;
  };
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ai-conversation-history';
const MAX_CONVERSATIONS = 50;

function loadFromStorage(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversation history:', e);
  }
}

function generateTitle(messages: ConversationMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Nouvelle conversation';
  const text = firstUserMessage.content;
  return text.length > 50 ? text.substring(0, 50) + '...' : text;
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setConversations(loaded);
  }, []);

  // Save to localStorage when conversations change
  useEffect(() => {
    if (conversations.length > 0 || loadFromStorage().length > 0) {
      saveToStorage(conversations);
    }
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const createConversation = useCallback((): string => {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversations(prev => {
      const updated = [newConv, ...prev];
      // Enforce max limit
      return updated.slice(0, MAX_CONVERSATIONS);
    });
    setActiveConversationId(id);
    return id;
  }, []);

  const updateConversationMessages = useCallback((conversationId: string, messages: ConversationMessage[]) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages,
              title: generateTitle(messages),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const selectConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    updateConversationMessages,
    deleteConversation,
    selectConversation,
  };
}
