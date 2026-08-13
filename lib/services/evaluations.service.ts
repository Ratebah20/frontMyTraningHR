import api from '../api';
import type {
  QuestionnaireLight,
  SessionEvaluation,
  FormationEvaluationSynthese,
  FormationEvaluationSyntheseFilters,
  SendGroupEvaluationsDto,
  SendGroupEvaluationsResponse,
  PreviewGroupEvaluationsResponse,
} from '../types';

// Types canoniques : définis dans lib/types, ré-exportés ici par commodité
export type {
  SessionEvaluation,
  FormationEvaluationSynthese,
  FormationEvaluationSyntheseFilters,
  SendGroupEvaluationsDto,
  SendGroupEvaluationsResponse,
  PreviewGroupEvaluationsResponse,
};

export type EvaluationType = 'chaud' | 'froid';
export type SessionType = 'individuelle' | 'collective';

export interface SendEvaluationsResponse {
  success: boolean;
  message: string;
  type: SessionType;
  evaluationType: EvaluationType;
  totalParticipants: number;
  envoyes: number;
  erreurs: number;
  sansEmail: number;
  dejaEnvoyees: number;
}

export interface EvaluationContext {
  formationNom: string;
  collaborateurNom: string;
  type: EvaluationType;
  statut: string;
  dateEnvoi: string;
  /**
   * Questionnaire personnalisé rattaché à l'évaluation.
   * null = évaluation antérieure à cette évolution : on retombe sur le
   * formulaire historique câblé en dur.
   */
  questionnaire?: QuestionnaireLight | null;
}

export interface SubmitEvaluationResponse {
  success: boolean;
  message: string;
}

export interface FroidEnAttenteItem {
  sessionId: number;
  type: SessionType;
  formationNom: string;
  dateFin: string | null;
  participants: number;
  collaborateurNom: string | null;
}

export const evaluationsService = {
  async sendEvaluations(
    sessionId: number,
    type: SessionType,
    evaluationType: EvaluationType,
    questionnaireTemplateId?: number,
  ): Promise<SendEvaluationsResponse> {
    const response = await api.post('/evaluations/send', {
      sessionId,
      type,
      evaluationType,
      ...(questionnaireTemplateId !== undefined ? { questionnaireTemplateId } : {}),
    });
    return response.data;
  },

  /**
   * Prévisualisation d'un envoi sur un GROUPE de sessions individuelles.
   * Lecture seule : aucun mail n'est envoyé, aucune évaluation n'est créée.
   * Renvoie uniquement des compteurs (aucune adresse email).
   */
  async previewGroupEvaluations(
    groupKey: string,
    evaluationType: EvaluationType,
  ): Promise<PreviewGroupEvaluationsResponse> {
    const response = await api.get('/evaluations/send-group/preview', {
      params: { groupKey, evaluationType },
    });
    return response.data;
  },

  /**
   * Envoi effectif des évaluations à toutes les personnes du groupe.
   * ⚠️ L'idempotence est APPLICATIVE (« déjà envoyée » vérifié à l'exécution),
   * pas garantie par une contrainte de base : ne jamais laisser un double-clic
   * déclencher deux appels.
   */
  async sendGroupEvaluations(
    dto: SendGroupEvaluationsDto,
  ): Promise<SendGroupEvaluationsResponse> {
    const response = await api.post('/evaluations/send-group', {
      groupKey: dto.groupKey,
      evaluationType: dto.evaluationType,
      ...(dto.questionnaireTemplateId !== undefined
        ? { questionnaireTemplateId: dto.questionnaireTemplateId }
        : {}),
    });
    return response.data;
  },

  async getByToken(token: string): Promise<EvaluationContext> {
    const response = await api.get(`/evaluations/token/${token}`);
    return response.data;
  },

  async submitByToken(
    token: string,
    reponses: Record<string, any>,
  ): Promise<SubmitEvaluationResponse> {
    const response = await api.post(`/evaluations/token/${token}`, { reponses });
    return response.data;
  },

  async getSessionEvaluations(
    type: SessionType,
    sessionId: number,
  ): Promise<SessionEvaluation[]> {
    const response = await api.get(`/evaluations/session/${type}/${sessionId}`);
    return response.data;
  },

  async getFroidEnAttente(): Promise<FroidEnAttenteItem[]> {
    const response = await api.get('/evaluations/a-froid-en-attente');
    return response.data;
  },

  /**
   * Synthèse des retours d'évaluation de TOUTES les sessions d'une formation.
   * L'agrégation (moyennes, répartitions, taux) est faite côté serveur.
   */
  async getFormationSynthese(
    formationId: number,
    filters: FormationEvaluationSyntheseFilters = {},
  ): Promise<FormationEvaluationSynthese> {
    const params: Record<string, string> = {};
    if (filters.evaluationType) params.evaluationType = filters.evaluationType;
    if (filters.dateDebut) params.dateDebut = filters.dateDebut;
    if (filters.dateFin) params.dateFin = filters.dateFin;

    const response = await api.get(
      `/evaluations/formation/${formationId}/synthese`,
      { params },
    );
    return response.data;
  },
};
