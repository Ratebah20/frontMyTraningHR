import api from '../api';
import {
  SessionFormation,
  SessionFormationResponse,
  SessionPaginatedResponse,
  SessionFilters,
  CreateSessionDto,
  UpdateSessionDto,
  PaginatedResponse,
  GroupedSessionPaginatedResponse
} from '../types';

export const sessionsService = {
  // Récupérer les statistiques globales
  async getGlobalStats(): Promise<{
    total: number;
    inscrites: number;
    enCours: number;
    terminees: number;
    annulees: number;
  }> {
    const response = await api.get('/sessions/stats');
    return response.data;
  },

  // Récupérer le nombre de sessions groupées (groupes de 2+ sessions)
  async getGroupedSessionsCount(): Promise<{ count: number }> {
    const response = await api.get('/sessions/stats/grouped-count');
    return response.data;
  },

  // Récupérer une session par ID
  async getSession(id: number): Promise<SessionFormation> {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  // Créer une nouvelle session (inscription)
  async createSession(data: CreateSessionDto): Promise<SessionFormation> {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  // Mettre à jour une session
  async updateSession(id: number, data: UpdateSessionDto): Promise<SessionFormation> {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },

  // Annuler une session
  async cancelSession(id: number): Promise<void> {
    await api.delete(`/sessions/${id}`);
  },

  // Aperçu de la suppression d'une session
  async getDeletePreview(id: number): Promise<{
    session: { id: number; statut: string; dateDebut: string; dateFin: string };
    formation: { id: number; nomFormation: string; codeFormation: string } | null;
    collaborateur: { id: number; nom: string; prenom: string; email: string; departement: { nomDepartement: string } | null } | null;
    avertissement: string | null;
    canDelete: boolean;
  }> {
    const response = await api.get(`/sessions/${id}/delete-preview`);
    return response.data;
  },

  // Supprimer une session avec confirmation et détails
  async deleteSessionWithConfirmation(id: number): Promise<{
    success: boolean;
    message: string;
    details: { collaborateurAffecte: string | null; formation: string | null };
  }> {
    const response = await api.delete(`/sessions/${id}/confirm`);
    return response.data;
  },

  // Récupérer le planning des sessions
  async getPlanning(filters?: SessionFilters): Promise<SessionPaginatedResponse> {
    const response = await api.get('/sessions/planning', { params: filters });
    return response.data;
  },

  // Récupérer les sessions groupées par formation
  async getGroupedSessions(filters?: SessionFilters): Promise<GroupedSessionPaginatedResponse> {
    const response = await api.get('/sessions/grouped', { params: filters });
    return response.data;
  },

  // Récupérer une session groupée par son groupKey
  async getGroupedSessionByKey(groupKey: string): Promise<any> {
    const response = await api.get(`/sessions/grouped/${groupKey}`);
    return response.data;
  },

  // Récupérer les sessions d'un collaborateur
  async getCollaborateurSessions(collaborateurId: number, filters?: SessionFilters): Promise<SessionPaginatedResponse> {
    const response = await api.get(`/sessions/collaborateur/${collaborateurId}`, { params: filters });
    return response.data;
  },

  // Exporter les sessions en CSV
  async exportSessions(): Promise<Blob> {
    const response = await api.get('/export/sessions.csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Inscrire plusieurs collaborateurs à une formation
  async bulkEnroll(formationId: number, collaborateurIds: number[]): Promise<SessionFormation[]> {
    const promises = collaborateurIds.map(collaborateurId =>
      this.createSession({
        collaborateurId,
        formationId,
        statut: 'inscrit',
      })
    );

    return Promise.all(promises);
  },

  // Récupérer la liste des organismes de formation
  async getOrganismes(): Promise<any[]> {
    const response = await api.get('/common/organismes');
    return response.data;
  },
};