'use client';

import { Progress, Text, Group, Badge } from '@mantine/core';
import { UsersThree, Warning } from '@phosphor-icons/react';

interface CapacityIndicatorProps {
  current: number;
  max?: number;
  showPercentage?: boolean;
  showNumbers?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function CapacityIndicator({
  current,
  max,
  showPercentage = true,
  showNumbers = true,
  size = 'sm'
}: CapacityIndicatorProps) {
  if (!max) {
    return (
      <Group gap="xs">
        <UsersThree size={16} />
        <Text size="sm">{current} participant{current > 1 ? 's' : ''}</Text>
      </Group>
    );
  }

  const percentage = (current / max) * 100;
  const isFull = current >= max;
  const isNearFull = percentage >= 80;

  const getColor = () => {
    if (isFull) return 'red';
    if (isNearFull) return 'orange';
    return 'blue';
  };

  return (
    <div>
      {showNumbers && (
        <Group justify="space-between" mb={5}>
          <Group gap="xs">
            <UsersThree size={16} />
            <Text size="sm" fw={500}>
              {current} / {max} participants
            </Text>
          </Group>
          {isFull && (
            <Badge color="red" size="xs" variant="filled" leftSection={<Warning size={12} />}>
              Complet
            </Badge>
          )}
          {isNearFull && !isFull && (
            <Badge color="orange" size="xs" variant="light">
              Presque complet
            </Badge>
          )}
        </Group>
      )}

      <Progress
        value={percentage}
        color={getColor()}
        size={size}
        radius="sm"
      />

      {showPercentage && (
        <Text size="xs" c="dimmed" mt={4}>
          {percentage.toFixed(0)}% de capacité utilisée
        </Text>
      )}
    </div>
  );
}
