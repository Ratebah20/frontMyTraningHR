import api from '../api';

export const commonService = {
  // Récupérer la liste des départements
  async getDepartements(): Promise<any[]> {
    const response = await api.get('/common/departements');
    return response.data;
  },

  // Récupérer la liste des types de contrats
  async getTypesContrats(): Promise<any[]> {
    const response = await api.get('/common/types-contrats');
    return response.data;
  },

  // Récupérer la liste des organismes de formation
  async getOrganismesFormation(): Promise<any[]> {
    const response = await api.get('/common/organismes');
    return response.data;
  },

  // Récupérer la liste des catégories de formation
  async getCategoriesFormation(includeInactive = false): Promise<any[]> {
    const response = await api.get('/common/categories', {
      params: { includeInactive }
    });
    return response.data;
  },

  // Créer une nouvelle catégorie
  async createCategorieFormation(data: { nomCategorie: string; description?: string }): Promise<any> {
    const response = await api.post('/common/categories', data);
    return response.data;
  },

  // Mettre à jour une catégorie
  async updateCategorieFormation(id: number, data: { nomCategorie?: string; description?: string; actif?: boolean }): Promise<any> {
    const response = await api.put(`/common/categories/${id}`, data);
    return response.data;
  },

  // Supprimer une catégorie
  async deleteCategorieFormation(id: number): Promise<void> {
    await api.delete(`/common/categories/${id}`);
  },

  // Récupérer la liste des types de formation existants
  async getTypesFormation(): Promise<string[]> {
    const response = await api.get('/common/types-formation');
    return response.data;
  },

  // Récupérer la liste des unités de durée existantes
  async getUnitesDuree(): Promise<string[]> {
    const response = await api.get('/common/unites-duree');
    return response.data;
  },
};