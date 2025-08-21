import api from '../api';

// Types pour l'analyse par période
export interface AnalysePeriode {
  periode: string;
  dateDebut: string;
  dateFin: string;
  totalConsomme: number;
  nombreSessions: number;
  coutMoyen: number;
  parDepartement: {
    departement: string;
    montant: number;
    pourcentage: number;
  }[];
}

// Types pour le tableau pivot
export interface PivotBudget {
  pivot: {
    departement: string;
    categories: {
      [categorie: string]: {
        montant: number;
        sessions: number;
      };
    };
    total: number;
  }[];
  totauxCategories: {
    [categorie: string]: number;
  };
  totalGeneral: number;
}

// Types pour le dashboard complet
export interface DashboardComplet {
  annee: number;
  consommationGlobale: {
    annee: number;
    budgetTotal: number;
    budgetFormation: number;
    totalConsomme: number;
    totalRestant: number;
    pourcentageConsommation: number;
    nombreSessionsImputees: number;
    coutMoyenSession: number;
    statut: 'ok' | 'attention' | 'critique';
    consommationMensuelle: {
      mois: number;
      montant: number;
      nombreSessions: number;
    }[];
  };
  top5Departements: {
    departementId?: number;
    departementNom: string;
    totalConsomme: number;
    nombreSessions: number;
    nombreCollaborateurs?: number;
    coutMoyen?: number;
    pourcentageDuTotal?: number;
    topFormations?: {
      formation: string;
      nombreSessions: number;
      coutTotal: number;
    }[];
  }[];
  top3Categories: {
    categorieId?: number;
    categorieNom: string;
    totalConsomme: number;
    nombreSessions: number;
    coutMoyen?: number;
    pourcentageDuTotal?: number;
  }[];
  formationsSansTarif: number;
  alertes: {
    niveau: 'info' | 'attention' | 'critique';
    message: string;
    action?: string;
  }[];
  lastUpdate?: string;
}

// Types pour les formations sans tarif
export interface FormationSansTarif {
  id: number;
  codeFormation: string;
  nomFormation: string;
  categorie?: string;
  nombreSessions: number;
  nombreSessionsTerminees: number;
}

// Types pour l'analyse département détaillée
export interface AnalyseDepartementDetaille {
  departementId: number;
  departementNom: string;
  totalConsomme: number;
  nombreSessions: number;
  nombreCollaborateurs: number;
  coutMoyen: number;
  pourcentageDuTotal: number;
  topFormations: {
    formation: string;
    nombreSessions: number;
    coutTotal: number;
  }[];
}

// Types pour l'analyse catégorie détaillée
export interface AnalyseCategorieDetaille {
  categorieId: number;
  categorieNom: string;
  totalConsomme: number;
  nombreSessions: number;
  coutMoyen: number;
  pourcentageDuTotal: number;
}

export const budgetAnalyticsService = {
  // Obtenir le dashboard complet avec toutes les métriques
  async getDashboardComplet(annee: number): Promise<DashboardComplet> {
    const response = await api.get(`/budget-simple/${annee}/dashboard`);
    return response.data;
  },

  // Obtenir le tableau pivot département × catégorie
  async getPivot(annee: number): Promise<PivotBudget> {
    const response = await api.get(`/budget-simple/${annee}/pivot`);
    return response.data;
  },

  // Analyser par période (trimestre ou semestre)
  async getAnalysePeriode(
    annee: number,
    periode: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'S1' | 'S2'
  ): Promise<AnalysePeriode> {
    const response = await api.get(`/budget-simple/${annee}/analyse-periode`, {
      params: { periode }
    });
    return response.data;
  },

  // Obtenir toutes les analyses par période
  async getAllAnalysesPeriodes(annee: number): Promise<{
    trimestres: AnalysePeriode[];
    semestres: AnalysePeriode[];
  }> {
    const [q1, q2, q3, q4, s1, s2] = await Promise.all([
      this.getAnalysePeriode(annee, 'Q1').catch(() => null),
      this.getAnalysePeriode(annee, 'Q2').catch(() => null),
      this.getAnalysePeriode(annee, 'Q3').catch(() => null),
      this.getAnalysePeriode(annee, 'Q4').catch(() => null),
      this.getAnalysePeriode(annee, 'S1').catch(() => null),
      this.getAnalysePeriode(annee, 'S2').catch(() => null),
    ]);

    return {
      trimestres: [q1, q2, q3, q4].filter(Boolean) as AnalysePeriode[],
      semestres: [s1, s2].filter(Boolean) as AnalysePeriode[],
    };
  },

  // Obtenir les formations sans tarif
  async getFormationsSansTarif(): Promise<FormationSansTarif[]> {
    const response = await api.get('/budget-simple/formations-sans-tarif');
    return response.data;
  },

  // Obtenir l'analyse détaillée par département
  async getAnalyseDepartement(annee: number): Promise<AnalyseDepartementDetaille[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-departement`);
    return response.data;
  },

  // Obtenir l'analyse détaillée par catégorie
  async getAnalyseCategorie(annee: number): Promise<AnalyseCategorieDetaille[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-categorie`);
    return response.data;
  },

  // Mettre à jour le tarif d'une formation
  async updateTarifFormation(
    formationId: number,
    tarifHT: number
  ): Promise<{
    formation: string;
    tarifHT: number;
    tarifTTC: number;
    sessionsImpactees: number;
  }> {
    const response = await api.put(`/budget-simple/formation/${formationId}/tarif`, {
      tarifHT
    });
    return response.data;
  },

  // Mettre à jour les tarifs en batch
  async updateTarifsBatch(updates: Array<{ formationId: number; tarifHT: number }>): Promise<{
    updated: number;
    failed: number;
    errors: string[];
  }> {
    const response = await api.post('/budget-simple/formations/tarifs-batch', {
      updates
    });
    return response.data;
  },
};