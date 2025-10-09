// Types pour les entités principales

export interface User {
  id: number;
  username: string;
  email: string;
  dateCreation: string;
  derniereConnexion?: string;
  actif: boolean;
}

export interface Collaborateur {
  id: number;
  matricule?: string;
  idExterne?: string;
  workerSubType?: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  genre?: string;
  managerId?: number;
  departementId?: number;
  contratId?: number;
  typeUtilisateur: string;
  dateCreation: string;
  dateModification: string;
  actif: boolean;
  manager?: Collaborateur;
  departement?: Departement;
  contrat?: TypeContrat;
  sessions?: SessionFormation[];
  nombreFormations?: number;
}

export interface Departement {
  id: number;
  nomDepartement: string;
  codeDepartement?: string;
  actif: boolean;
}

export interface TypeContrat {
  id: number;
  typeContrat: string;
  description?: string;
  actif: boolean;
}

export interface Formation {
  id: number;
  codeFormation: string;
  nomFormation: string;
  categorieId?: number;
  typeFormation?: string;
  dureePrevue?: number;
  uniteDuree: string;
  dateCreation: string;
  actif: boolean;
  categorie?: CategorieFormation;
  sessions?: SessionFormation[];
  _count?: {
    sessions: number;
  };
}

export interface CategorieFormation {
  id: number;
  nomCategorie: string;
  description?: string;
  actif: boolean;
}

// Type pour les données de session retournées par l'API
export interface SessionFormationResponse {
  id: number;
  collaborateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    departement: string;
  };
  formation?: {
    id: number;
    code: string;
    nom: string;
    categorie: string;
    type: string;
    dureeHeures: number;
  };
  dateImport: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  note?: number;
  commentaire?: string;
  dureeHeures?: number;
  dateCreation: string;
  dateModification: string;
}

export interface SessionFormation {
  id: number;
  collaborateurId: number;
  formationId: number;
  organismeId?: number;
  dateDebut?: string;
  dateFin?: string;
  dureePrevue?: number;
  dureeReelle?: number;
  uniteDuree: string;
  statut?: string;
  tarifHT?: number;
  commentaires?: string;
  sourceImport?: string;
  dateImport: string;
  idImportOLU?: string;
  collaborateur?: Collaborateur;
  formation?: Formation;
  organisme?: OrganismeFormation;
}

export interface OrganismeFormation {
  id: number;
  nomOrganisme: string;
  typeOrganisme?: string;
  contact?: string;
  actif: boolean;
}

export interface ImportLog {
  id: number;
  typeImport?: string;
  nomFichier?: string;
  dateImport: string;
  nbLignesTraitees?: number;
  nbCollaborateursAjoutes?: number;
  nbFormationsAjoutees?: number;
  nbSessionsAjoutees?: number;
  statut?: string;
  messageErreur?: string;
  utilisateurImport?: string;
}

// Types pour les DTOs (Data Transfer Objects)

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface CreateFormationDto {
  codeFormation: string;
  nomFormation: string;
  categorieId?: number;
  typeFormation?: string;
  dureePrevue?: number;
  uniteDuree?: string;
  actif?: boolean;
}

export interface UpdateFormationDto {
  nomFormation?: string;
  categorieId?: number;
  typeFormation?: string;
  dureePrevue?: number;
  uniteDuree?: string;
  actif?: boolean;
}

export interface CreateSessionDto {
  collaborateurId: number;
  formationId: number;
  organismeId?: number;
  dateDebut?: string;
  dateFin?: string;
  dureePrevue?: number;
  dureeReelle?: number;
  uniteDuree?: string;
  statut?: string;
  tarifHT?: number;
  commentaires?: string;
}

export interface UpdateSessionDto {
  dateDebut?: string;
  dateFin?: string;
  dureeReelle?: number;
  statut?: string;
  tarifHT?: number;
  commentaires?: string;
}

export interface UpdateCollaborateurDto {
  nom?: string;
  prenom?: string;
  genre?: string;
  managerId?: number;
  departementId?: number;
  contratId?: number;
  typeUtilisateur?: string;
  actif?: boolean;
}

