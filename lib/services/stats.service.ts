import api from '../api';
import {
  DashboardStats,
  FormationStats,
  CollaborateurStats,
  DepartementStats,
  ChartData,
  DetailedKPIsResponse,
  ComplianceEthicsKPIsResponse
} from '../types';

export const statsService = {
  // Récupérer les statistiques globales
  async getGlobalStats(): Promise<DashboardStats> {
    const response = await api.get('/stats');
    return response.data;
  },

  // Récupérer le tableau de bord complet
  async getDashboard(params?: { periode?: string; annee?: number }): Promise<any> {
    const response = await api.get('/reports/dashboard', { params });
    return response.data;
  },

  // ==================== NOUVEAUX ENDPOINTS DASHBOARD ====================

  // Récupérer le résumé du dashboard
  async getDashboardSummary(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    const response = await api.get('/stats/dashboard-summary', { params });
    return response.data;
  },

  // Récupérer les données des graphiques
  async getDashboardCharts(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    const response = await api.get('/stats/dashboard-charts', { params });
    return response.data;
  },

  // Récupérer les alertes et notifications
  async getDashboardAlerts(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    const response = await api.get('/stats/dashboard-alerts', { params });
    return response.data;
  },

  // Récupérer les top formations
  async getTopFormations(limit: number = 10): Promise<FormationStats[]> {
    const response = await api.get('/stats/top-formations', {
      params: { limit }
    });
    return response.data;
  },

  // Récupérer les statistiques par département
  async getStatsByDepartment(departementId?: number): Promise<DepartementStats[]> {
    const response = await api.get('/stats/by-department', {
      params: { departementId }
    });
    return response.data;
  },

  // Récupérer le rapport d'un collaborateur
  async getCollaborateurReport(id: number): Promise<CollaborateurStats> {
    const response = await api.get(`/reports/collaborateur/${id}`);
    return response.data;
  },

  // Récupérer le rapport d'un département
  async getDepartementReport(id: number): Promise<DepartementStats> {
    const response = await api.get(`/reports/departement/${id}`);
    return response.data;
  },

  // Récupérer le rapport d'une formation
  async getFormationReport(id: number): Promise<FormationStats> {
    const response = await api.get(`/reports/formation/${id}`);
    return response.data;
  },

  // Exporter un rapport
  async exportReport(type: string, format: 'excel' | 'pdf', filters?: any): Promise<Blob> {
    const response = await api.post('/reports/export', {
      type,
      format,
      filters
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Récupérer les KPIs détaillés par catégorie avec filtres temporels
  async getCollaborateursDetailedKpis(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    includeInactifs?: boolean,
    contratIds?: number[]
  ): Promise<DetailedKPIsResponse> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    if (includeInactifs !== undefined) {
      params.includeInactifs = includeInactifs.toString();
    }
    if (contratIds && contratIds.length > 0) {
      params.contratIds = contratIds.join(',');
    }
    console.log('getCollaborateursDetailedKpis params:', params);
    const response = await api.get('/stats/collaborateurs-detailed-kpis', { params });
    return response.data;
  },

  // Récupérer les KPIs de conformité/éthique
  async getComplianceEthicsKpis(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    includeInactifs?: boolean,
    formationIds?: number[],  // IDs des formations à inclure
    contratIds?: number[]
  ): Promise<ComplianceEthicsKPIsResponse> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    if (includeInactifs !== undefined) {
      params.includeInactifs = includeInactifs.toString();
    }
    if (formationIds && formationIds.length > 0) {
      params.formationIds = formationIds.join(',');
    }
    if (contratIds && contratIds.length > 0) {
      params.contratIds = contratIds.join(',');
    }
    const response = await api.get('/stats/compliance-ethics-kpis', { params });
    return response.data;
  },
};