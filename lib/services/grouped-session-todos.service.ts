import api from '../api';
import type {
  GroupedSessionTodo,
  CreateSessionTodoDto,
  UpdateSessionTodoDto,
  ReorderTodosDto,
  TodoTemplate,
  TodoStats,
} from '../types';

/**
 * Service pour gérer les todos de sessions groupées
 */

// Récupérer tous les todos d'un groupe
export const getGroupedSessionTodos = async (groupKey: string): Promise<GroupedSessionTodo[]> => {
  const response = await api.get(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos`);
  return response.data;
};

// Récupérer un todo spécifique
export const getGroupedSessionTodo = async (groupKey: string, todoId: number): Promise<GroupedSessionTodo> => {
  const response = await api.get(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/${todoId}`);
  return response.data;
};

// Récupérer les statistiques des todos d'un groupe
export const getGroupedSessionTodosStats = async (groupKey: string): Promise<TodoStats> => {
  const response = await api.get(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/stats`);
  return response.data;
};

// Créer un nouveau todo
export const createGroupedSessionTodo = async (
  groupKey: string,
  data: CreateSessionTodoDto
): Promise<GroupedSessionTodo> => {
  const url = `/sessions/grouped/${encodeURIComponent(groupKey)}/todos`;
  const response = await api.post(url, data);
  return response.data;
};

// Mettre à jour un todo
export const updateGroupedSessionTodo = async (
  groupKey: string,
  todoId: number,
  data: UpdateSessionTodoDto
): Promise<GroupedSessionTodo> => {
  const response = await api.put(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/${todoId}`, data);
  return response.data;
};

// Basculer l'état complété d'un todo
export const toggleGroupedSessionTodo = async (groupKey: string, todoId: number): Promise<GroupedSessionTodo> => {
  const response = await api.patch(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/${todoId}/toggle`);
  return response.data;
};

// Supprimer un todo
export const deleteGroupedSessionTodo = async (groupKey: string, todoId: number): Promise<void> => {
  await api.delete(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/${todoId}`);
};

// Réorganiser les todos
export const reorderGroupedSessionTodos = async (
  groupKey: string,
  data: ReorderTodosDto
): Promise<GroupedSessionTodo[]> => {
  const response = await api.patch(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/reorder`, data);
  return response.data;
};

// Récupérer tous les templates disponibles
export const getTodoTemplates = async (typeFormation?: string): Promise<TodoTemplate[]> => {
  const params = typeFormation ? { typeFormation } : {};
  const response = await api.get('/todo-templates', { params });
  return response.data;
};

// Créer des todos à partir d'un template
export const createTodosFromTemplate = async (
  groupKey: string,
  templateId: number
): Promise<GroupedSessionTodo[]> => {
  const response = await api.post(`/sessions/grouped/${encodeURIComponent(groupKey)}/todos/from-template/${templateId}`);
  return response.data;
};

export default {
  getGroupedSessionTodos,
  getGroupedSessionTodo,
  getGroupedSessionTodosStats,
  createGroupedSessionTodo,
  updateGroupedSessionTodo,
  toggleGroupedSessionTodo,
  deleteGroupedSessionTodo,
  reorderGroupedSessionTodos,
  getTodoTemplates,
  createTodosFromTemplate,
};
