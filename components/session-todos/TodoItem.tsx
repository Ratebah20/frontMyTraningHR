'use client';

import { useState } from 'react';
import { Paper, Group, Checkbox, Text, Badge, ActionIcon, Menu, Tooltip } from '@mantine/core';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { DotsThree } from '@phosphor-icons/react/dist/ssr/DotsThree';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { Paperclip } from '@phosphor-icons/react/dist/ssr/Paperclip';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SessionTodo } from '@/lib/types';
import AttachmentManager from '@/components/attachments/AttachmentManager';

interface TodoItemProps {
  todo: SessionTodo;
  onToggle: (todoId: number) => Promise<void>;
  onEdit: (todo: SessionTodo) => void;
  onDelete: (todoId: number) => Promise<void>;
  draggable?: boolean;
}

const PRIORITE_COLORS: Record<string, string> = {
  bas: 'gray',
  normal: 'blue',
  haut: 'red',
};

const PRIORITE_LABELS: Record<string, string> = {
  bas: 'Basse',
  normal: 'Normale',
  haut: 'Haute',
};

const CATEGORIE_ICONS: Record<string, string> = {
  doc_admin: '📄',
  equipement: '💼',
  logistique: '🚗',
  budget: '💰',
  communication: '📧',
  autre: '✅',
};

const CATEGORIE_LABELS: Record<string, string> = {
  doc_admin: 'Documents',
  equipement: 'Équipement',
  logistique: 'Logistique',
  budget: 'Budget',
  communication: 'Communication',
  autre: 'Autre',
};

export default function TodoItem({ todo, onToggle, onEdit, onDelete, draggable }: TodoItemProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(todo.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(todo.id);
    } finally {
      setDeleting(false);
    }
  };

  const isOverdue = todo.dateEcheance && !todo.isCompleted && isPast(new Date(todo.dateEcheance));

  return (
    <Paper
      p="md"
      withBorder
      style={{
        opacity: deleting ? 0.5 : todo.isCompleted ? 0.7 : 1,
        transition: 'all 0.2s',
        cursor: draggable ? 'grab' : 'default',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" style={{ flex: 1 }}>
          <Checkbox
            checked={todo.isCompleted}
            onChange={handleToggle}
            disabled={loading || deleting}
            size="md"
          />

          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Text
                fw={500}
                style={{
                  textDecoration: todo.isCompleted ? 'line-through' : 'none',
                }}
              >
                {todo.titre}
              </Text>

              <Badge size="sm" color={PRIORITE_COLORS[todo.priorite]}>
                {PRIORITE_LABELS[todo.priorite]}
              </Badge>

              {todo.categorie && (
                <Badge size="sm" variant="light">
                  {CATEGORIE_ICONS[todo.categorie]} {CATEGORIE_LABELS[todo.categorie]}
                </Badge>
              )}

              {todo.dateEcheance && (
                <Tooltip label={format(new Date(todo.dateEcheance), 'PPP', { locale: fr })}>
                  <Badge
                    size="sm"
                    color={isOverdue ? 'red' : 'gray'}
                    variant="light"
                    leftSection={<CalendarBlank size={14} />}
                  >
                    {format(new Date(todo.dateEcheance), 'dd MMM', { locale: fr })}
                  </Badge>
                </Tooltip>
              )}

              <AttachmentManager targetType="todo" targetId={todo.id} compact />
            </Group>

            {todo.description && (
              <Text size="sm" c="dimmed">
                {todo.description}
              </Text>
            )}
          </div>
        </Group>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" disabled={deleting}>
              <DotsThree size={20} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<PencilSimple size={16} />}
              onClick={() => onEdit(todo)}
            >
              Modifier
            </Menu.Item>
            <Menu.Item
              leftSection={<Trash size={16} />}
              color="red"
              onClick={handleDelete}
            >
              Supprimer
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
}
