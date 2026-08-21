import api from '../api';

// Types pour la consommation budgétaire
export interface BudgetConsommation {
  annee: number;
  budgetTotal: number;
  budgetFormation: number;
  /** Consommé HT — égal au `total` des vues couts-* */
  totalConsomme: number;
  /** Part adossée à un tarif saisi sur la session */
  coutReel: number;
  /** Part issue du repli sur Formation.tarifHT (estimation) */
  coutEstime: number;
  /** Sessions terminées sans tarif, hors imports OLU */
  sessionsSansTarif: number;
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
}

// Types pour l'analyse par département
// Aligné sur AnalyseDepartementDto du backend : les anciens noms
// (nomDepartement / budgetConsomme / moyenneParCollaborateur) n'ont jamais
// existé dans la réponse et faisaient afficher « undefined » sur le dashboard.
export interface AnalyseDepartement {
  departementId: number;
  departementNom: string;
  totalConsomme: number;
  nombreSessions: number;
  nombreCollaborateurs: number;
  /** Coût moyen par SESSION (et non par collaborateur) */
  coutMoyen: number;
  topFormations: {
    /** Nom de la formation (le backend ne renvoie pas d'id ici) */
    formation: string;
    nombreSessions: number;
    coutTotal: number;
  }[];
  pourcentageDuTotal: number;
}

// Types pour l'analyse par catégorie
// Aligné sur AnalyseCategorieDto du backend.
export interface AnalyseCategorie {
  categorieId: number;
  categorieNom: string;
  totalConsomme: number;
  nombreSessions: number;
  coutMoyen: number;
  pourcentageDuTotal: number;
}

// Types pour l'analyse par période
export interface AnalysePeriode {
  periode: string;
  trimestre?: number;
  semestre?: number;
  budgetConsomme: number;
  nombreSessions: number;
  evolution: number;
  repartitionDepartements: {
    departementId: number;
    nomDepartement: string;
    montant: number;
  }[];
}

// Types pour le tableau pivot
export interface PivotBudget {
  departements: {
    id: number;
    nom: string;
  }[];
  categories: {
    id: number;
    nom: string;
  }[];
  data: {
    [departementId: number]: {
      [categorieId: number]: {
        montant: number;
        sessions: number;
      };
    };
  };
  totaux: {
    parDepartement: { [id: number]: number };
    parCategorie: { [id: number]: number };
    general: number;
  };
}

// Types pour le dashboard
export interface BudgetDashboard {
  consommation: BudgetConsommation;
  topDepartements: AnalyseDepartement[];
  repartitionCategories: AnalyseCategorie[];
  tendances: {
    mois: number;
    montant: number;
    evolution: number;
  }[];
  alertes: {
    type: 'warning' | 'danger' | 'info';
    message: string;
    valeur?: number;
  }[];
  metriques: {
    tauxUtilisation: number;
    coutMoyenSession: number;
    sessionsTerminees: number;
    sessionsEnCours: number;
    formationsSansTarif: number;
  };
}

// ========== Types pour les vues de coûts estimés ==========
// Ces vues ne nécessitent pas de budget annuel saisi côté backend.

export interface CoutOrganisme {
  organismeId: number | null;
  nomOrganisme: string;
  nbSessions: number;
  nbCollaborateurs: number;
  coutTotal: number;
}

export interface CoutsOrganismesResponse {
  annee: number;
  organismes: CoutOrganisme[];
  total: number;
  /** Part du total adossée à un tarif saisi sur la session */
  coutReel: number;
  /** Part du total issue du repli sur Formation.tarifHT (estimation) */
  coutEstime: number;
  /** Sessions terminées sans tarif, hors imports OLU (e-learning interne) */
  sessionsSansTarif: number;
  budgetAnnuel: number | null;
}

export interface CoutFormation {
  formationId: number;
  nomFormation: string;
  codeFormation: string;
  categorie: string;
  nbSessions: number;
  nbParticipants: number;
  coutTotal: number;
}

export interface CoutsFormationsResponse {
  annee: number;
  formations: CoutFormation[];
  total: number;
  /** Part du total adossée à un tarif saisi sur la session */
  coutReel: number;
  /** Part du total issue du repli sur Formation.tarifHT (estimation) */
  coutEstime: number;
  /** Sessions terminées sans tarif, hors imports OLU (e-learning interne) */
  sessionsSansTarif: number;
  budgetAnnuel: number | null;
}

