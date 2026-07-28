// Types pour le preview de l'import RH (aperçu avant / après)

export interface ChangementChamp {
  champ: string;
  avant?: string;
  apres?: string;
}

export interface RhCreation {
  matricule: string;
  idExterne?: string;
  nomComplet: string;
  departement: string;
  workerSubType?: string;
}

export interface RhReactivation {
  collaborateurId: number;
  matricule?: string;
  nomComplet: string;
  dateInactivation?: string;
  nbFormations: number;
  changements: ChangementChamp[];
}

export interface RhModification {
  collaborateurId: number;
  matricule?: string;
  nomComplet: string;
  changements: ChangementChamp[];
  rapprocheParNom: boolean;
}

export interface RhDepartPotentiel {
  collaborateurId: number;
  matricule?: string;
  nomComplet: string;
  departement?: string;
  horsPerimetreRh: boolean;
}

export interface RhPreviewStats {
  lignesFichier: number;
  lignesInvalides: number;
  nbCreations: number;
  nbReactivations: number;
  nbModifications: number;
  nbInchanges: number;
  nbDepartsPotentiels: number;
  effectifBaseActif: number;
}

export interface RhPreview {
  previewId: string;
  nomFichier: string;
  dateAnalyse: string;
  stats: RhPreviewStats;
  creations: RhCreation[];
  reactivations: RhReactivation[];
  modifications: RhModification[];
  departsPotentiels: RhDepartPotentiel[];
  departementsACreer: string[];
  avertissements: string[];
}

export interface ConfirmRhImportRequest {
  previewId: string;
  /** Collaborateurs à laisser inactifs malgré leur présence dans le fichier */
  reactivationsExclues?: number[];
}
