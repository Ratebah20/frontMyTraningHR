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
    const response = await api.get('/stats/collaborateurs-detailed-kpis', { params });
    return response.data;
  },

  // Récupérer les KPIs détaillés des formations obligatoires
  async getMandatoryTrainingsKPIs(
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
    const response = await api.get('/stats/mandatory-trainings-kpis', { params });
    return response.data;
  },

  // Récupérer les formations obligatoires manquantes groupées par manager
  async getMandatoryTrainingsByManager(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    departementId?: number
  ): Promise<any> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    if (departementId) params.departementId = departementId;
    const response = await api.get('/stats/mandatory-trainings-by-manager', { params });
    return response.data;
  },

  // Récupérer les KPIs des objectifs L&D
  async getLdObjectivesKpis(
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
    const response = await api.get('/stats/ld-objectives', { params });
    return response.data;
  },

  // Récupérer les objectifs cibles par catégorie
  async getLdObjectiveTargets(): Promise<{ categorieId: number; categorieNom: string; objectifCible: number }[]> {
    const response = await api.get('/stats/ld-objectives/targets');
    return response.data;
  },

  // Mettre à jour les objectifs cibles par catégorie
  async updateLdObjectiveTargets(targets: { categorieId: number; objectifCible: number }[]): Promise<any> {
    const response = await api.put('/stats/ld-objectives/targets', targets);
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

  // Envoyer des rappels de formations obligatoires aux managers
  async sendMandatoryTrainingReminders(
    managerIds: number[],
    periode: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    message: string;
    periode: string;
    totalManagers: number;
    envoyesAvecSucces: number;
    erreurs: number;
    details: Array<{
      managerId: number;
      managerNom: string;
      managerEmail: string;
      success: boolean;
      messageId?: string;
      error?: string;
      collaborateursCount: number;
      formationsCount: number;
    }>;
  }> {
    const body: any = { managerIds, periode };
    if (periode === 'plage') {
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
    } else {
      if (date) body.date = date;
    }
    const response = await api.post('/notifications/send-mandatory-training-reminders', body);
    return response.data;
  },

  // Vérifier le statut du service email
  async checkEmailStatus(): Promise<{
    configured: boolean;
    connectionValid: boolean;
    message: string;
  }> {
    const response = await api.get('/notifications/email-status');
    return response.data;
  },

  // Récupérer l'historique des rappels
  async getReminderHistory(params?: {
    managerId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await api.get('/notifications/reminder-history', { params });
    return response.data;
  },
};