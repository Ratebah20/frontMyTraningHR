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
  totalRows: number;
  processedRows: number;
  collaborateursAdded: number;
  collaborateursUpdated: number;
  formationsAdded: number;
  formationsUpdated: number;
  sessionsAdded: number;
  sessionsUpdated: number;
  errors: { line: number; column?: string; value?: any; message: string; type: 'error' | 'warning' }[];
  warnings: { line: number; column?: string; value?: any; message: string; type: 'error' | 'warning' }[];
  duration: number;
  importLogId?: number;
  // Legacy stats format for backward compatibility
  message?: string;
  stats?: {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors?: any[];
  };
  processingTime?: number;
}

// Mapper les statuts backend vers les statuts frontend
function mapStatus(backendStatus: string | null): 'SUCCESS' | 'PARTIAL' | 'ERROR' {
  if (!backendStatus) return 'ERROR';
  const s = backendStatus.toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED') return 'SUCCESS';
  if (s === 'PARTIAL' || s === 'IN_PROGRESS') return 'PARTIAL';
  return 'ERROR';
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

    const response = await api.post('/import/rh-collaborateurs', formData, {
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

    // Le backend retourne { data: [...], total, limit, offset }
    const raw = response.data;
    const logs = Array.isArray(raw) ? raw : (raw.data || []);

    // Mapper les noms de champs du backend vers le frontend
    return logs.map((log: any) => ({
      id: log.id,
      type: log.typeImport || 'OLU',
      filename: log.nomFichier || '-',
      status: mapStatus(log.statut),
      recordsProcessed: log.nbLignesTraitees || 0,
      recordsCreated: (log.nbCollaborateursAjoutes || 0) + (log.nbFormationsAjoutees || 0) + (log.nbSessionsAjoutees || 0),
      recordsUpdated: 0,
      recordsFailed: 0,
      errorDetails: log.messageErreur,
      createdAt: log.dateImport,
      processingTimeMs: undefined,
    }));
  },
};