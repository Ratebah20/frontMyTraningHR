import { Badge } from '@mantine/core';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Users } from '@phosphor-icons/react/dist/ssr/Users';

interface TypeBadgeProps {
  type: string;
  variant?: 'filled' | 'light' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  withIcon?: boolean;
}

export function TypeBadge({ type, variant = 'light', size = 'sm', withIcon = true }: TypeBadgeProps) {
  const isDepartement = type === 'DEPARTEMENT';

  const icon = withIcon ? (
    isDepartement ? (
      <Buildings size={14} weight="fill" />
    ) : (
      <Users size={14} weight="fill" />
    )
  ) : null;

  return (
    <Badge
      color={isDepartement ? 'blue' : 'green'}
      variant={variant}
      size={size}
      leftSection={icon}
    >
      {isDepartement ? 'Département' : 'Équipe'}
    </Badge>
  );
}
