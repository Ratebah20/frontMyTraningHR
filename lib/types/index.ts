// Types pour les rôles
export type Role = 'RH' | 'MANAGER';

// Types pour les entités principales

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  nom?: string;
  prenom?: string;
  dateCreation: string;
  derniereConnexion?: string;
  actif: boolean;
}

// Types pour les comptes manager (admin RH)
export interface ManagerAccount {
  id: number;
  collaborateurId: number;
  userId?: number;
  email: string;
  statut: 'INVITE' | 'ACTIF' | 'SUSPENDU' | 'REVOQUE';
  dateInvitation?: string;
  dateActivation?: string;
  dateSuspension?: string;
  dateRevocation?: string;
  collaborateur?: Collaborateur;
  user?: User;
}

// DTO pour accepter une invitation
export interface InvitationAcceptDto {
  token: string;
  password: string;
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
  email?: string;
  managerId?: number;
  departementId?: number;
  contratId?: number;
  typeUtilisateur: string;
  dateCreation: string;
  dateModification: string;
  actif: boolean;
  dateInactivation?: string | null;
  dateEmbauche?: string | null;
  manager?: Collaborateur;
  departement?: Departement | string;
  contrat?: TypeContrat;
  sessions?: SessionFormation[];
  nombreFormations?: number;
  _count?: {
    sessions?: number;
  };
}

export interface Departement {
  id: number;
  nomDepartement: string;
  codeDepartement?: string;
  type: string; // "DEPARTEMENT" ou "EQUIPE"
  parentId?: number | null;
  parent?: {
    id: number;
    nomDepartement: string;
    type: string;
  } | null;
  actif: boolean;
}

export interface DepartementDetail extends Departement {
  nombreCollaborateurs: number;
  nombreCollaborateursActifs: number;
  nombreSousDepartements?: number;
  cheminComplet?: string; // ex: "Marketing > Digital > SEO"
  sousDepartements?: Array<{
    id: number;
    nomDepartement: string;
    type: string;
    actif: boolean;
  }>;
}

export interface CreateDepartementDto {
  nomDepartement: string;
  codeDepartement?: string;
  type?: string; // "DEPARTEMENT" ou "EQUIPE"
  parentId?: number;
  actif?: boolean;
}

export interface UpdateDepartementDto {
  nomDepartement?: string;
  codeDepartement?: string;
  type?: string; // "DEPARTEMENT" ou "EQUIPE"
  parentId?: number;
  actif?: boolean;
}

export interface DepartementFilters {
  includeInactive?: boolean;
  search?: string;
  type?: 'DEPARTEMENT' | 'EQUIPE' | 'ALL';
  parentId?: number;
}

// Types pour la hiérarchie
export interface HierarchyNode {
  id: number;
  nomDepartement: string;
  codeDepartement: string | null;
  type: string;
  parentId: number | null;
  actif: boolean;
  nombreCollaborateurs: number;
  children: HierarchyNode[];
}

export interface HierarchyData {
  nodes: HierarchyNode[];
  totalCount: number;
}

export interface PathNode {
  id: number;
  nomDepartement: string;
  type: string;
}

export interface FullPath {
  path: string;
  nodes: PathNode[];
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
  organismeId?: number;
  typeFormation?: string;
  dureePrevue?: number;
  uniteDuree: string;
  dateCreation: string;
  actif: boolean;
  estCertifiante: boolean;
  estObligatoire: boolean;
  obligatoireType?: 'annuelle' | 'onboarding' | null;
  obligatoireAnnee?: number | null;
  categorie?: CategorieFormation;
  organisme?: OrganismeFormation;
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
  anneeBudgetaire?: number;
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
  _count?: {
    formations: number;
    sessions: number;
  };
  statistics?: {
    nbFormationsActives: number;
    nbSessionsActives: number;
  };
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
  estCertifiante?: boolean;
  estObligatoire?: boolean;
  obligatoireType?: 'annuelle' | 'onboarding' | null;
  obligatoireAnnee?: number | null;
}

