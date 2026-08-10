import api from '../api';
import type {
  Questionnaire,
  QuestionnaireType,
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  DeleteQuestionnaireResponse,
} from '../types';

/**
 * Service pour gérer les questionnaires d'évaluation réutilisables.
 * Endpoints backend : @Controller('questionnaires')
 */

export interface GetQuestionnairesParams {
  type?: QuestionnaireType;
  /** Par défaut le backend ne renvoie que les questionnaires actifs */
  includeInactifs?: boolean;
}

// Lister les questionnaires (tri dateModification desc)
export const getQuestionnaires = async (
  params?: GetQuestionnairesParams,
): Promise<Questionnaire[]> => {
  const query: Record<string, string> = {};
  if (params?.type) {
    query.type = params.type;
  }
  // Le backend compare includeInactifs à la CHAÎNE 'true' : on omet le param sinon
  if (params?.includeInactifs) {
    query.includeInactifs = 'true';
  }

  const response = await api.get('/questionnaires', { params: query });
  return response.data;
};

// Récupérer un questionnaire (404 si absent)
export const getQuestionnaire = async (id: number): Promise<Questionnaire> => {
  const response = await api.get(`/questionnaires/${id}`);
  return response.data;
};

// Créer un questionnaire
export const createQuestionnaire = async (
  data: CreateQuestionnaireDto,
): Promise<Questionnaire> => {
  const response = await api.post('/questionnaires', data);
  return response.data;
};

// Mettre à jour un questionnaire.
// ATTENTION : `questions` absent du body = questions inchangées côté backend.
export const updateQuestionnaire = async (
  id: number,
  data: UpdateQuestionnaireDto,
): Promise<Questionnaire> => {
  const response = await api.put(`/questionnaires/${id}`, data);
  return response.data;
};

// Dupliquer un questionnaire (nom suffixé « (copie) »)
export const duplicateQuestionnaire = async (id: number): Promise<Questionnaire> => {
  const response = await api.post(`/questionnaires/${id}/duplicate`);
  return response.data;
};

// Supprimer un questionnaire.
// Soft delete (action: 'desactive') s'il est référencé, suppression réelle sinon.
export const deleteQuestionnaire = async (
  id: number,
): Promise<DeleteQuestionnaireResponse> => {
  const response = await api.delete(`/questionnaires/${id}`);
  return response.data;
};

export const questionnairesService = {
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire,
  duplicateQuestionnaire,
  deleteQuestionnaire,
};
