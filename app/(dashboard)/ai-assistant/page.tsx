'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  TextInput,
  ActionIcon,
  Paper,
  Group,
  Stack,
  Badge,
  Loader,
  ScrollArea,
  Tooltip,
  ThemeIcon,
  Title,
  rem,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneRight } from '@phosphor-icons/react/dist/ssr/PaperPlaneRight';
import { Robot } from '@phosphor-icons/react/dist/ssr/Robot';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Sparkle } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Lightning } from '@phosphor-icons/react/dist/ssr/Lightning';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { aiAssistantService, AIResponse, AICapability } from '@/lib/services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useConversationHistory, ConversationMessage } from '@/hooks/useConversationHistory';
import { ConversationSidebar } from '@/components/ai/ConversationSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    responseTimeMs?: number;
    tokens?: number;
  };
  isLoading?: boolean;
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  { icon: ChartBar, text: "Quel est le taux de consommation budgétaire ?", color: "blue" },
  { icon: TrendUp, text: "Comment a évolué le budget vs l'année dernière ?", color: "cyan" },
  { icon: Buildings, text: "Quels départements ont le plus formé ?", color: "teal" },
  { icon: Warning, text: "Y a-t-il des anomalies dans les données ?", color: "orange" },
  { icon: Lightbulb, text: "Analyse l'évolution des formations sur 2 ans", color: "violet" },
];

function toStorageMessages(messages: Message[]): ConversationMessage[] {
  return messages
    .filter(m => !m.isLoading)
    .map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      metadata: m.metadata,
      isError: m.isError,
    }));
}

