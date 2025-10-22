import api from '../api';
import {
  ManagerListResponse,
  TeamDetails,
  OrganizationHierarchy,
  AssignManagerRequest,
  AssignManagerResponse
} from '../types';

export const managersService = {
  /**
   * Récupère la liste de tous les managers avec leurs statistiques
   */
  async getManagers(): Promise<ManagerListResponse> {
    const response = await api.get('/collaborateurs/managers/list');
    return response.data;
  },

  /**
   * Récupère l'équipe complète d'un manager (subordonnés directs et indirects)
   */
  async getManagerTeam(managerId: number): Promise<TeamDetails> {
    const response = await api.get(`/collaborateurs/managers/${managerId}/team`);
    return response.data;
  },

  /**
   * Récupère la hiérarchie complète de l'organisation
   */
  async getOrganizationHierarchy(): Promise<OrganizationHierarchy> {
    const response = await api.get('/collaborateurs/managers/hierarchy');
    return response.data;
  },

  /**
   * Assigne ou change le manager d'un collaborateur
   * @param collaborateurId - ID du collaborateur
   * @param managerId - ID du nouveau manager (null pour retirer le manager)
   */
  async assignManager(collaborateurId: number, managerId?: number | null): Promise<AssignManagerResponse> {
    const data: AssignManagerRequest = { managerId };
    const response = await api.patch(`/collaborateurs/${collaborateurId}/assign-manager`, data);
    return response.data;
  },

  /**
   * Retire le manager d'un collaborateur
   */
  async removeManager(collaborateurId: number): Promise<AssignManagerResponse> {
    return this.assignManager(collaborateurId, null);
  },
};
