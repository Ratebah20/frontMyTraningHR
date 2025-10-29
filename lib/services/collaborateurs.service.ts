import api from '../api';
import { 
  Collaborateur, 
  CollaborateurFilters, 
  UpdateCollaborateurDto, 
  PaginatedResponse,
  SessionFormation 
} from '../types';

export const collaborateursService = {
  // Créer un nouveau collaborateur
  async createCollaborateur(data: {
    matricule?: string;
    idExterne?: string;
    workerSubType?: string;
    nom: string;
    prenom: string;
    genre?: string;
    departementId?: number;
    managerId?: number;
    contratId?: number;
    typeUtilisateur?: string;
    actif?: boolean;
  }): Promise<any> {
    const response = await api.post('/collaborateurs', data);
    return response.data;
  },

  // Récupérer la liste des collaborateurs avec pagination et filtres
  async getCollaborateurs(filters?: CollaborateurFilters): Promise<PaginatedResponse<Collaborateur>> {
    // Créer une copie des filtres pour éviter de modifier l'original
    const params: any = { ...filters };
    
    // S'assurer que actif est envoyé comme string si défini
    if (params.actif !== undefined) {
      params.actif = String(params.actif);
    }
    
    const response = await api.get('/collaborateurs', { 
      params,
      // Forcer axios à ne pas filtrer les valeurs false
      paramsSerializer: {
        serialize: (params: any) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
              searchParams.append(key, params[key]);
            }
          });
          return searchParams.toString();
        }
      }
    });
    return response.data;
  },

  // Récupérer un collaborateur par ID
  async getCollaborateur(id: number): Promise<Collaborateur> {
    const response = await api.get(`/collaborateurs/${id}`);
    return response.data;
  },

  // Récupérer les formations d'un collaborateur
  async getCollaborateurFormations(id: number): Promise<SessionFormation[]> {
    const response = await api.get(`/collaborateurs/${id}/formations`);
    return response.data;
  },

  // Rechercher des collaborateurs
  async searchCollaborateurs(query: string): Promise<Collaborateur[]> {
    const response = await api.get('/collaborateurs/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Mettre à jour un collaborateur
  async updateCollaborateur(id: number, data: UpdateCollaborateurDto): Promise<Collaborateur> {
    const response = await api.put(`/collaborateurs/${id}`, data);
    return response.data;
  },

  // Assigner ou changer le manager d'un collaborateur
  async assignManager(collaborateurId: number, managerId: number | null): Promise<any> {
    const response = await api.patch(`/collaborateurs/${collaborateurId}/assign-manager`, {
      managerId,
    });
    return response.data;
  },

  // Importer des collaborateurs depuis Excel
  async importCollaborateurs(file: File, type: 'initial' | 'olu'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'initial' ? '/import/initial' : '/import/olu';
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 secondes pour l'import
    });
    
    return response.data;
  },

  // Récupérer l'historique des imports
  async getImportHistory(): Promise<any[]> {
    const response = await api.get('/import/history');
    return response.data;
  },

  // Exporter les collaborateurs en CSV
  async exportCollaborateurs(): Promise<Blob> {
    const response = await api.get('/export/collaborateurs.csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};