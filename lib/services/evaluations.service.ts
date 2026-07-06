import api from '../api';

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
}

export interface SubmitEvaluationResponse {
  success: boolean;
  message: string;
}

export interface SessionEvaluation {
  id: number;
  type: EvaluationType;
  statut: string;
  destinataireEmail: string;
  collaborateurId?: number;
  collaborateurNom: string;
  dateEnvoi: string;
  dateReponse: string | null;
  reponses: Record<string, any> | null;
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
  ): Promise<SendEvaluationsResponse> {
    const response = await api.post('/evaluations/send', { sessionId, type, evaluationType });
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
};
