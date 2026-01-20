'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Divider,
  Select,
  Transition,
  rem,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperPlaneRight,
  Robot,
  User,
  Sparkle,
  Lightning,
  ChartBar,
  Buildings,
  TrendUp,
  Warning,
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from '@phosphor-icons/react';
import { aiAssistantService, AIResponse, AICapability } from '@/lib/services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy' | 'unknown'>('unknown');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les capacités et vérifier la santé au montage
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
        console.error('Erreur initialisation AI Assistant:', error);
        setHealthStatus('unhealthy');
      }
    };
    init();
  }, []);

  // Auto-scroll vers le bas
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

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiAssistantService.askQuestion({
        question: messageText,
        annee: parseInt(selectedYear),
      });

      setMessages(prev =>
        prev.map(msg =>
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
        )
      );
    } catch (error) {
      console.error('Erreur AI Assistant:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: "Désolé, une erreur est survenue. Veuillez réessayer.",
                isLoading: false,
                isError: true,
              }
            : msg
        )
      );
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

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  return (
    <Box
      style={{
        height: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        borderRadius: rem(16),
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <Box
        p="lg"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Group justify="space-between" align="center">
          <Group>
            <ThemeIcon
              size={50}
              radius="xl"
              variant="gradient"
              gradient={{ from: '#667eea', to: '#764ba2', deg: 45 }}
            >
              <Robot size={28} weight="duotone" />
            </ThemeIcon>
            <div>
              <Title order={3} c="white">
                Assistant IA RH
              </Title>
              <Text size="sm" c="dimmed">
                Senior Data Analyst - Analyse des formations
              </Text>
            </div>
          </Group>
          <Group>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value || currentYear.toString())}
              data={yearOptions}
              size="sm"
              w={100}
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                },
              }}
            />
            <Tooltip label={`Service ${healthStatus}`}>
              <Badge
                size="lg"
                variant="dot"
                color={healthStatus === 'healthy' ? 'green' : healthStatus === 'degraded' ? 'yellow' : 'red'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
              >
                {healthStatus === 'healthy' ? 'En ligne' : healthStatus === 'degraded' ? 'Dégradé' : 'Hors ligne'}
              </Badge>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Messages Area */}
      <ScrollArea
        style={{ flex: 1 }}
        p="lg"
        viewportRef={scrollAreaRef}
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Stack align="center" gap="xl" py="xl">
              <ThemeIcon
                size={100}
                radius="xl"
                variant="gradient"
                gradient={{ from: '#667eea', to: '#764ba2', deg: 45 }}
              >
                <Sparkle size={50} weight="duotone" />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Title order={2} c="white" mb="xs">
                  Bienvenue !
                </Title>
                <Text c="dimmed" maw={500}>
                  Je suis votre assistant IA spécialisé dans l'analyse des données de formation.
                  Posez-moi vos questions sur le budget, les départements, ou les tendances.
                </Text>
              </div>

              <Divider
                w="100%"
                maw={600}
                label={<Text c="dimmed" size="sm">Questions suggérées</Text>}
                labelPosition="center"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              />

              <Group gap="md" justify="center" wrap="wrap" maw={700}>
                {SUGGESTED_QUESTIONS.map((q, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Paper
                      p="md"
                      radius="lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        maxWidth: 220,
                      }}
                      onClick={() => handleSendMessage(q.text)}
                    >
                      <Group gap="sm">
                        <ThemeIcon size="lg" variant="light" color={q.color} radius="md">
                          <q.icon size={18} weight="duotone" />
                        </ThemeIcon>
                        <Text size="sm" c="white" style={{ flex: 1 }}>
                          {q.text}
                        </Text>
                      </Group>
                    </Paper>
                  </motion.div>
                ))}
              </Group>
            </Stack>
          </motion.div>
        ) : (
          <Stack gap="lg">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Group
                    align="flex-start"
                    gap="md"
                    style={{
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <ThemeIcon
                      size={40}
                      radius="xl"
                      variant={message.role === 'user' ? 'filled' : 'gradient'}
                      color={message.role === 'user' ? 'blue' : undefined}
                      gradient={message.role === 'assistant' ? { from: '#667eea', to: '#764ba2', deg: 45 } : undefined}
                    >
                      {message.role === 'user' ? (
                        <User size={20} weight="duotone" />
                      ) : (
                        <Robot size={20} weight="duotone" />
                      )}
                    </ThemeIcon>

                    <Paper
                      p="md"
                      radius="lg"
                      maw="75%"
                      style={{
                        background:
                          message.role === 'user'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : message.isError
                            ? 'rgba(255, 100, 100, 0.1)'
                            : 'rgba(255, 255, 255, 0.08)',
                        border: message.isError
                          ? '1px solid rgba(255, 100, 100, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {message.isLoading ? (
                        <Group gap="sm">
                          <Loader size="sm" color="white" />
                          <Text size="sm" c="dimmed">
                            Analyse en cours...
                          </Text>
                        </Group>
                      ) : (
                        <>
                          <Box
                            style={{
                              color: 'white',
                              '& h3': { marginTop: rem(16), marginBottom: rem(8) },
                              '& ul': { paddingLeft: rem(20) },
                              '& li': { marginBottom: rem(4) },
                            }}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h3: ({ children }: { children: React.ReactNode }) => (
                                  <Text size="md" fw={600} c="white" mt="md" mb="xs">
                                    {children}
                                  </Text>
                                ),
                                p: ({ children }: { children: React.ReactNode }) => (
                                  <Text size="sm" c={message.role === 'user' ? 'white' : 'gray.3'} mb="xs">
                                    {children}
                                  </Text>
                                ),
                                ul: ({ children }: { children: React.ReactNode }) => (
                                  <Box component="ul" pl="md" mb="xs">
                                    {children}
                                  </Box>
                                ),
                                li: ({ children }: { children: React.ReactNode }) => (
                                  <Text component="li" size="sm" c="gray.3" mb={4}>
                                    {children}
                                  </Text>
                                ),
                                strong: ({ children }: { children: React.ReactNode }) => (
                                  <Text span fw={600} c="white">
                                    {children}
                                  </Text>
                                ),
                                table: ({ children }: { children: React.ReactNode }) => (
                                  <Box
                                    component="table"
                                    style={{
                                      width: '100%',
                                      borderCollapse: 'collapse',
                                      marginTop: rem(12),
                                      marginBottom: rem(12),
                                      fontSize: rem(13),
                                    }}
                                  >
                                    {children}
                                  </Box>
                                ),
                                thead: ({ children }: { children: React.ReactNode }) => (
                                  <Box
                                    component="thead"
                                    style={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                  >
                                    {children}
                                  </Box>
                                ),
                                tbody: ({ children }: { children: React.ReactNode }) => (
                                  <Box component="tbody">{children}</Box>
                                ),
                                tr: ({ children }: { children: React.ReactNode }) => (
                                  <Box
                                    component="tr"
                                    style={{
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                  >
                                    {children}
                                  </Box>
                                ),
                                th: ({ children }: { children: React.ReactNode }) => (
                                  <Box
                                    component="th"
                                    style={{
                                      padding: `${rem(8)} ${rem(12)}`,
                                      textAlign: 'left',
                                      fontWeight: 600,
                                      color: 'white',
                                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                                    }}
                                  >
                                    {children}
                                  </Box>
                                ),
                                td: ({ children }: { children: React.ReactNode }) => (
                                  <Box
                                    component="td"
                                    style={{
                                      padding: `${rem(8)} ${rem(12)}`,
                                      color: 'rgba(255, 255, 255, 0.8)',
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

                          {message.metadata && (
                            <Group gap="xs" mt="sm">
                              <Badge
                                size="xs"
                                variant="light"
                                color="gray"
                                leftSection={<Clock size={10} />}
                              >
                                {(message.metadata.responseTimeMs! / 1000).toFixed(1)}s
                              </Badge>
                              {message.metadata.tokens && (
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                  leftSection={<Lightning size={10} />}
                                >
                                  {message.metadata.tokens} tokens
                                </Badge>
                              )}
                            </Group>
                          )}
                        </>
                      )}
                    </Paper>
                  </Group>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        )}
      </ScrollArea>

      {/* Input Area */}
      <Box
        p="lg"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Group gap="md">
          <TextInput
            ref={inputRef}
            placeholder="Posez votre question sur les données de formation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="lg"
            radius="xl"
            style={{ flex: 1 }}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                '&:focus': {
                  borderColor: '#667eea',
                },
              },
            }}
          />
          <ActionIcon
            size={50}
            radius="xl"
            variant="gradient"
            gradient={{ from: '#667eea', to: '#764ba2', deg: 45 }}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            loading={isLoading}
          >
            <PaperPlaneRight size={24} weight="fill" />
          </ActionIcon>
        </Group>

        <Group gap="xs" mt="sm" justify="center">
          <Info size={12} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
          <Text size="xs" c="dimmed">
            Les données personnelles (noms, emails) ne sont jamais partagées avec l'IA
          </Text>
        </Group>
      </Box>
    </Box>
  );
}
