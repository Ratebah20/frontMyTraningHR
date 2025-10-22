import api from '../api';
import {
  Departement,
  DepartementDetail,
  CreateDepartementDto,
  UpdateDepartementDto,
  DepartementFilters,
  Collaborateur
} from '../types';

export const departementsService = {
  /**
   * Récupérer la liste des départements
   */
  async getAll(filters?: DepartementFilters): Promise<Departement[]> {
    const response = await api.get('/departements', {
      params: filters
    });
    return response.data;
  },

  /**
   * Récupérer les détails d'un département
   */
  async getById(id: number): Promise<DepartementDetail> {
    const response = await api.get(`/departements/${id}`);
    return response.data;
  },

  /**
   * Créer un nouveau département
   */
  async create(data: CreateDepartementDto): Promise<Departement> {
    const response = await api.post('/departements', data);
    return response.data;
  },

  /**
   * Mettre à jour un département
   */
  async update(id: number, data: UpdateDepartementDto): Promise<Departement> {
    const response = await api.put(`/departements/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un département
   */
  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/departements/${id}`);
    return response.data;
  },

  /**
   * Récupérer les collaborateurs d'un département
   */
  async getCollaborateurs(id: number, includeInactive: boolean = false): Promise<Collaborateur[]> {
    const response = await api.get(`/departements/${id}/collaborateurs`, {
      params: { includeInactive }
    });
    return response.data;
  },

  /**
   * Compter les collaborateurs d'un département
   */
  async countCollaborateurs(id: number): Promise<{ total: number; actifs: number }> {
    const response = await api.get(`/departements/${id}/collaborateurs/count`);
    return response.data;
  },
};
