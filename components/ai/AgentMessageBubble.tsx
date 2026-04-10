'use client';

import { Box, Group, Text, Badge, ThemeIcon } from '@mantine/core';
import { User, Robot } from '@phosphor-icons/react';
import { AgentMessage } from '@/lib/types/ai-agent';
import { StreamingText } from './StreamingText';
import { ToolActivityDisplay } from './ToolActivityDisplay';

interface AgentMessageBubbleProps {
  message: AgentMessage;
}

export function AgentMessageBubble({ message }: AgentMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <Group gap={8} mb={4}>
        {!isUser && (
          <ThemeIcon
            size={24}
            radius="xl"
            variant="gradient"
            gradient={{ from: '#667eea', to: '#764ba2' }}
          >
            <Robot size={14} weight="fill" />
          </ThemeIcon>
        )}
        <Text size="xs" c="dimmed">
          {isUser ? 'Vous' : 'Agent IA'}
        </Text>
        {isUser && (
          <ThemeIcon size={24} radius="xl" color="blue" variant="light">
            <User size={14} weight="fill" />
          </ThemeIcon>
        )}
      </Group>

      <Box
        style={{
          maxWidth: isUser ? '75%' : '90%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser
            ? '#667eea'
            : message.isError
              ? 'rgba(250, 82, 82, 0.08)'
              : 'rgba(102, 126, 234, 0.06)',
          color: isUser ? 'white' : 'inherit',
          fontSize: '14px',
          lineHeight: 1.5,
          border: !isUser ? '1px solid rgba(102, 126, 234, 0.12)' : 'none',
        }}
      >
        {isUser ? (
          <Text size="sm">{message.content}</Text>
        ) : (
          <>
            {message.toolActivities && message.toolActivities.length > 0 && (
              <ToolActivityDisplay activities={message.toolActivities} />
            )}
            <StreamingText
              content={message.content}
              isStreaming={message.isStreaming || false}
            />
          </>
        )}
      </Box>

      {!isUser && message.metadata && !message.isStreaming && (
        <Group gap={4} mt={4}>
          {message.metadata.iterations && message.metadata.iterations > 1 && (
            <Badge size="xs" variant="light" color="violet">
              {message.metadata.iterations} etapes
            </Badge>
          )}
          {message.metadata.inputTokens !== undefined && (
            <Badge size="xs" variant="light" color="gray">
              {message.metadata.inputTokens + (message.metadata.outputTokens || 0)} tokens
            </Badge>
          )}
        </Group>
      )}
    </Box>
  );
}
