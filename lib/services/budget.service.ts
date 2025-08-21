import api from '../api';

export interface BudgetAnnuel {
  id: number;
  annee: number;
  budgetTotal: number;
  budgetFormation: number;
  budgetAutre?: number;
  commentaire?: string;
  statut: 'actif' | 'cloture' | 'previsionnel';
  dateCreation: string;
  dateModification: string;
  consommation?: {
    montant: number;
    pourcentage: number;
  };
}

export interface CreateBudgetAnnuel {
  annee: number;
  budgetTotal: number;
  budgetFormation: number;
  budgetAutre?: number;
  commentaire?: string;
  statut?: 'actif' | 'cloture' | 'previsionnel';
}

export interface UpdateBudgetAnnuel {
  budgetTotal?: number;
  budgetFormation?: number;
  budgetAutre?: number;
  commentaire?: string;
  statut?: 'actif' | 'cloture' | 'previsionnel';
}

export const budgetService = {
  async getAll(): Promise<BudgetAnnuel[]> {
    const response = await api.get('/budget');
    return response.data;
  },

  async getByYear(annee: number): Promise<BudgetAnnuel> {
    const response = await api.get(`/budget/${annee}`);
    return response.data;
  },

  async create(data: CreateBudgetAnnuel): Promise<BudgetAnnuel> {
    const response = await api.post('/budget', data);
    return response.data;
  },

  async update(id: number, data: UpdateBudgetAnnuel): Promise<BudgetAnnuel> {
    const response = await api.patch(`/budget/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/budget/${id}`);
  }
};