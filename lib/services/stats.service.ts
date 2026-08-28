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
  DashboardAlertesBloc,
  ConformiteObligatoiresAlerte,
  LdObjectivesKpisResponse,
  LdObjectiveTarget,
  LdObjectiveGlobalTarget,
  ObjectifCategorieRow
} from '../types';

// ==================== DASHBOARD : CHAMPS AJOUTÉS CÔTÉ BACKEND ====================
// Ces types affinent localement les réponses `/stats/dashboard-alerts` et
// `/stats/dashboard-summary` avec les champs ajoutés récemment, sans modifier
// `lib/types` (partagé avec d'autres écrans).

/** `conformiteObligatoires` porte désormais le nombre de collaborateurs exclus
 *  du calcul parce qu'ils sont en congé longue durée (taux auditable). */
export type ConformiteObligatoiresAlerteEnrichie = ConformiteObligatoiresAlerte & {
  collaborateursEnConge: number;
};

/** Réponse `/stats/dashboard-alerts`.
 *  `periode.dateDebut` / `periode.dateFin` bornent TOUS les compteurs du bloc
 *  `alertes` : ce sont ces bornes qu'il faut reporter dans les liens de
 *  navigation pour que la liste d'arrivée corresponde au badge affiché. */
export type DashboardAlertsResponseEnrichie = Omit<DashboardAlertsResponse, 'alertes'> & {
  alertes: Omit<DashboardAlertesBloc, 'conformiteObligatoires'> & {
    conformiteObligatoires: ConformiteObligatoiresAlerteEnrichie;
  };
};

/** Réponse `/stats/dashboard-summary` (champs consommés par le tableau de bord).
 *  ATTENTION : `tauxObligatoires` vaut `null` quand la population cible est
 *  vide — il ne faut donc jamais afficher « 0 % » ni « 100 % » dans ce cas. */
export interface DashboardSummaryResponse {
  totalCollaborateurs: number;
  collaborateursActifs: number;
  tauxBudget: number;
  budgetUtilise: number;
  budgetPrevu: number;
  sessionsEnCours: number;
  sessionsPlanifiees: number;
  sessionsTerminees: number;
  heuresFormationPeriode: number;
  /** Nombre de collaborateurs FORMÉS sur la période (le champ s'appelait
   *  `nombreDepartements` : nom recyclé côté API, jamais un nombre de départements). */
  collaborateursFormes: number;
  collaborateursFormesParGenre?: { hommes: number; femmes: number };
  nombreFormationsObligatoires: number;
  collaborateursConformesObligatoires: number;
  collaborateursCiblesObligatoires: number;
  /** null = aucune population cible / aucune formation obligatoire. Une décimale. */
  tauxObligatoires: number | null;
  /** Collaborateurs en congé longue durée exclus du calcul de conformité. */
  collaborateursEnCongeObligatoires: number;
}

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
  ): Promise<DashboardSummaryResponse> {
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
  // Toutes les alertes sont désormais bornées à la période sélectionnée, et la
  // réponse renvoie ces bornes dans `periode` : c'est la seule source fiable
  // pour construire des liens dont la liste d'arrivée correspond au badge.
  // `formationsSansSession` a été REMPLACÉ par `conformiteObligatoires`,
  // et `sessionsNonCloturees` a été ajouté.
  async getDashboardAlerts(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardAlertsResponseEnrichie> {
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
  //
  // `parDepartement` fait un ROLLUP des équipes sur leur département parent :
  // il n'y a plus une ligne par équipe. En revanche, `formations[].formes[]` et
  // `formations[].nonFormes[]` portent le nom BRUT du rattachement du
  // collaborateur (donc éventuellement une équipe) : tout regroupement
  // nominatif par département doit rejouer le rollup côté client.
  //
  // `stats.collaborateursEnConge` : collaborateurs en congé longue durée,
  // EXCLUS de `totalCollaborateursAFormer` (rend le dénominateur auditable).
  async getMandatoryTrainingsKPIs(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    // 'securite' = formations de sécurité au travail (SST), périmètre distinct
    // des obligatoires annuelles / onboarding
    type?: 'annuelle' | 'onboarding' | 'securite',
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
  // Les collaborateurs en congé longue durée n'y apparaissent plus (même règle
  // de population que les KPI de conformité).
  async getMandatoryTrainingsByManager(
    periode?: 'annee' | 'mois' | 'plage',
    date?: string,
    startDate?: string,
    endDate?: string,
    departementId?: number,
    // 'securite' = formations de sécurité au travail (SST)
    type?: 'annuelle' | 'onboarding' | 'securite',
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