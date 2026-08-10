import api from '../api';
import {
  DashboardStats,
  FormationStats,
  CollaborateurStats,
  DepartementStats,
  ChartData,
  DetailedKPIsResponse,
  BilanAnnuelResponse,
  DashboardAlertsResponse,
  LdObjectivesKpisResponse,
  LdObjectiveTarget,
  LdObjectiveGlobalTarget,
  ObjectifCategorieRow
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

  // Récupérer les alertes et notifications du dashboard.
  // Toutes les alertes sont désormais bornées à la période sélectionnée.
  // `formationsSansSession` a été REMPLACÉ par `conformiteObligatoires`,
  // et `sessionsNonCloturees` a été ajouté.
  async getDashboardAlerts(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardAlertsResponse> {
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

  // Récupérer les KPIs détaillés des formations obligatoires.
  // Le bloc `parDepartement` porte désormais, en plus des compteurs, le
  // directeur du département et l'indicateur de relance :
  //   directeur: { id, nomComplet, email } | null
  //   peutEtreRelance: boolean   (directeur présent ET email non vide)
  // Type exporté : `ConformiteParDepartement` dans lib/types.
  async getMandatoryTrainingsKPIs(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    type?: 'annuelle' | 'onboarding',
    // Restreint le calcul à une sélection de formations (carte "Scope" de la
    // page conformité). Omis => tout le périmètre obligatoire.
    formationIds?: number[]
  ): Promise<any> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (periode === 'plage') {
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
    } else {
      if (date) params.date = date;
    }
    if (type) params.type = type;
    if (formationIds && formationIds.length > 0) {
      params.formationIds = formationIds.join(',');
    }
    const response = await api.get('/stats/mandatory-trainings-kpis', { params });
    return response.data;
  },

  // Récupérer les formations obligatoires manquantes groupées par manager.
  // Les entrées `sansManager[]` portent désormais aussi `departementId`, ce qui
  // permet de les rattacher au département pour la relance du directeur.
  async getMandatoryTrainingsByManager(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    departementId?: number,
    type?: 'annuelle' | 'onboarding',
    // Doit rester aligné sur getMandatoryTrainingsKPIs, sinon la liste par
    // manager contredit les chiffres du haut de page.
    formationIds?: number[]
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
    if (type) params.type = type;
    if (formationIds && formationIds.length > 0) {
      params.formationIds = formationIds.join(',');
    }
    const response = await api.get('/stats/mandatory-trainings-by-manager', { params });
    return response.data;
  },

  // Récupérer les KPIs des objectifs L&D (catégories suivies + bloc certifiantes)
  async getLdObjectivesKpis(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LdObjectivesKpisResponse> {
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

  // Récupérer les objectifs cibles par catégorie.
  // La réponse reste un TABLEAU (forme inchangée) ; seul le champ `suiviLd` a
  // été ajouté. La liste contient TOUTES les catégories actives, y compris
  // celles retirées du KPI, pour permettre leur réintégration.
  async getLdObjectiveTargets(): Promise<LdObjectiveTarget[]> {
    const response = await api.get('/stats/ld-objectives/targets');
    return response.data;
  },

  // Mettre à jour les objectifs cibles par catégorie (objectifCible : entier 0-100)
  async updateLdObjectiveTargets(targets: { categorieId: number; objectifCible: number }[]): Promise<any> {
    const response = await api.put('/stats/ld-objectives/targets', targets);
    return response.data;
  },

  // Objectifs L&D globaux (hors catégorie) — actuellement la seule clé est
  // 'certifiantes'. Endpoint séparé pour ne pas casser la forme ci-dessus.
  async getLdObjectiveGlobalTargets(): Promise<LdObjectiveGlobalTarget[]> {
    const response = await api.get('/stats/ld-objectives/targets/globaux');
    return response.data;
  },

  // Mettre à jour un objectif global (upsert par clé, objectifCible : entier 0-100)
  async updateLdObjectiveGlobalTarget(
    cle: 'certifiantes',
    objectifCible: number
  ): Promise<LdObjectiveGlobalTarget> {
    const response = await api.put('/stats/ld-objectives/targets/globaux', { cle, objectifCible });
    return response.data;
  },

  // Retirer une catégorie du KPI Objectifs L&D.
  // NE SUPPRIME PAS la catégorie de formation : pose seulement suiviLd = false.
  async excludeLdObjectiveCategorie(categorieId: number): Promise<ObjectifCategorieRow> {
    const response = await api.delete(`/stats/ld-objectives/categories/${categorieId}`);
    return response.data;
  },

  // Réintégrer une catégorie précédemment retirée du KPI Objectifs L&D
  async restoreLdObjectiveCategorie(categorieId: number): Promise<ObjectifCategorieRow> {
    const response = await api.post(`/stats/ld-objectives/categories/${categorieId}/restore`);
    return response.data;
  },

  // NB : l'envoi des rappels de formations obligatoires (managers ET directeurs)
  // passe par `notificationsService.sendMandatoryTrainingReminders(dto)`, dans
  // `lib/services/notifications.service.ts`. Il n'y a volontairement pas de
  // second point d'entrée ici, pour éviter deux implémentations divergentes.

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

  // Bilan annuel : chiffres clés de l'année avec comparaison N-1
  async getBilanAnnuel(annee?: number): Promise<BilanAnnuelResponse> {
    const params: Record<string, string> = {};
    if (annee) params.annee = String(annee);
    const response = await api.get('/stats/bilan-annuel', { params });
    return response.data;
  },
};