'use client';

import { Radio, Group, Text, Paper, Stack } from '@mantine/core';
import { User, UsersThree } from '@phosphor-icons/react';

interface SessionTypeSelectorProps {
  value: 'individuelle' | 'collective';
  onChange: (value: 'individuelle' | 'collective') => void;
  disabled?: boolean;
}

export function SessionTypeSelector({
  value,
  onChange,
  disabled = false
}: SessionTypeSelectorProps) {
  return (
    <Radio.Group
      value={value}
      onChange={(val) => onChange(val as 'individuelle' | 'collective')}
      label="Type de session"
      description="Choisissez le type de session à créer"
      withAsterisk
    >
      <Group mt="xs" grow>
        <Paper
          p="md"
          withBorder
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: value === 'individuelle' ? 'var(--mantine-color-blue-6)' : undefined,
            borderWidth: value === 'individuelle' ? 2 : 1,
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={() => !disabled && onChange('individuelle')}
        >
          <Group wrap="nowrap">
            <Radio
              value="individuelle"
              disabled={disabled}
              styles={{ radio: { cursor: 'pointer' } }}
            />
            <Stack gap={4} style={{ flex: 1 }}>
              <Group gap="xs">
                <User size={18} />
                <Text fw={500}>Session individuelle</Text>
              </Group>
              <Text size="xs" c="dimmed">
                1 session = 1 collaborateur
              </Text>
              <Text size="xs" c="dimmed">
                Parfait pour les formations personnalisées ou à la demande
              </Text>
            </Stack>
          </Group>
        </Paper>

        <Paper
          p="md"
          withBorder
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: value === 'collective' ? 'var(--mantine-color-blue-6)' : undefined,
            borderWidth: value === 'collective' ? 2 : 1,
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={() => !disabled && onChange('collective')}
        >
          <Group wrap="nowrap">
            <Radio
              value="collective"
              disabled={disabled}
              styles={{ radio: { cursor: 'pointer' } }}
            />
            <Stack gap={4} style={{ flex: 1 }}>
              <Group gap="xs">
                <UsersThree size={18} />
                <Text fw={500}>Session collective</Text>
              </Group>
              <Text size="xs" c="dimmed">
                1 session = plusieurs participants
              </Text>
              <Text size="xs" c="dimmed">
                Idéal pour les formations de groupe, séminaires, etc.
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Group>
    </Radio.Group>
  );
}
