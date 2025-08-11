import { ReactNode } from 'react';
import { Tooltip, ThemeIcon } from '@mantine/core';
import { Info } from '@phosphor-icons/react';

interface MetricTooltipProps {
  label: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function MetricTooltip({ label, children, position = 'top' }: MetricTooltipProps) {
  return (
    <Tooltip 
      label={label} 
      position={position}
      withArrow
      multiline
      w={300}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      {children}
    </Tooltip>
  );
}

interface InfoIconTooltipProps {
  tooltip: string;
  size?: number;
  color?: string;
}

export function InfoIconTooltip({ tooltip, size = 14, color = 'dimmed' }: InfoIconTooltipProps) {
  return (
    <MetricTooltip label={tooltip}>
      <ThemeIcon size="xs" variant="transparent" color={color} style={{ cursor: 'help' }}>
        <Info size={size} />
      </ThemeIcon>
    </MetricTooltip>
  );
}