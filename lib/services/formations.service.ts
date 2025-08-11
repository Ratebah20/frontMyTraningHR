import api from '../api';
import { 
  Formation, 
  FormationFilters, 
  CreateFormationDto, 
  UpdateFormationDto, 
  PaginatedResponse,
  SessionFormation,
  FormationStats 
} from '../types';

export const formationsService = {
  // Récupérer la liste des formations avec pagination et filtres
  async getFormations(filters?: FormationFilters): Promise<PaginatedResponse<Formation>> {
    const response = await api.get('/formations', { params: filters });
    return response.data;
  },

  // Récupérer une formation par ID
  async getFormation(id: number): Promise<Formation> {
    const response = await api.get(`/formations/${id}`);
    return response.data;
  },

  // Récupérer les sessions d'une formation
  async getFormationSessions(id: number, page?: number, limit?: number): Promise<PaginatedResponse<SessionFormation>> {
    const response = await api.get(`/formations/${id}/sessions`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Créer une nouvelle formation
  async createFormation(data: CreateFormationDto): Promise<Formation> {
    const response = await api.post('/formations', data);
    return response.data;
  },

  // Mettre à jour une formation
  async updateFormation(id: number, data: UpdateFormationDto): Promise<Formation> {
    const response = await api.put(`/formations/${id}`, data);
    return response.data;
  },

  // Supprimer une formation (suppression logique)
  async deleteFormation(id: number): Promise<void> {
    await api.delete(`/formations/${id}`);
  },

  // Récupérer les statistiques d'une formation
  async getFormationStats(id: number): Promise<FormationStats> {
    const response = await api.get(`/reports/formation/${id}`);
    return response.data;
  },

  // Exporter les formations en CSV
  async exportFormations(): Promise<Blob> {
    const response = await api.get('/export/formations.csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};