export interface UpdateFormationDto {
  nomFormation?: string;
  categorieId?: number;
  typeFormation?: string;
  dureePrevue?: number;
  uniteDuree?: string;
  actif?: boolean;
  estCertifiante?: boolean;
  estObligatoire?: boolean;
  obligatoireType?: 'annuelle' | 'onboarding' | null;
  obligatoireAnnee?: number | null;
}

export interface CreateSessionDto {
  collaborateurId: number;
  formationId: number;
  organismeId?: number;
  dateDebut?: string;
  dateFin?: string;
  duree?: number;
  statut?: string;
  tarifHT?: number;
  anneeBudgetaire?: number;
  commentaire?: string;
  /**
   * Questionnaire d'évaluation à chaud envoyé automatiquement aux participants
   * dès que la session passe au statut terminé.
   * Champ absent = inchangé, null = retire le questionnaire.
   */
  questionnaireTemplateId?: number | null;
}

export interface UpdateSessionDto {
  dateDebut?: string;
  dateFin?: string;
  dureeReelle?: number;
  statut?: string;
  tarifHT?: number;
  commentaires?: string;
  /** Champ absent = inchangé, null = retire le questionnaire */
  questionnaireTemplateId?: number | null;
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
  anneeBudgetaire?: number;
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
  organismeId?: number;
  anneeBudgetaire?: number;
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
  estObligatoire?: boolean;
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

// Doit rester aligné sur src/shared/enums/session-status.enum.ts (backend).
// 'reporte' a été retiré : jamais écrit ni lu, et rejeté par la validation API.
export enum SessionStatut {
  INSCRIT = 'inscrit',
  EN_COURS = 'en_cours',
  COMPLETE = 'complete',
  ANNULE = 'annule',
}

export enum TypeUtilisateur {
  COLLABORATEUR = 'Collaborateur',
  MANAGER = 'Manager',
  DIRECTEUR = 'Directeur',
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

// Types pour la gestion des managers

export interface ManagerStats {
  id: number;
  nomComplet: string;
  departementId?: number;
  departementNom?: string;
  nombreSubordonnesDirects: number;
  nombreSubordonnesTotal: number;
  formationsEnCours: number;
  formationsTerminees: number;
  formationsPlanifiees: number;
  totalHeuresFormation: number;
  actif: boolean;
  email?: string;
  matricule?: string;
}

export interface ManagerListResponse {
  data: ManagerStats[];
  stats: {
    totalManagers: number;
    totalSubordonnes: number;
    moyenneEquipeSize: number;
  };
}

export interface TeamMember {
  id: number;
  nomComplet: string;
  matricule?: string;
  idExterne?: string;
  departement?: {
    id: number;
    nomDepartement: string;
  };
  manager?: {
    id: number;
    nomComplet: string;
  };
  isDirect: boolean;
  level: number;
  nombreFormations: number;
  actif: boolean;
  subordonnes?: TeamMember[];
}

export interface TeamDetails {
  manager: {
    id: number;
    nomComplet: string;
    matricule?: string;
    departement?: {
      id: number;
      nomDepartement: string;
    };
  };
  membres: TeamMember[];
  stats: {
    nombreTotal: number;
    nombreDirects: number;
    nombreIndirects: number;
    formationsEnCours: number;
    formationsTerminees: number;
    totalHeures: number;
  };
}

export interface HierarchyNode {
  id: number;
  nomComplet: string;
  matricule?: string;
  titre?: string;
  departement?: {
    id: number;
    nomDepartement: string;
  };
  managerId?: number;
  nombreSubordonnes: number;
  actif: boolean;
  children: HierarchyNode[];
  isManager: boolean;
  level: number;
}

export interface OrganizationHierarchy {
  roots: HierarchyNode[];
  stats: {
    totalCollaborateurs: number;
    totalManagers: number;
    profondeurMax: number;
    moyenneSubordonnesParManager: number;
  };
}

export interface AssignManagerRequest {
  managerId?: number | null;
}

export interface AssignManagerResponse {
  message: string;
  collaborateur: {
    id: number;
    nomComplet: string;
    manager?: {
      id: number;
      nomComplet: string;
    } | null;
  };
  ancienManager?: {
    id: number;
    nomComplet: string;
  } | null;
}

// ==================== TYPES POUR LES TODOS DE SESSION ====================

export interface GroupedSessionTodo {
  id: number;
  groupKey: string;
  titre: string;
  description?: string;
  isCompleted: boolean;
  priorite: 'bas' | 'normal' | 'haut';
  categorie?: 'doc_admin' | 'equipement' | 'logistique' | 'budget' | 'communication' | 'autre';
  dateEcheance?: string;
  ordre: number;
  dateCreation: string;
  dateModification: string;
  dateCompletion?: string;
  creeParUserId?: number;
}

export interface CreateSessionTodoDto {
  titre: string;
  description?: string;
  priorite?: 'bas' | 'normal' | 'haut';
  categorie?: string;
  dateEcheance?: string;
  ordre?: number;
  isCompleted?: boolean;
}

export interface UpdateSessionTodoDto {
  titre?: string;
  description?: string;
  priorite?: 'bas' | 'normal' | 'haut';
  categorie?: string;
  dateEcheance?: string;
  ordre?: number;
  isCompleted?: boolean;
}

export interface TodoOrderItem {
  id: number;
  ordre: number;
}

export interface ReorderTodosDto {
  todos: TodoOrderItem[];
}

export interface TodoTemplateItem {
  titre: string;
  description?: string;
  priorite: 'bas' | 'normal' | 'haut';
  categorie?: string;
  ordre: number;
}

export interface TodoTemplate {
  id: number;
  nom: string;
  description?: string;
  typeFormation?: 'externe' | 'interne' | 'elearning';
  items: TodoTemplateItem[];
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

// ==================== QUESTIONNAIRES D'ÉVALUATION ====================
// Même esprit que TodoTemplate : des modèles réutilisables créés par la RH.

export type QuestionType = 'note' | 'texte' | 'choix' | 'oui_non';
export type QuestionnaireType = 'chaud' | 'froid';

export interface Question {
  /** Clé de stockage des réponses : immuable une fois la question créée */
  id: string;
  libelle: string;
  type: QuestionType;
  obligatoire: boolean;
  /** Présent uniquement si type === 'choix' */
  options?: string[];
  ordre: number;
}

export interface Questionnaire {
  id: number;
  nom: string;
  description: string | null;
  type: QuestionnaireType;
  /** Déjà trié par ordre croissant côté serveur */
  questions: Question[];
  actif: boolean;
  nombreQuestions: number;
  nombreSessionsLiees: number;
  nombreEvaluations: number;
  dateCreation: string;
  dateModification: string;
}

/** Questionnaire allégé renvoyé avec une évaluation (public) */
export interface QuestionnaireLight {
  id: number;
  nom: string;
  description: string | null;
  questions: Question[];
}

export interface CreateQuestionnaireDto {
  nom: string;
  description?: string | null;
  type?: QuestionnaireType;
  questions: Question[];
  actif?: boolean;
}

export interface UpdateQuestionnaireDto {
  nom?: string;
  description?: string | null;
  type?: QuestionnaireType;
  /** Champ absent = questions inchangées côté backend */
  questions?: Question[];
  actif?: boolean;
}

export interface DeleteQuestionnaireResponse {
  success: boolean;
  /** 'desactive' = soft delete car référencé par des sessions/évaluations */
  action: 'desactive' | 'supprime';
  id: number;
  nom: string;
  message: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  progress: number;
}

export interface SessionWithTodos extends SessionFormation {
  todos?: GroupedSessionTodo[];
  todosStats?: TodoStats;
}

// Alias pour compatibilité
export type SessionTodo = GroupedSessionTodo;

// ==================== TYPES POUR LES KPIs DÉTAILLÉS ====================

export interface CategoryStats {
  nombre: number;
  formations: number;
  heures: number;
  moyenne: number;
}

export interface DetailedKPIsPeriode {
  annee: number | null;
  mois: number | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  libelle: string;
}

// Nouveaux types pour heures de formation
export interface HeuresFormationStats {
  heuresDispensees: number;      // Sessions comptées 1 fois
  heuresCumulees: number;        // Sessions × participants (collectives)
  heuresIndividuelles: number;
  heuresCollectivesDispensees: number;
  heuresCollectivesCumulees: number;
}

// Nouveaux types pour collaborateurs formés
export interface CollaborateursFormesStats {
  total: number;
  formes: number;
  formesActifs: number;
  formesInactifs: number;
  nonFormes: number;
  nonFormesActifs: number;
  nonFormesInactifs: number;
  includeInactifs: boolean;
}

// Heures par organisme
export interface HeuresParOrganisme {
  organisme: string;
  heuresDispensees: number;
}

// Stats par rôle et genre (tableau croisé)
export interface RoleGenreStats {
  homme: CategoryStats;
  femme: CategoryStats;
}

export interface ParRoleGenre {
  directeur: RoleGenreStats;
  manager: RoleGenreStats;
  nonManager: RoleGenreStats;
}

// Stats par département
export interface DepartementStatsItem {
  id: number;
  nom: string;
  stats: CategoryStats;
  sousEquipes?: DepartementStatsItem[];
}

// Stats par catégorie de formation
export interface CategorieStatsItem {
  id: number;
  nom: string;
  stats: {
    nombre: number;
    formations: number;
    heures: number;
    pourcentage: number;
  };
}

export interface StatutFormationGenre {
  effectif: number;
  formes: number;
  nonFormes: number;
  tauxFormation: number;
  effectifActifs: number;
  formesActifs: number;
  nonFormesActifs: number;
  effectifInactifs: number;
  formesInactifs: number;
  nonFormesInactifs: number;
}

export interface DetailedKPIsResponse {
  periode: DetailedKPIsPeriode;
  // Nouveaux KPIs
  heuresFormation?: HeuresFormationStats;
  collaborateurs?: CollaborateursFormesStats;
  heuresParOrganisme?: HeuresParOrganisme[];
  // KPIs existants
  parGenre: {
    homme: CategoryStats;
    femme: CategoryStats;
    nonDefini?: CategoryStats;
  };
  // Formés / non formés par genre sur la période. Optionnel pour rester
  // compatible pendant le déploiement (backend plus récent que le front).
  statutFormationParGenre?: {
    homme: StatutFormationGenre;
    femme: StatutFormationGenre;
    nonDefini: StatutFormationGenre;
    total: StatutFormationGenre;
  };
  parRole: {
    manager: CategoryStats;
    nonManager: CategoryStats;
    directeur: CategoryStats;
  };
  // Nouveaux KPIs - Tableau croisé, Départements, Catégories
  parRoleGenre?: ParRoleGenre;
  parDepartement?: DepartementStatsItem[];
  parCategorie?: CategorieStatsItem[];
}

// ==================== TYPES POUR LES SESSIONS COLLECTIVES ====================

// Enums pour sessions collectives
export enum CollectiveSessionStatut {
  INSCRIT = 'inscrit',
  EN_COURS = 'en_cours',
  COMPLETE = 'complete',
  ANNULE = 'annule',
}

export enum ParticipantStatut {
  INSCRIT = 'inscrit',
  COMPLETE = 'complete',
  DESINSCRIT = 'desinscrit',
}

export enum Modalite {
  PRESENTIEL = 'presentiel',
  DISTANCIEL = 'distanciel',
  HYBRIDE = 'hybride',
}

// Interface principale pour une session collective
export interface CollectiveSession {
  id: number;
  formationId: number;
  organismeId?: number;
  titre?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  heureDebut?: string;
  heureFin?: string;
  dureePrevue?: number;
  statut: string;
  modalite: string;
  tarifUnitaireHT?: number;
  tarifTotalHT?: number;
  anneeBudgetaire?: number;
  description?: string;
  formateurNom?: string;
  formateurContact?: string;
  lienVisio?: string;
  dateCreation?: string;
  dateModification?: string;
  // Relations
  formation?: Formation;
  organisme?: OrganismeFormation;
  participants?: CollectiveSessionParticipant[];
  _count?: {
    participants: number;
  };
}

// Participant d'une session collective
export interface CollectiveSessionParticipant {
  id: number;
  sessionCollectiveId: number;
  collaborateurId: number;
  statutIndividuel: string;
  dateInscription: string;
  presence?: boolean;
  datePresence?: string;
  noteEvaluation?: number;
  commentairesIndiv?: string;
  satisfactionNote?: number;
  satisfactionComm?: string;
  // Relations
  sessionCollective?: CollectiveSession;
  collaborateur?: Collaborateur;
}

// Session collective avec détails complets
export interface CollectiveSessionDetail extends CollectiveSession {
  participants: CollectiveSessionParticipant[];
  stats: SessionStats;
  formation: Formation;
  organisme?: OrganismeFormation;
}

// DTOs pour création/modification
export interface CreateCollectiveSessionDto {
  formationId: number;
  organismeId?: number;
  titre?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  dureePrevue?: number;
  statut?: string;
  modalite?: string;
  tarifUnitaireHT?: number;
  tarifTotalHT?: number;
  anneeBudgetaire?: number;
  description?: string;
  formateurNom?: string;
  formateurContact?: string;
  lienVisio?: string;
  // Participants initiaux (optionnel)
  participantIds?: number[];
  /**
   * Questionnaire d'évaluation à chaud envoyé automatiquement aux participants
   * dès que la session passe au statut terminé.
   * Champ absent = inchangé, null = retire le questionnaire.
   */
  questionnaireTemplateId?: number | null;
}

export interface UpdateCollectiveSessionDto {
  formationId?: number;
  organismeId?: number;
  titre?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  dureePrevue?: number;
  statut?: string;
  modalite?: string;
  tarifUnitaireHT?: number;
  tarifTotalHT?: number;
  anneeBudgetaire?: number;
  description?: string;
  formateurNom?: string;
  formateurContact?: string;
  lienVisio?: string;
  /** Champ absent = inchangé, null = retire le questionnaire */
  questionnaireTemplateId?: number | null;
}

export interface UpdateSessionStatusDto {
  statut: string;
}

// DTOs pour gestion des participants
export interface AddParticipantDto {
  collaborateurId: number;
  statutIndividuel?: string;
}

export interface AddParticipantsBulkDto {
  collaborateurIds: number[];
  statutIndividuel?: string;
}

export interface UpdateParticipantDto {
  statutIndividuel?: string;
  presence?: boolean;
  datePresence?: string;
  noteEvaluation?: number;
  commentairesIndiv?: string;
  satisfactionNote?: number;
  satisfactionComm?: string;
}

// Filtres pour requêtes
export interface CollectiveSessionFilters {
  formationId?: number;
  organismeId?: number;
  statut?: string;
  modalite?: string;
  dateDebut?: string;
  dateFin?: string;
  anneeBudgetaire?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Statistiques d'une session
export interface SessionStats {
  totalParticipants: number;
  inscrits: number;
  completes: number;
  desincrits: number;
  tauxCompletionPourcentage: number;
  capaciteUtiliseePourcentage: number;
  presences?: number;
  absences?: number;
  tauxPresencePourcentage?: number;
  noteEvaluationMoyenne?: number;
  satisfactionMoyenne?: number;
}

// Rapport de présence
export interface AttendanceReport {
  sessionId: number;
  sessionTitre: string;
  dateDebut?: string;
  dateFin?: string;
  totalParticipants: number;
  presents: number;
  absents: number;
  nonMarques: number;
  tauxPresence: number;
  participants: {
    collaborateurId: number;
    nomComplet: string;
    presence: boolean | null;
    datePresence?: string;
    statutIndividuel: string;
  }[];
}

// Résultat d'ajout en masse
export interface BulkAddResult {
  added: number;
  skipped: number;
  errors: {
    collaborateurId: number;
    reason: string;
  }[];
  participants: CollectiveSessionParticipant[];
}

// Session unifiée (individuelle OU collective)
export interface UnifiedSession {
  id: number;
  type: 'individuelle' | 'collective';
  formationId: number;
  formation?: Formation;
  organismeId?: number;
  organisme?: OrganismeFormation;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  anneeBudgetaire?: number;
  // Propriétés spécifiques aux sessions individuelles
  collaborateurId?: number;
  collaborateur?: Collaborateur;
  groupKey?: string; // Clé de regroupement pour sessions individuelles groupées
  // Propriétés spécifiques aux sessions collectives
  titre?: string;
  lieu?: string;
  modalite?: string;
  nombreParticipants?: number;
  participants?: CollectiveSessionParticipant[] | GroupedSessionParticipant[];
  // Propriétés communes
  tarifHT?: number;
  commentaires?: string;
  dateCreation?: string;
  dateModification?: string;
  // Propriétés additionnelles pour compatibilité UI
  formationNom?: string; // Nom de la formation (dupliqué pour faciliter l'accès)
  formationCode?: string; // Code de la formation
  organismeNom?: string; // Nom de l'organisme (dupliqué pour faciliter l'accès)
  categorie?: string; // Catégorie de la formation
  typeFormation?: string; // Type de formation
  dureeHeures?: number; // Durée en heures
  coutTotal?: number; // Coût total calculé
  stats?: GroupedSessionStats; // Statistiques agrégées (pour sessions groupées)
}

// Réponse paginée pour sessions unifiées
export interface UnifiedSessionPaginatedResponse {
  data: UnifiedSession[];
  meta: SessionPaginationMeta;
  stats?: {
    totalIndividuelles: number;
    totalCollectives: number;
  };
}

// Statistiques globales (toutes sessions)
export interface GlobalSessionStats {
  totalSessions: number;
  totalIndividuelles: number;
  totalCollectives: number;
  totalParticipants: number;
  tauxCompletionGlobal: number;
  heuresFormationTotales: number;
  coutTotalHT: number;
  parStatut: {
    inscrit: number;
    enCours: number;
    complete: number;
    annule: number;
  };
  parModalite?: {
    presentiel: number;
    distanciel: number;
    hybride: number;
  };
}

// ==================== BILAN ANNUEL ====================

export interface BilanAnnuelResponse {
  annee: number;
  anneePrecedente: number;
  stagiaires: {
    valeur: number;
    precedent: number;
    evolutionPct: number | null;
  };
  heures: {
    cumulees: number;
    dispensees: number;
    precedent: number;
    evolutionPct: number | null;
  };
  categoriesPrioritaires: {
    pourcentage: number;
    stagiaires: number;
    categories: string[];
  };
  distanciel: {
    pourcentage: number;
    precedentPct: number;
    evolutionPts: number;
    sessionsDistanciel: number;
    sessionsTotal: number;
  };
  maxParticipants: {
    nombre: number;
    titreSession: string | null;
  };
  formateurs: {
    formateursDistincts: number;
    organismesDistincts: number;
  };
}

// ==================== DASHBOARD : NOTIFICATIONS ET ALERTES ====================
// GET /stats/dashboard-alerts
// Toutes les alertes sont bornées à la période sélectionnée.

export interface ConformiteObligatoiresAlerte {
  /** null quand il n'y a aucune population cible ou aucune formation obligatoire */
  taux: number | null;
  collaborateursConformes: number;
  collaborateursCibles: number;
  nonConformes: number;
  nombreFormationsObligatoires: number;
}

export interface SessionsNonClotureesAlerte {
  total: number;
  individuelles: number;
  collectives: number;
}

export interface DashboardAlertesBloc {
  collaborateursSansFormation: number;
  /** Sessions démarrées depuis plus de 30 jours et toujours en cours */
  sessionsLongues: number;
  /** Sessions individuelles + collectives au statut "inscrit" créées sur la période */
  nouvellesInscriptions: number;
  nouvellesInscriptionsIndividuelles: number;
  nouvellesInscriptionsCollectives: number;
  /** Sessions dont la date de fin est passée mais qui ne sont ni terminées ni annulées */
  sessionsNonCloturees: SessionsNonClotureesAlerte;
  conformiteObligatoires: ConformiteObligatoiresAlerte;
}

export interface DashboardAlertsResponse {
  periode: {
    dateDebut: string;
    dateFin: string;
    /** false => sessionsAVenir contient les prochaines sessions DE LA PÉRIODE */
    contientAujourdhui: boolean;
  };
  sessionsAVenir: Array<{
    id: number;
    dateDebut: string | null;
    formation?: string;
    collaborateur: string;
    departement?: string;
  }>;
  alertes: DashboardAlertesBloc;
  derniereMAJ: { date: string; type: string } | null;
}

// ==================== CONFORMITÉ FORMATIONS OBLIGATOIRES ====================
// GET /stats/mandatory-trainings-kpis -> bloc parDepartement

export interface DirecteurDepartement {
  id: number;
  nomComplet: string;
  email: string | null;
}

export interface ConformiteParDepartement {
  departementId: number;
  departement: string;
  totalCollaborateurs: number;
  formes: number;
  nonFormes: number;
  tauxConformite: number;
  /** null pour le pseudo-département "Non défini" (departementId = 0) */
  directeur: DirecteurDepartement | null;
  /** true si un directeur est rattaché ET dispose d'une adresse email */
  peutEtreRelance: boolean;
}

// ==================== OBJECTIFS L&D ====================

export interface LdObjectiveTarget {
  categorieId: number;
  categorieNom: string;
  objectifCible: number;
  /** false = catégorie retirée du KPI Objectifs L&D (réintégrable) */
  suiviLd: boolean;
}

export interface LdObjectiveGlobalTarget {
  cle: 'certifiantes';
  objectifCible: number;
  dateModification: string | null;
}

export interface LdObjectiveCategorieKpi {
  categorieId: number;
  categorieNom: string;
  formations: number;
  totalSessions: number;
  sessionsCompleted: number;
  tauxCompletion: number;
  collaborateursFormes: number;
  heuresTotales: number;
  objectifCible: number;
  tauxAtteinte: number;
  evolution: number;
}

export interface LdObjectiveCertifiantesKpi {
  totalFormationsCertifiantes: number;
  totalSessions: number;
  sessionsCompleted: number;
  tauxCompletion: number;
  /** Collaborateurs distincts ayant COMPLÉTÉ au moins un contenu certifiant */
  collaborateursCertifies: number;
  totalCollaborateurs: number;
  tauxCertification: number;
  heuresTotales: number;
  objectifCible: number;
  tauxAtteinte: number;
  evolution: number;
  topFormations: Array<{
    id: number;
    nomFormation: string;
    sessionsCompleted: number;
    collaborateurs: number;
  }>;
}

export interface LdObjectivesKpisResponse {
  global: {
    totalFormations: number;
    totalSessions: number;
    sessionsCompleted: number;
    tauxCompletionGlobal: number;
    collaborateursFormes: number;
    totalCollaborateurs: number;
    heuresTotales: number;
    budgetTotal: number;
  };
  categories: LdObjectiveCategorieKpi[];
  certifiantes: LdObjectiveCertifiantesKpi;
}

export interface ObjectifCategorieRow {
  id: number;
  categorieId: number;
  objectifCible: number;
  suiviLd: boolean;
  dateModification: string;
}
