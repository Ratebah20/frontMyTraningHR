import api from '../api';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  actif?: boolean;
  statut?: string;
}

export type ExportType = 'collaborateurs' | 'formations' | 'sessions';

export const exportsService = {
  async exportCollaborateurs(filters?: ExportFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.actif !== undefined) params.append('actif', String(filters.actif));

    const queryString = params.toString();
    const url = `/export/collaborateurs.csv${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportFormations(filters?: ExportFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = `/export/formations.csv${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportSessions(filters?: ExportFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.actif !== undefined) params.append('actif', String(filters.actif));
    if (filters?.statut) params.append('statut', filters.statut);

    const queryString = params.toString();
    const url = `/export/sessions.csv${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportFormationsObligatoires(
    annee?: number,
    // Périmètre d'obligation : sans lui, l'export renvoyait toujours les
    // obligatoires annuelles, même depuis l'onglet Onboarding.
    // 'securite' = formations de sécurité au travail (SST), accepté par
    // l'endpoint au même titre que les deux autres périmètres.
    type?: 'annuelle' | 'onboarding' | 'securite',
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (annee) params.append('annee', String(annee));
    if (type) params.append('type', type);

    const queryString = params.toString();
    const url = `/export/formations-obligatoires.xlsx${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exports Excel des pages KPI, sur le modèle de l'export des formations
   * obligatoires : un classeur par page, une feuille par bloc de l'écran.
   */
  async exportBilanAnnuel(annee: number): Promise<Blob> {
    const response = await api.get(`/export/bilan-annuel.xlsx?annee=${annee}`, { responseType: 'blob' });
    return response.data;
  },

  async exportKpiCollaborateurs(filters: {
    periode?: 'annee' | 'mois' | 'plage';
    date?: string;
    startDate?: string;
    endDate?: string;
    includeInactifs?: boolean;
    contratIds?: number[];
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.periode) params.append('periode', filters.periode);
    if (filters.periode === 'plage') {
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    } else if (filters.date) {
      params.append('date', filters.date);
    }
    if (filters.includeInactifs) params.append('includeInactifs', 'true');
    if (filters.contratIds && filters.contratIds.length > 0) params.append('contratIds', filters.contratIds.join(','));
    const queryString = params.toString();
    const response = await api.get(`/export/kpi-collaborateurs.xlsx${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportObjectifsLd(filters: {
    periode?: 'annee' | 'mois' | 'plage';
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.periode) params.append('periode', filters.periode);
    if (filters.periode === 'plage') {
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    } else if (filters.date) {
      params.append('date', filters.date);
    }
    const queryString = params.toString();
    const response = await api.get(`/export/objectifs-ld.xlsx${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportRelances(filters: {
    type?: string;
    destinataireType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.destinataireType) params.append('destinataireType', filters.destinataireType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    const response = await api.get(`/export/relances.xlsx${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  generateFilename(type: ExportType, filters?: ExportFilters): string {
    const date = new Date().toISOString().split('T')[0];
    if (filters?.startDate && filters?.endDate) {
      return `${type}_${filters.startDate}_${filters.endDate}.csv`;
    }
    return `${type}_${date}.csv`;
  },
};
