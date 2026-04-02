'use client';

import { useState, useEffect } from 'react';
import { Stack, Group, Button, Text, Progress, Card, Select, Badge, Loader, Alert } from '@mantine/core';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { ListChecks } from '@phosphor-icons/react/dist/ssr/ListChecks';
import { FunnelSimple } from '@phosphor-icons/react/dist/ssr/FunnelSimple';
import { notifications } from '@mantine/notifications';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import TodoTemplateSelector from './TodoTemplateSelector';
import {
  getGroupedSessionTodos,
  getGroupedSessionTodosStats,
  createGroupedSessionTodo,
  updateGroupedSessionTodo,
  toggleGroupedSessionTodo,
  deleteGroupedSessionTodo,
} from '@/lib/services/grouped-session-todos.service';
import type { GroupedSessionTodo, CreateSessionTodoDto, UpdateSessionTodoDto, TodoStats } from '@/lib/types';

interface TodoListProps {
  groupKey: string;
  typeFormation?: string;
}

export function TodoList({ groupKey, typeFormation }: TodoListProps) {
  const [todos, setTodos] = useState<GroupedSessionTodo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpened, setFormOpened] = useState(false);
  const [templateOpened, setTemplateOpened] = useState(false);
  const [editingTodo, setEditingTodo] = useState<GroupedSessionTodo | undefined>(undefined);

  // Filtres
  const [filterCategorie, setFilterCategorie] = useState<string | null>(null);
  const [filterPriorite, setFilterPriorite] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string | null>(null);

  useEffect(() => {
    loadTodos();
  }, [groupKey]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const [todosData, statsData] = await Promise.all([
        getGroupedSessionTodos(groupKey),
        getGroupedSessionTodosStats(groupKey),
      ]);
      setTodos(todosData);
      setStats(statsData);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les tâches',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (data: CreateSessionTodoDto) => {
    try {
      await createGroupedSessionTodo(groupKey, data);
      await loadTodos();
    } catch (error: any) {
      throw error; // Relancer l'erreur pour que TodoForm puisse la gérer
    }
  };

  const handleUpdateTodo = async (data: UpdateSessionTodoDto) => {
    if (!editingTodo) return;
    try {
      await updateGroupedSessionTodo(groupKey, editingTodo.id, data);
      await loadTodos();
    } catch (error: any) {
      throw error;
    }
  };

  const handleToggleTodo = async (todoId: number) => {
    try {
      await toggleGroupedSessionTodo(groupKey, todoId);
      await loadTodos();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de modifier le statut de la tâche',
        color: 'red',
      });
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await deleteGroupedSessionTodo(groupKey, todoId);
      await loadTodos();
      notifications.show({
        title: 'Succès',
        message: 'Tâche supprimée avec succès',
        color: 'green',
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer la tâche',
        color: 'red',
      });
    }
  };

  const handleOpenEditForm = (todo: GroupedSessionTodo) => {
    setEditingTodo(todo);
    setFormOpened(true);
  };

  const handleCloseForm = () => {
    setFormOpened(false);
    setEditingTodo(undefined);
  };

  const handleTemplateApplied = () => {
    loadTodos();
  };

  // Filtrer les todos
  const filteredTodos = todos.filter((todo) => {
    if (filterCategorie && todo.categorie !== filterCategorie) return false;
    if (filterPriorite && todo.priorite !== filterPriorite) return false;
    if (filterStatut === 'completed' && !todo.isCompleted) return false;
    if (filterStatut === 'pending' && todo.isCompleted) return false;
    return true;
  });

  if (loading) {
    return (
      <Card withBorder p="xl">
        <Group justify="center">
          <Loader size="lg" />
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Card withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <ListChecks size={24} weight="duotone" />
            <Text size="lg" fw={600}>
              Checklist de préparation
            </Text>
            {stats && (
              <Badge size="lg" variant="light">
                {stats.completed}/{stats.total}
              </Badge>
            )}
          </Group>

          <Group>
            <Button
              variant="light"
              leftSection={<FunnelSimple size={16} />}
              onClick={() => setTemplateOpened(true)}
            >
              Charger un template
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setFormOpened(true)}
            >
              Ajouter une tâche
            </Button>
          </Group>
        </Group>

        {stats && stats.total > 0 && (
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Progression
              </Text>
              <Text size="sm" fw={600}>
                {stats.progress}%
              </Text>
            </Group>
            <Progress value={stats.progress} size="lg" radius="xl" />
          </div>
        )}
      </Card>

      {todos.length > 0 && (
        <Card withBorder p="md">
          <Group mb="md">
            <Select
              placeholder="Filtrer par catégorie"
              data={[
                { value: 'doc_admin', label: '📄 Documents' },
                { value: 'equipement', label: '💼 Équipement' },
                { value: 'logistique', label: '🚗 Logistique' },
                { value: 'budget', label: '💰 Budget' },
                { value: 'communication', label: '📧 Communication' },
                { value: 'autre', label: '✅ Autre' },
              ]}
              value={filterCategorie}
              onChange={setFilterCategorie}
              clearable
              style={{ flex: 1 }}
            />

            <Select
              placeholder="Filtrer par priorité"
              data={[
                { value: 'bas', label: 'Basse' },
                { value: 'normal', label: 'Normale' },
                { value: 'haut', label: 'Haute' },
              ]}
              value={filterPriorite}
              onChange={setFilterPriorite}
              clearable
              style={{ flex: 1 }}
            />

            <Select
              placeholder="Filtrer par statut"
              data={[
                { value: 'pending', label: 'En attente' },
                { value: 'completed', label: 'Complété' },
              ]}
              value={filterStatut}
              onChange={setFilterStatut}
              clearable
              style={{ flex: 1 }}
            />
          </Group>
        </Card>
      )}

      {filteredTodos.length === 0 ? (
        <Alert title="Aucune tâche" color="blue">
          {todos.length === 0
            ? 'Aucune tâche n\'a été ajoutée à cette formation. Cliquez sur "Charger un template" pour démarrer rapidement ou "Ajouter une tâche" pour créer une tâche personnalisée.'
            : 'Aucune tâche ne correspond aux filtres sélectionnés.'}
        </Alert>
      ) : (
        <Stack gap="sm">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteTodo}
            />
          ))}
        </Stack>
      )}

      <TodoForm
        opened={formOpened}
        onClose={handleCloseForm}
        onSubmit={editingTodo ? handleUpdateTodo : (data) => handleCreateTodo(data as CreateSessionTodoDto)}
        todo={editingTodo}
        mode={editingTodo ? 'edit' : 'create'}
      />

      <TodoTemplateSelector
        opened={templateOpened}
        onClose={() => setTemplateOpened(false)}
        groupKey={groupKey}
        typeFormation={typeFormation}
        onTemplateApplied={handleTemplateApplied}
      />
    </Stack>
  );
}
