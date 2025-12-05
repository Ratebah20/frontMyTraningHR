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
