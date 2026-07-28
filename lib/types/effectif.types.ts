// Types pour le contrôle d'effectif (fichier RH vs collaborateurs de l'application)

export enum ActionEffectif {
  DESACTIVER = 'DESACTIVER',
  REACTIVER = 'REACTIVER',
}

export enum MethodeRapprochement {
  ID_EXTERNE = 'ID_EXTERNE',
  MATRICULE = 'MATRICULE',
  EMAIL = 'EMAIL',
  NOM_PRENOM = 'NOM_PRENOM',
}

export enum TypeEcartAttribut {
  DEPARTEMENT = 'DEPARTEMENT',
  MANAGER = 'MANAGER',
  WORKER_SUB_TYPE = 'WORKER_SUB_TYPE',
}

/** Collaborateur encore actif dans l'application mais absent du fichier RH */
export interface CollaborateurFantome {
  collaborateurId: number;
  matricule?: string;
  idExterne?: string;
  nomComplet: string;
  departement?: string;
  workerSubType?: string;
  sourceImport?: string;
  dateEmbauche?: string;
  derniereFormation?: string;
  nbFormations: number;
  /** Un compte de connexion (manager invité / RH) est rattaché et toujours actif */
  compteActif: boolean;
  compteRole?: string;
  nbSubordonnesActifs: number;
  /** Fiche jamais alimentée par un import RH : son absence ne prouve pas un départ */
  horsPerimetreRh: boolean;
}

export interface CollaborateurAReactiver {
  collaborateurId: number;
  matricule?: string;
  idExterne?: string;
  nomComplet: string;
  departementFichier?: string;
  dateInactivation?: string;
  rapprochePar: MethodeRapprochement;
}

export interface CollaborateurAbsentBase {
  matricule?: string;
  idExterne?: string;
  nomComplet: string;
  /** Absent des exports simples (sans colonne Département) */
  departement?: string;
  email?: string;
  workerSubType?: string;
}

export interface EcartAttribut {
  collaborateurId: number;
  nomComplet: string;
  matricule?: string;
  type: TypeEcartAttribut;
  valeurBase?: string;
  valeurFichier?: string;
}

export interface EffectifStats {
  effectifFichier: number;
  effectifBaseActif: number;
  ecart: number;
  nbFantomes: number;
  nbFantomesPerimetreRh: number;
  nbAReactiver: number;
  nbAbsentsBase: number;
  nbEcartsAttributs: number;
  nbLignesInvalides: number;
}

export interface EffectifReconciliation {
  reconciliationId: string;
  nomFichier: string;
  dateAnalyse: string;
  stats: EffectifStats;
  fantomes: CollaborateurFantome[];
  aReactiver: CollaborateurAReactiver[];
  absentsBase: CollaborateurAbsentBase[];
  ecartsAttributs: EcartAttribut[];
  avertissements: string[];
}

export interface AppliquerEffectifRequest {
  reconciliationId: string;
  action: ActionEffectif;
  collaborateurIds: number[];
}

export interface AppliquerEffectifResponse {
  success: boolean;
  action: ActionEffectif;
  nbTraites: number;
  idsIgnores: number[];
  avertissements: string[];
}
