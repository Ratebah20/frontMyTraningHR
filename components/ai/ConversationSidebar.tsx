'use client';

import {
  Box,
  Text,
  ActionIcon,
  Stack,
  Group,
  ScrollArea,
  Tooltip,
  rem,
} from '@mantine/core';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import type { Conversation } from '@/hooks/useConversationHistory';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Box
      style={{
        width: 260,
        minWidth: 260,
        background: 'rgba(0, 0, 0, 0.4)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        p="md"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600} c="white">
            Conversations
          </Text>
          <Tooltip label="Nouvelle conversation">
            <ActionIcon
              size="sm"
              variant="light"
              color="violet"
              radius="md"
              onClick={onCreate}
            >
              <Plus size={14} weight="bold" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>

      {/* Conversation list */}
      <ScrollArea style={{ flex: 1 }} p="xs">
        <Stack gap={4}>
          {conversations.length === 0 ? (
            <Box py="xl" px="md" style={{ textAlign: 'center' }}>
              <ChatCircle
                size={32}
                weight="duotone"
                style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: 8 }}
              />
              <Text size="xs" c="dimmed">
                Aucune conversation
              </Text>
              <Text size="xs" c="dimmed">
                Commencez par poser une question
              </Text>
            </Box>
          ) : (
            conversations.map((conv) => (
              <Box
                key={conv.id}
                p="sm"
                style={{
                  borderRadius: rem(8),
                  cursor: 'pointer',
                  background:
                    conv.id === activeConversationId
                      ? 'rgba(102, 126, 234, 0.2)'
                      : 'transparent',
                  border:
                    conv.id === activeConversationId
                      ? '1px solid rgba(102, 126, 234, 0.3)'
                      : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => onSelect(conv.id)}
                onMouseEnter={(e) => {
                  if (conv.id !== activeConversationId) {
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (conv.id !== activeConversationId) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" c="white" lineClamp={1} fw={conv.id === activeConversationId ? 500 : 400}>
                      {conv.title}
                    </Text>
                    <Group gap={4} mt={2}>
                      <Text size="xs" c="dimmed">
                        {formatDate(conv.updatedAt)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        · {conv.messages.filter(m => m.role === 'user').length} msg
                      </Text>
                    </Group>
                  </Box>
                  <Tooltip label="Supprimer">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      style={{ opacity: 0.5 }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = '0.5';
                      }}
                    >
                      <Trash size={12} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Box>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
}