function fromStorageMessages(stored: ConversationMessage[]): Message[] {
  return stored.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    metadata: m.metadata,
    isError: m.isError,
  }));
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy' | 'unknown'>('unknown');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    updateConversationMessages,
    deleteConversation,
    selectConversation,
  } = useConversationHistory();

  useEffect(() => {
    if (activeConversation) {
      setMessages(fromStorageMessages(activeConversation.messages));
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const saveMessages = useCallback((msgs: Message[]) => {
    if (activeConversationId && msgs.some(m => !m.isLoading)) {
      updateConversationMessages(activeConversationId, toStorageMessages(msgs));
    }
  }, [activeConversationId, updateConversationMessages]);

  useEffect(() => {
    const init = async () => {
      try {
        const [capabilitiesData, healthData] = await Promise.all([
          aiAssistantService.getCapabilities(),
          aiAssistantService.checkHealth(),
        ]);
        setCapabilities(capabilitiesData.capabilities);
        setHealthStatus(healthData.status);
      } catch (error) {
        setHealthStatus('unhealthy');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (question?: string) => {
    const messageText = question || inputValue.trim();
    if (!messageText || isLoading) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    const newMessages = [...messages, userMessage, loadingMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    updateConversationMessages(convId, toStorageMessages([...messages, userMessage]));

    try {
      const response = await aiAssistantService.askQuestion({
        question: messageText,
      });

      const updatedMessages = newMessages.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              content: response.response,
              isLoading: false,
              isError: response.status === 'error',
              metadata: {
                responseTimeMs: response.metadata.responseTimeMs,
                tokens: response.metadata.promptTokens + response.metadata.completionTokens,
              },
            }
          : msg
      );

      setMessages(updatedMessages);
      updateConversationMessages(convId, toStorageMessages(updatedMessages));
    } catch (error) {
      const updatedMessages = newMessages.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              content: "Désolé, une erreur est survenue. Veuillez réessayer.",
              isLoading: false,
              isError: true,
            }
          : msg
      );

      setMessages(updatedMessages);
      updateConversationMessages(convId, toStorageMessages(updatedMessages));

      notifications.show({
        title: 'Erreur',
        message: 'Impossible de contacter l\'assistant IA',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    createConversation();
    setMessages([]);
  };

  return (
    <Box
      style={{
        height: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'row',
        borderRadius: rem(16),
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={selectConversation}
        onCreate={handleNewConversation}
        onDelete={deleteConversation}
      />

      {/* Main chat area */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Messages / Welcome Area */}
        <ScrollArea
          style={{ flex: 1 }}
          viewportRef={scrollAreaRef}
        >
          {messages.length === 0 ? (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
                padding: rem(48),
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ textAlign: 'center', maxWidth: 680, width: '100%' }}
              >
                {/* Hero icon */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <ThemeIcon
                    size={80}
                    radius={80}
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'indigo', deg: 135 }}
                    style={{ margin: '0 auto' }}
                  >
                    <Sparkle size={40} weight="duotone" />
                  </ThemeIcon>
                </motion.div>

                <Title order={2} mt="xl" mb={6}>
                  Assistant IA RH
                </Title>
                <Text c="dimmed" size="lg" maw={460} mx="auto" mb={rem(48)}>
                  Posez vos questions sur le budget, les formations, les départements ou les tendances.
                </Text>

                {/* Status badge */}
                <Group justify="center" mb="xl">
                  <Badge
                    size="lg"
                    variant="light"
                    color={healthStatus === 'healthy' ? 'green' : healthStatus === 'degraded' ? 'yellow' : 'red'}
                    leftSection={
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: healthStatus === 'healthy'
                            ? 'var(--mantine-color-green-6)'
                            : healthStatus === 'degraded'
                            ? 'var(--mantine-color-yellow-6)'
                            : 'var(--mantine-color-red-6)',
                        }}
                      />
                    }
                  >
                    {healthStatus === 'healthy' ? 'Service en ligne' : healthStatus === 'degraded' ? 'Service dégradé' : 'Service hors ligne'}
                  </Badge>
                </Group>

                {/* Suggested questions grid */}
                <Text size="sm" c="dimmed" mb="lg" fw={500} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Essayez par exemple
                </Text>

                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: rem(12),
                    width: '100%',
                  }}
                >
                  {SUGGESTED_QUESTIONS.map((q, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.08 }}
                    >
                      <Paper
                        p="lg"
                        radius="md"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                        onClick={() => handleSendMessage(q.text)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `var(--mantine-color-${q.color}-4)`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '';
                        }}
                      >
                        <Group gap="sm" mb="sm" align="flex-start">
                          <ThemeIcon size={40} variant="light" color={q.color} radius="md">
                            <q.icon size={20} weight="duotone" />
                          </ThemeIcon>
                        </Group>
                        <Text size="sm" fw={500} style={{ flex: 1 }}>
                          {q.text}
                        </Text>
                        <Group justify="flex-end" mt="sm">
                          <ArrowRight size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                        </Group>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            </Box>
          ) : (
            <Box p="xl" pb={rem(32)}>
              <Stack gap="xl">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Group
                        align="flex-start"
                        gap="md"
                        wrap="nowrap"
                        style={{
                          flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                          maxWidth: message.role === 'user' ? '100%' : undefined,
                        }}
                      >
                        <ThemeIcon
                          size={36}
                          radius="xl"
                          variant={message.role === 'user' ? 'filled' : 'gradient'}
                          color={message.role === 'user' ? 'blue' : undefined}
                          gradient={message.role === 'assistant' ? { from: 'violet', to: 'indigo', deg: 45 } : undefined}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        >
                          {message.role === 'user' ? (
                            <User size={18} weight="bold" />
                          ) : (
                            <Robot size={18} weight="bold" />
                          )}
                        </ThemeIcon>

                        <Box
                          style={{
                            maxWidth: '75%',
                            minWidth: 0,
                          }}
                        >
                          <Text size="xs" fw={600} mb={4} c="dimmed">
                            {message.role === 'user' ? 'Vous' : 'Assistant IA'}
                          </Text>

                          <Paper
                            p="md"
                            px="lg"
                            radius="lg"
                            style={{
                              background:
                                message.role === 'user'
                                  ? 'var(--mantine-primary-color-filled)'
                                  : message.isError
                                  ? 'var(--mantine-color-red-light)'
                                  : 'var(--mantine-color-default)',
                              border: message.role === 'user'
                                ? 'none'
                                : message.isError
                                ? '1px solid var(--mantine-color-red-4)'
                                : '1px solid var(--mantine-color-default-border)',
                              borderTopLeftRadius: message.role === 'assistant' ? rem(4) : undefined,
                              borderTopRightRadius: message.role === 'user' ? rem(4) : undefined,
                            }}
                          >
                            {message.isLoading ? (
                              <Group gap="sm" py="xs">
                                <Loader size="xs" type="dots" />
                                <Text size="sm" c="dimmed">
                                  Analyse en cours...
                                </Text>
                              </Group>
                            ) : (
                              <Box>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h3: ({ children }: { children?: React.ReactNode }) => (
                                      <Text size="md" fw={600} c={message.role === 'user' ? 'white' : undefined} mt="md" mb="xs">
                                        {children}
                                      </Text>
                                    ),
                                    p: ({ children }: { children?: React.ReactNode }) => (
                                      <Text size="sm" c={message.role === 'user' ? 'white' : undefined} mb="xs" style={{ lineHeight: 1.65 }}>
                                        {children}
                                      </Text>
                                    ),
                                    ul: ({ children }: { children?: React.ReactNode }) => (
                                      <Box component="ul" pl="md" mb="xs">
                                        {children}
                                      </Box>
                                    ),
                                    li: ({ children }: { children?: React.ReactNode }) => (
                                      <Text component="li" size="sm" c={message.role === 'user' ? 'white' : undefined} mb={6} style={{ lineHeight: 1.6 }}>
                                        {children}
                                      </Text>
                                    ),
                                    strong: ({ children }: { children?: React.ReactNode }) => (
                                      <Text span fw={600} c={message.role === 'user' ? 'white' : undefined}>
                                        {children}
                                      </Text>
                                    ),
                                    table: ({ children }: { children?: React.ReactNode }) => (
                                      <Box
                                        component="table"
                                        my="md"
                                        style={{
                                          width: '100%',
                                          borderCollapse: 'collapse',
                                          fontSize: rem(13),
                                          borderRadius: rem(8),
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {children}
                                      </Box>
                                    ),
                                    thead: ({ children }: { children?: React.ReactNode }) => (
                                      <Box
                                        component="thead"
                                        style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}
                                      >
                                        {children}
                                      </Box>
                                    ),
                                    tbody: ({ children }: { children?: React.ReactNode }) => (
                                      <Box component="tbody">{children}</Box>
                                    ),
                                    tr: ({ children }: { children?: React.ReactNode }) => (
                                      <Box
                                        component="tr"
                                        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
                                      >
                                        {children}
                                      </Box>
                                    ),
                                    th: ({ children }: { children?: React.ReactNode }) => (
                                      <Box
                                        component="th"
                                        style={{
                                          padding: `${rem(10)} ${rem(14)}`,
                                          textAlign: 'left',
                                          fontWeight: 600,
                                          borderBottom: '2px solid var(--mantine-color-default-border)',
                                        }}
                                      >
                                        {children}
                                      </Box>
                                    ),
                                    td: ({ children }: { children?: React.ReactNode }) => (
                                      <Box
                                        component="td"
                                        style={{
                                          padding: `${rem(10)} ${rem(14)}`,
                                          color: 'var(--mantine-color-text)',
                                        }}
                                      >
                                        {children}
                                      </Box>
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </Box>
                            )}
                          </Paper>

                          {message.metadata && (
                            <Group gap={6} mt={6}>
                              <Badge size="xs" variant="light" color="gray" leftSection={<Clock size={10} />}>
                                {(message.metadata.responseTimeMs! / 1000).toFixed(1)}s
                              </Badge>
                              {message.metadata.tokens && (
                                <Badge size="xs" variant="light" color="gray" leftSection={<Lightning size={10} />}>
                                  {message.metadata.tokens} tokens
                                </Badge>
                              )}
                            </Group>
                          )}
                        </Box>
                      </Group>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            </Box>
          )}
        </ScrollArea>

        {/* Input Area */}
        <Box
          px="xl"
          py="lg"
          style={{
            borderTop: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Box
            style={{
              maxWidth: 720,
              margin: '0 auto',
            }}
          >
            <Group gap="sm" align="flex-end">
              <TextInput
                ref={inputRef}
                placeholder="Posez votre question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                size="lg"
                radius="xl"
                style={{ flex: 1 }}
              />
              <ActionIcon
                size={48}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'indigo', deg: 45 }}
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                loading={isLoading}
              >
                <PaperPlaneRight size={22} weight="fill" />
              </ActionIcon>
            </Group>

            <Group gap={4} mt="xs" justify="center">
              <Info size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="xs" c="dimmed">
                Les données personnelles ne sont jamais partagées avec l'IA
              </Text>
            </Group>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
