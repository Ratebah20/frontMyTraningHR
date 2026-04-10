'use client';

import { Box, Group, Text, Badge, Loader, Collapse, Paper, Stack } from '@mantine/core';
import { CheckCircle, XCircle, Gear } from '@phosphor-icons/react';
import { useState } from 'react';
import { ToolActivity, TOOL_DISPLAY_NAMES } from '@/lib/types/ai-agent';

interface ToolActivityDisplayProps {
  activities: ToolActivity[];
}

function ToolActivityItem({ activity }: { activity: ToolActivity }) {
  const [expanded, setExpanded] = useState(false);
  const displayName = TOOL_DISPLAY_NAMES[activity.toolName] || activity.toolName;

  return (
    <Paper
      p="xs"
      radius="sm"
      style={{
        backgroundColor: activity.status === 'error'
          ? 'rgba(250, 82, 82, 0.08)'
          : 'rgba(102, 126, 234, 0.06)',
        cursor: activity.result ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: activity.status === 'error'
          ? 'rgba(250, 82, 82, 0.2)'
          : 'rgba(102, 126, 234, 0.15)',
      }}
      onClick={() => activity.result && setExpanded(!expanded)}
    >
      <Group gap="xs">
        {activity.status === 'running' && (
          <Loader size={14} type="dots" color="blue" />
        )}
        {activity.status === 'completed' && (
          <CheckCircle size={16} weight="fill" color="#40c057" />
        )}
        {activity.status === 'error' && (
          <XCircle size={16} weight="fill" color="#fa5252" />
        )}

        <Text size="xs" fw={500} style={{ flex: 1 }}>
          {displayName}
        </Text>

        {activity.durationMs !== undefined && (
          <Badge size="xs" variant="light" color="gray">
            {activity.durationMs}ms
          </Badge>
        )}
      </Group>

      {activity.result && (
        <Collapse in={expanded}>
          <Box
            mt="xs"
            p="xs"
            style={{
              backgroundColor: 'rgba(0,0,0,0.03)',
              borderRadius: 4,
              fontSize: '11px',
              fontFamily: 'monospace',
              maxHeight: 200,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {(() => {
              try {
                return JSON.stringify(JSON.parse(activity.result!), null, 2);
              } catch {
                return activity.result;
              }
            })()}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
}

export function ToolActivityDisplay({ activities }: ToolActivityDisplayProps) {
  if (!activities || activities.length === 0) return null;

  return (
    <Stack gap={4} mt="xs">
      {activities.map((activity) => (
        <ToolActivityItem key={activity.toolId} activity={activity} />
      ))}
    </Stack>
  );
}
