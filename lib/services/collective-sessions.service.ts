import {
  CollectiveSession,
  CollectiveSessionDetail,
  CreateCollectiveSessionDto,
  UpdateCollectiveSessionDto,
  UpdateSessionStatusDto,
  CollectiveSessionFilters,
  AddParticipantDto,
  AddParticipantsBulkDto,
  UpdateParticipantDto,
  SessionStats,
  AttendanceReport,
  BulkAddResult,
  CollectiveSessionParticipant,
  PaginatedResponse,
  SessionPaginationMeta,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Service pour gérer les sessions collectives via l'API
 */
export class CollectiveSessionsService {
  /**
   * Créer une nouvelle session collective
   */
  static async create(
    data: CreateCollectiveSessionDto,
  ): Promise<CollectiveSession> {
    const response = await fetch(`${API_BASE_URL}/collective-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de la session');
    }

    return response.json();
  }

  /**
   * Lister toutes les sessions collectives avec filtres
   */
  static async findAll(
    filters?: CollectiveSessionFilters,
  ): Promise<{ data: CollectiveSession[]; meta: SessionPaginationMeta }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/collective-sessions?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des sessions');
    }

    return response.json();
  }

  /**
   * Obtenir une session collective par ID
   */
  static async findOne(id: number): Promise<CollectiveSessionDetail> {
    const response = await fetch(`${API_BASE_URL}/collective-sessions/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Session collective introuvable');
    }

    return response.json();
  }

  /**
   * Mettre à jour une session collective
   */
  static async update(
    id: number,
    data: UpdateCollectiveSessionDto,
  ): Promise<CollectiveSession> {
    const response = await fetch(`${API_BASE_URL}/collective-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    return response.json();
  }

  /**
   * Supprimer une session collective
   */
  static async delete(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/collective-sessions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }

    return response.json();
  }

  /**
   * Mettre à jour le statut d'une session
   */
  static async updateStatus(
    id: number,
    statut: string,
  ): Promise<CollectiveSession> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ statut }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
    }

    return response.json();
  }

  /**
   * Dupliquer une session collective
   */
  static async duplicate(id: number): Promise<CollectiveSession> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${id}/duplicate`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la duplication');
    }

    return response.json();
  }

  /**
   * Obtenir les statistiques d'une session
   */
  static async getStats(id: number): Promise<SessionStats> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${id}/stats`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    return response.json();
  }

  // ==================== GESTION DES PARTICIPANTS ====================

  /**
   * Ajouter un participant à une session
   */
  static async addParticipant(
    sessionId: number,
    data: AddParticipantDto,
  ): Promise<CollectiveSessionParticipant> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${sessionId}/participants`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'ajout du participant');
    }

    return response.json();
  }

  /**
   * Ajouter plusieurs participants en masse
   */
  static async addParticipantsBulk(
    sessionId: number,
    data: AddParticipantsBulkDto,
  ): Promise<BulkAddResult> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${sessionId}/participants/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'ajout des participants');
    }

    return response.json();
  }

  /**
   * Obtenir tous les participants d'une session
   */
  static async getParticipants(
    sessionId: number,
  ): Promise<CollectiveSessionParticipant[]> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${sessionId}/participants`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des participants');
    }

    return response.json();
  }

  /**
   * Mettre à jour les informations d'un participant
   */
  static async updateParticipant(
    sessionId: number,
    collaborateurId: number,
    data: UpdateParticipantDto,
  ): Promise<CollectiveSessionParticipant> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${sessionId}/participants/${collaborateurId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    return response.json();
  }

  /**
   * Retirer un participant d'une session
   */
  static async removeParticipant(
    sessionId: number,
    collaborateurId: number,
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${sessionId}/participants/${collaborateurId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors du retrait du participant');
    }

    return response.json();
  }

  // ==================== RAPPORTS & PRÉSENCE ====================

  /**
   * Obtenir le rapport de présence d'une session
   */
  static async getAttendanceReport(id: number): Promise<AttendanceReport> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${id}/attendance`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du rapport de présence');
    }

    return response.json();
  }

  /**
   * Marquer tous les participants comme présents ou absents
   */
  static async markAllPresent(
    id: number,
    present: boolean,
  ): Promise<{ message: string; totalUpdated: number }> {
    const response = await fetch(
      `${API_BASE_URL}/collective-sessions/${id}/attendance/mark-all?present=${present}`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Erreur lors du marquage de présence');
    }

    return response.json();
  }

  /**
   * Marquer la présence d'un participant individuel
   */
  static async markPresence(
    sessionId: number,
    collaborateurId: number,
    present: boolean,
  ): Promise<CollectiveSessionParticipant> {
    return this.updateParticipant(sessionId, collaborateurId, {
      presence: present,
      datePresence: present ? new Date().toISOString() : undefined,
    });
  }
}

// Hook React Query pour utiliser le service
export const useCollectiveSessions = {
  /**
   * Hook pour lister les sessions
   */
  useList: (filters?: CollectiveSessionFilters) => {
    // TODO: Implémenter avec React Query/SWR
    // return useQuery(['collective-sessions', filters], () =>
    //   CollectiveSessionsService.findAll(filters)
    // );
  },

  /**
   * Hook pour obtenir une session
   */
  useOne: (id: number) => {
    // TODO: Implémenter avec React Query/SWR
    // return useQuery(['collective-session', id], () =>
    //   CollectiveSessionsService.findOne(id)
    // );
  },

  /**
   * Hook pour créer une session
   */
  useCreate: () => {
    // TODO: Implémenter avec React Query useMutation
    // return useMutation(CollectiveSessionsService.create);
  },

  /**
   * Hook pour mettre à jour
   */
  useUpdate: () => {
    // TODO: Implémenter avec React Query useMutation
    // return useMutation(({ id, data }) =>
    //   CollectiveSessionsService.update(id, data)
    // );
  },

  /**
   * Hook pour supprimer
   */
  useDelete: () => {
    // TODO: Implémenter avec React Query useMutation
    // return useMutation(CollectiveSessionsService.delete);
  },
};

export default CollectiveSessionsService;
