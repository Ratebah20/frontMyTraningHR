import api from '../api';
import { 
  SessionFormation,
  SessionFormationResponse,
  SessionPaginatedResponse, 
  SessionFilters, 
  CreateSessionDto, 
  UpdateSessionDto, 
  PaginatedResponse 
} from '../types';

export const sessionsService = {
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

  // Récupérer le planning des sessions
  async getPlanning(filters?: SessionFilters): Promise<SessionPaginatedResponse> {
    const response = await api.get('/sessions/planning', { params: filters });
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
};