export interface CoutPersonne {
  collaborateurId: number;
  nomComplet: string;
  departement: string;
  nbFormations: number;
  heures: number;
  coutTotal: number;
}

export interface CoutsPersonnesResponse {
  annee: number;
  personnes: CoutPersonne[]; // Tous les collaborateurs, par coût décroissant
  total: number; // Total global (tous collaborateurs)
  nbCollaborateurs: number;
  /** Part du total adossée à un tarif saisi sur la session */
  coutReel: number;
  /** Part du total issue du repli sur Formation.tarifHT (estimation) */
  coutEstime: number;
  /** Sessions terminées sans tarif, hors imports OLU (e-learning interne) */
  sessionsSansTarif: number;
  budgetAnnuel: number | null;
}

// GET /budget-simple/:annee/analyse-categorie — même forme que AnalyseCategorie,
// alias conservé pour la page /budget/couts.
export type CoutCategorie = AnalyseCategorie;

// Types pour les tarifs
export interface UpdateFormationTarif {
  tarifHT: number;
  updateSessions?: boolean;
}

export interface FormationSansTarif {
  id: number;
  codeForme: string;
  titreFormation: string;
  nombreSessions: number;
  categorieId?: number;
  nomCategorie?: string;
}

export const budgetSimpleService = {
  // Récupérer la consommation globale
  async getConsommation(annee: number): Promise<BudgetConsommation> {
    const response = await api.get(`/budget-simple/${annee}/consommation`);
    return response.data;
  },

  // Analyser par département
  async getAnalyseParDepartement(annee: number): Promise<AnalyseDepartement[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-departement`);
    return response.data;
  },

  // Analyser par catégorie
  async getAnalyseParCategorie(annee: number): Promise<AnalyseCategorie[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-categorie`);
    return response.data;
  },

  // Analyser par période
  async getAnalyseParPeriode(
    annee: number, 
    type: 'trimestre' | 'semestre' = 'trimestre'
  ): Promise<AnalysePeriode[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-periode`, {
      params: { type }
    });
    return response.data;
  },

  // Obtenir le tableau pivot
  async getPivot(annee: number): Promise<PivotBudget> {
    const response = await api.get(`/budget-simple/${annee}/pivot`);
    return response.data;
  },

  // Obtenir le dashboard complet
  async getDashboard(annee: number): Promise<BudgetDashboard> {
    const response = await api.get(`/budget-simple/${annee}/dashboard`);
    return response.data;
  },

  // Mettre à jour le tarif d'une formation
  async updateTarifFormation(
    formationId: number, 
    data: UpdateFormationTarif
  ): Promise<void> {
    await api.put(`/budget-simple/formation/${formationId}/tarif`, data);
  },

  // Mettre à jour les tarifs en batch
  async updateTarifsBatch(formations: Array<{ id: number; tarifHT: number }>): Promise<void> {
    await api.post('/budget-simple/formations/tarifs-batch', { formations });
  },

  // Obtenir les formations sans tarif
  async getFormationsSansTarif(): Promise<FormationSansTarif[]> {
    const response = await api.get('/budget-simple/formations-sans-tarif');
    return response.data;
  },

  // ========== Vues de coûts estimés ==========

  // Coûts estimés par organisme de formation
  async getCoutsParOrganisme(annee: number): Promise<CoutsOrganismesResponse> {
    const response = await api.get(`/budget-simple/${annee}/couts-organismes`);
    return response.data;
  },

  // Coûts estimés par formation
  async getCoutsParFormation(annee: number): Promise<CoutsFormationsResponse> {
    const response = await api.get(`/budget-simple/${annee}/couts-formations`);
    return response.data;
  },

  // Coûts estimés par collaborateur (top 100)
  async getCoutsParPersonne(annee: number): Promise<CoutsPersonnesResponse> {
    const response = await api.get(`/budget-simple/${annee}/couts-personnes`);
    return response.data;
  },

  // Coûts par catégorie (même endpoint que analyse-categorie, typé selon la réponse réelle du backend)
  async getCoutsParCategorie(annee: number): Promise<CoutCategorie[]> {
    const response = await api.get(`/budget-simple/${annee}/analyse-categorie`);
    return response.data;
  }
};