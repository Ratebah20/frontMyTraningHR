// Types pour le mode Preview d'import OLU

export enum TypeEntiteImport {
  DEPARTEMENT = 'DEPARTEMENT',
  ORGANISME = 'ORGANISME',
  CATEGORIE = 'CATEGORIE',
}

export enum ActionResolutionConflict {
  MAPPER = 'MAPPER',
  IGNORER = 'IGNORER',
  RECREER = 'RECREER',
}

export enum TypeConflict {
  ENTITE_SUPPRIMEE = 'ENTITE_SUPPRIMEE',
  COLLABORATEUR_NON_TROUVE = 'COLLABORATEUR_NON_TROUVE',
}

export enum TypeConflictCollaborateur {
  NON_TROUVE = 'NON_TROUVE',
  INACTIF = 'INACTIF',
}

export enum ActionResolutionCollaborateur {
  IGNORER = 'IGNORER',
  REACTIVER = 'REACTIVER',
  CREER = 'CREER',
}

export interface CollaborateurNonTrouve {
  idExterne: string;
  lignes: number[];
}

export interface CollaborateurProbleme {
  type: TypeConflictCollaborateur;
  idExterne: string;
  collaborateurId?: number;
  nomComplet?: string;
  nombreSessionsAffectees: number;
  lignesExemples: number[];
}

// Collaborateurs inactifs (info seulement - sessions importées normalement)
export interface CollaborateurInactif {
  idExterne: string;
  collaborateurId: number;
  nomComplet?: string;
  nombreSessionsAffectees: number;
}

// Organismes non trouvés (action requise)
export interface OrganismeNonTrouve {
  emailFormateur: string;
  nomOrganisme: string;
  nombreSessionsAffectees: number;
  lignesExemples: number[];
}

export enum ActionResolutionOrganisme {
  IGNORER = 'IGNORER',
  CREER = 'CREER',
}

export interface ResolutionOrganisme {
  emailFormateur: string;
  action: ActionResolutionOrganisme;
  nomOrganisme?: string;
}

export interface SubmitOrganismeResolutionsRequest {
  previewId: string;
  resolutions: ResolutionOrganisme[];
}

export interface SubmitOrganismeResolutionsResponse {
  success: boolean;
  created: number;
}

export interface ConflictItem {
  type: TypeConflict;
  typeEntite: TypeEntiteImport;
  valeurExcel: string;
  entiteExistanteId?: number;
  entiteExistanteNom?: string;
  dateSuppression?: string;
  nombreOccurrences?: number;
  lignesConcernees?: number[];
}

export interface PreviewStats {
  totalLignes: number;
  sessionsACreer: number;
  sessionsAMettreAJour: number;
  nouveauxOrganismes: string[];
  nouvellesCategories: string[];
  collaborateursTrouves: number;
  collaborateursNonTrouves: CollaborateurNonTrouve[];
  formationsNouvelles: number;
  formationsExistantes: number;
}

export interface ImportPreviewResponse {
  previewId: string;
  nomFichier: string;
  stats: PreviewStats;
  conflits: ConflictItem[];
  peutImporterDirectement: boolean;
  reglesAppliquees: number;
  collaborateursProblemes?: CollaborateurProbleme[];       // NON_TROUVE uniquement
  collaborateursInactifs?: CollaborateurInactif[];         // Info seulement
  organismesNonTrouves?: OrganismeNonTrouve[];             // Organismes à créer/ignorer
  sessionsIgnoreesTotal?: number;                          // NON_TROUVE uniquement
}

export interface ResolutionConflict {
  typeEntite: TypeEntiteImport;
  valeurExcel: string;
  action: ActionResolutionConflict;
  entiteCibleId?: number;
  memoriser?: boolean;
}

export interface SubmitResolutionsRequest {
  previewId: string;
  resolutions: ResolutionConflict[];
}

export interface SubmitResolutionsResponse {
  success: boolean;
  conflitsRestants: number;
  peutImporter: boolean;
}

export interface ResolutionCollaborateur {
  idExterne: string;
  action: ActionResolutionCollaborateur;
  nom?: string;
  prenom?: string;
}

export interface SubmitCollaborateurResolutionsRequest {
  previewId: string;
  resolutions: ResolutionCollaborateur[];
}

export interface SubmitCollaborateurResolutionsResponse {
  success: boolean;
  reactivated: number;
  created: number;
}

export interface ConfirmImportRequest {
  previewId: string;
}

export interface RegleImport {
  id: number;
  typeEntite: TypeEntiteImport;
  valeurExcel: string;
  action: ActionResolutionConflict;
  entiteCibleId?: number;
  entiteCibleNom?: string;
  dateCreation: string;
  actif: boolean;
}

export interface UpdateRegleImportRequest {
  action?: ActionResolutionConflict;
  entiteCibleId?: number;
  actif?: boolean;
}

export interface EntityOption {
  id: number;
  nom: string;
}

export interface RulesStats {
  typeEntite: string;
  count: number;
}