// Types pour les réponses paginées

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Meta données spécifiques pour les sessions
export interface SessionPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SessionPaginatedResponse {
  data: SessionFormationResponse[];
  meta: SessionPaginationMeta;
}

// Types pour les sessions groupées
export interface GroupedSessionParticipant {
  sessionId: number;
  collaborateurId: number;
  nom: string;
  prenom: string;
  email: string;
  departement: string;
  matricule?: string;
  statut: string;
  dateDebut?: string;
  dateFin?: string;
  note?: number;
  commentaire?: string;
}

export interface GroupedSessionStats {
  total: number;
  inscrit: number;
  enCours: number;
  complete: number;
  annule: number;
}

export interface GroupedSession {
  groupKey: string;
  formationId: number;
  formationNom: string;
  formationCode: string;
  categorie?: string;
  typeFormation?: string;
  dureeHeures?: number;
  dateDebut?: string;
  dateFin?: string;
  organisme?: string;
  stats: GroupedSessionStats;
  participants: GroupedSessionParticipant[];
  tarifHT?: number;
  coutTotal?: number;
}

export interface GroupedSessionPaginatedResponse {
  data: GroupedSession[];
  meta: SessionPaginationMeta;
}

// Types pour les rapports et statistiques

export interface DashboardStats {
  totalCollaborateurs: number;
  totalFormations: number;
  totalSessions: number;
  sessionsEnCours: number;
  sessionsTerminees: number;
  tauxCompletionGlobal: number;
  collaborateursActifs: number;
  formationsActives: number;
  heuresFormationTotal: number;
  coutTotalFormations: number;
}

export interface FormationStats {
  formation: Formation;
  totalSessions: number;
  sessionsTerminees: number;
  sessionsEnCours: number;
  sessionsPlanifiees: number;
  totalParticipants: number;
  participantsUniques: number;
  tauxCompletion: number;
  dureeMovenne: number;
  coutTotal: number;
  coutMoyen: number;
}

export interface CollaborateurStats {
  collaborateur: Collaborateur;
  totalFormations: number;
  formationsCompletes: number;
  formationsEnCours: number;
  heuresFormation: number;
  dernierFormation?: SessionFormation;
  tauxCompletion: number;
}

export interface DepartementStats {
  departement: Departement;
  totalCollaborateurs: number;
  totalFormations: number;
  tauxParticipation: number;
  heuresMoyennes: number;
  topFormations: Formation[];
}

// Types pour les filtres et requêtes

export interface CollaborateurFilters {
  search?: string;
  departementId?: number;
  managerId?: number;
  contratId?: number;
  actif?: boolean | string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface FormationFilters {
  search?: string;
  categorieId?: number;
  typeFormation?: string;
  actif?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface SessionFilters {
  collaborateurId?: number;
  formationId?: number;
  organismeId?: number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Enums pour les statuts

export enum SessionStatut {
  PLANIFIE = 'planifie',
  INSCRIT = 'inscrit',
  EN_COURS = 'en_cours',
  COMPLETE = 'complete',
  ANNULE = 'annule',
  REPORTE = 'reporte',
}

export enum TypeUtilisateur {
  COLLABORATEUR = 'Collaborateur',
  MANAGER = 'Manager',
  ADMIN = 'Admin',
}

export enum ImportType {
  INITIAL = 'initial',
  OLU = 'olu',
}

export enum ImportStatut {
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ERREUR = 'erreur',
}

// Types pour les exports

export interface ExportRequest {
  format: 'excel' | 'pdf' | 'csv';
  type: 'collaborateurs' | 'formations' | 'sessions' | 'dashboard';
  filters?: any;
  colonnes?: string[];
}

// Types pour les erreurs

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Types pour les formulaires

export interface FileUpload {
  file: File;
  type: ImportType;
}

// Types utilitaires

export type ID = string | number;

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface TimelineData {
  date: string;
  value: number;
  label?: string;
}