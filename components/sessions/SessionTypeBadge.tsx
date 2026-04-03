'use client';

import { Badge } from '@mantine/core';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';

interface SessionTypeBadgeProps {
  type: 'individuelle' | 'collective';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withIcon?: boolean;
}

export function SessionTypeBadge({
  type,
  size = 'sm',
  withIcon = true
}: SessionTypeBadgeProps) {
  const isCollective = type === 'collective';

  return (
    <Badge
      size={size}
      color={isCollective ? 'blue' : 'gray'}
      variant="light"
      leftSection={
        withIcon ? (
          isCollective ? (
            <UsersThree size={14} />
          ) : (
            <User size={14} />
          )
        ) : undefined
      }
    >
      {isCollective ? 'Collective' : 'Individuelle'}
    </Badge>
  );
}
