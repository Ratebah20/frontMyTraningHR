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
  ThemeIcon,
  Title,
  rem,
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneRight } from '@phosphor-icons/react/dist/ssr/PaperPlaneRight';
import { Sparkle } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Stop } from '@phosphor-icons/react/dist/ssr/Stop';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentMessageBubble } from '@/components/ai/AgentMessageBubble';
import { ConversationSidebar } from '@/components/ai/ConversationSidebar';

const SUGGESTED_QUESTIONS = [
  { icon: GraduationCap, text: "Crée une formation Excel Avancé pour le département Finance", color: "violet" },
  { icon: UsersThree, text: "Inscris tous les collaborateurs du département IT à la formation Cybersécurité", color: "blue" },
  { icon: ChartBar, text: "Quel est le taux de conformité des formations obligatoires ?", color: "teal" },
  { icon: Buildings, text: "Quels départements ont le plus formé cette année ?", color: "cyan" },
  { icon: TrendUp, text: "Quel est l'état du budget formation ?", color: "orange" },
];

export default function AIAssistantPage() {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useAgentChat();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-scroll on new messages / streaming content
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
    if (!messageText || isStreaming) return;
    setInputValue('');
    await sendMessage(messageText);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Map conversations for sidebar compatibility
  const sidebarConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title || 'Conversation',
    messages: [],
    createdAt: c.createdAt,
    updatedAt: c.lastActiveAt,
  }));

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
        conversations={sidebarConversations}
        activeConversationId={sessionId || null}
        onSelect={(id) => {
          if (id) loadSession(id);
        }}
        onCreate={clearChat}
        onDelete={(id) => deleteConversation(id)}
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
                  Agent IA Formation
                </Title>
                <Text c="dimmed" size="lg" maw={500} mx="auto" mb={rem(48)}>
                  Je peux creer des formations, planifier des sessions, inscrire des collaborateurs, verifier la conformite et bien plus.
                </Text>

                <Group justify="center" mb="xl">
                  <Badge size="lg" variant="light" color="violet">
                    20+ outils disponibles
                  </Badge>
                  <Badge size="lg" variant="light" color="blue">
                    Streaming temps reel
                  </Badge>
                </Group>

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
              <Stack gap="md">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <AgentMessageBubble message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            </Box>
          )}
        </ScrollArea>

        {/* Error banner */}
        {error && (
          <Box px="xl" py="xs" style={{ backgroundColor: 'rgba(250, 82, 82, 0.08)' }}>
            <Text size="xs" c="red" ta="center">{error}</Text>
          </Box>
        )}

        {/* Input Area */}
        <Box
          px="xl"
          py="lg"
          style={{
            borderTop: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Box style={{ maxWidth: 720, margin: '0 auto' }}>
            <Group gap="sm" align="flex-end">
              <TextInput
                ref={inputRef}
                placeholder={isStreaming ? "L'agent travaille..." : "Demandez quelque chose..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyPress={handleKeyPress}
                disabled={isStreaming}
                size="lg"
                radius="xl"
                style={{ flex: 1 }}
              />
              {isStreaming ? (
                <ActionIcon
                  size={48}
                  radius="xl"
                  variant="filled"
                  color="red"
                  onClick={stopStreaming}
                >
                  <Stop size={22} weight="fill" />
                </ActionIcon>
              ) : (
                <ActionIcon
                  size={48}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'indigo', deg: 45 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                >
                  <PaperPlaneRight size={22} weight="fill" />
                </ActionIcon>
              )}
            </Group>

            <Group gap={4} mt="xs" justify="center">
              <Info size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="xs" c="dimmed">
                L'agent peut executer des actions concretes. Les donnees personnelles restent chiffrees.
              </Text>
            </Group>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
