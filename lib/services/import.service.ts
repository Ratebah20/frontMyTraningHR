import api from '../api';

export interface ImportHistory {
  id: number;
  type: 'INITIAL' | 'OLU' | 'COLLABORATEURS';
  filename: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorDetails?: string;
  createdAt: string;
  completedAt?: string;
  processingTimeMs?: number;
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors?: any[];
  };
  processingTime?: number;
}

export const importService = {
  // Import initial depuis fichier SUIVI_FORMATIONS
  async importInitial(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/initial', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 320000, // 5 minutes + 20 secondes de marge
    });
    
    return response.data;
  },

  // Import récurrent depuis export OLU
  async importOlu(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/olu', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 320000, // 5 minutes + 20 secondes de marge
    });

    return response.data;
  },

  // Import fichier collaborateurs
  async importCollaborateurs(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/collaborateurs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 320000, // 5 minutes + 20 secondes de marge
    });

    return response.data;
  },

  // Récupérer l'historique des imports
  async getImportHistory(limit = 10, offset = 0): Promise<ImportHistory[]> {
    const response = await api.get('/import/history', {
      params: { limit, offset },
    });
    
    return response.data;
  },
};