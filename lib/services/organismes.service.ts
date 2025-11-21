import api from '../api';
import { OrganismeFormation } from '../types';

export interface CreateOrganismeDto {
  nomOrganisme: string;
  typeOrganisme?: string;
  contact?: string;
  actif?: boolean;
}

export interface UpdateOrganismeDto {
  nomOrganisme?: string;
  typeOrganisme?: string;
  contact?: string;
  actif?: boolean;
}

export interface OrganismeStatistics {
  totalOrganismes: number;
  organismesActifs: number;
  organismesInactifs: number;
  topByFormations: {
    id: number;
    nomOrganisme: string;
    nbFormations: number;
  }[];
  topBySessions: {
    id: number;
    nomOrganisme: string;
    nbSessions: number;
  }[];
}

export const organismesService = {
  // Récupérer la liste des organismes
  async getOrganismes(includeInactive = false): Promise<OrganismeFormation[]> {
    const response = await api.get('/organismes', {
      params: { includeInactive },
    });
    return response.data;
  },

  // Récupérer un organisme par ID
  async getOrganisme(id: number): Promise<OrganismeFormation> {
    const response = await api.get(`/organismes/${id}`);
    return response.data;
  },

  // Créer un nouvel organisme
  async createOrganisme(data: CreateOrganismeDto): Promise<OrganismeFormation> {
    const response = await api.post('/organismes', data);
    return response.data;
  },

  // Mettre à jour un organisme
  async updateOrganisme(id: number, data: UpdateOrganismeDto): Promise<OrganismeFormation> {
    const response = await api.put(`/organismes/${id}`, data);
    return response.data;
  },

  // Désactiver un organisme (suppression logique)
  async deleteOrganisme(id: number): Promise<{ message: string; affectedFormations: number; affectedSessions: number }> {
    const response = await api.delete(`/organismes/${id}`);
    return response.data;
  },

  // Récupérer les statistiques globales
  async getStatistics(): Promise<OrganismeStatistics> {
    const response = await api.get('/organismes/statistics');
    return response.data;
  },
};
