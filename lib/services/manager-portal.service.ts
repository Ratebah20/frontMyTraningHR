import api from '../api';

export interface ManagerDashboardSummary {
  manager: {
    id: number;
    nomComplet: string;
    email: string;
    departement: string;
  };
  kpis: {
    totalCollaborateurs: number;
    collaborateursDirects: number;
    formationsEnCours: number;
    formationsCompletesMois: number;
    tauxCompletionObligatoires: number;
  };
  prochainessFormations: Array<{
    id: number;
    formation: string;
    collaborateur: string;
    dateDebut: string;
    dateFin: string;
    statut: string;
  }>;
  alertes: Array<{
    type: string;
    message: string;
    count: number;
    severity: 'warning' | 'error' | 'info';
  }>;
}

export interface ManagerDashboardCharts {
  formationsParMois: Array<{
    mois: string;
    count: number;
  }>;
  repartitionStatut: Array<{
    statut: string;
    count: number;
    color: string;
  }>;
}

export interface ManagerTeamMember {
  id: number;
  nomComplet: string;
  nom: string;
  prenom: string;
  matricule: string;
  departement: string;
  departementId: number;
  managerDirect: boolean;
  formationsEnCours: number;
  formationsTerminees: number;
  totalHeuresFormation: number;
  actif: boolean;
  contrat: string;
  genre: string;
}

export interface ManagerTeamResponse {
  data: ManagerTeamMember[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export interface ManagerTeamMemberDetail {
  id: number;
  nomComplet: string;
  nom: string;
  prenom: string;
  matricule: string;
  email: string;
  departement: string;
  contrat: string;
  genre: string;
  actif: boolean;
  dateEmbauche: string;
  managerDirect: boolean;
  formations: Array<{
    id: number;
    nomFormation: string;
    categorie: string;
    dateDebut: string;
    dateFin: string;
    dureeHeures: number;
    statut: string;
    organisme: string;
  }>;
  stats: {
    totalFormations: number;
    formationsTerminees: number;
    formationsEnCours: number;
    totalHeures: number;
    tauxCompletion: number;
  };
}

export interface ManagerTeamFormation {
  id: number;
  collaborateur: string;
  collaborateurId: number;
  formation: string;
  formationId: number;
  categorie: string;
  dateDebut: string;
  dateFin: string;
  dureeHeures: number;
  statut: string;
  organisme: string;
}

export interface ManagerTeamFormationsResponse {
  data: ManagerTeamFormation[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export interface ManagerTeamStats {
  periode: {
    annee: number;
    mois?: number;
    libelle: string;
  };
  kpis: {
    tauxCompletion: number;
    totalHeures: number;
    formationsObligatoiresCompliance: number;
    collaborateursFormes: number;
    collaborateursNonFormes: number;
  };
  heuresParCollaborateur: Array<{
    id: number;
    nom: string;
    heures: number;
  }>;
  evolutionMensuelle: Array<{
    mois: string;
    formations: number;
    heures: number;
  }>;
  repartitionCategorie: Array<{
    categorie: string;
    count: number;
    pourcentage: number;
  }>;
  obligatoiresCompliance: Array<{
    formation: string;
    formes: number;
    total: number;
    taux: number;
  }>;
}

export const managerPortalService = {
  // Dashboard
  async getDashboardSummary(): Promise<ManagerDashboardSummary> {
    const response = await api.get('/manager/dashboard');
    return response.data;
  },

  async getDashboardCharts(annee?: number): Promise<ManagerDashboardCharts> {
    const params: any = {};
    if (annee) params.annee = annee;
    const response = await api.get('/manager/stats', { params });
    return response.data;
  },

  // Team
  async getTeamMembers(filters?: {
    search?: string;
    departementId?: number;
    actif?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ManagerTeamResponse> {
    const response = await api.get('/manager/team', { params: filters });
    return response.data;
  },

  async getTeamMemberDetail(id: number): Promise<ManagerTeamMemberDetail> {
    const response = await api.get(`/manager/team/${id}`);
    return response.data;
  },

  // Formations
  async getTeamFormations(filters?: {
    search?: string;
    collaborateurId?: number;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    annee?: number;
    page?: number;
    limit?: number;
  }): Promise<ManagerTeamFormationsResponse> {
    const response = await api.get('/manager/formations', { params: filters });
    return response.data;
  },

  // Stats
  async getTeamStats(
    periode?: 'annee' | 'mois',
    date?: string
  ): Promise<ManagerTeamStats> {
    const params: any = {};
    if (periode) params.periode = periode;
    if (date) params.date = date;
    const response = await api.get('/manager/stats', { params });
    return response.data;
  },
};
