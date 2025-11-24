import {
  UnifiedSession,
  UnifiedSessionPaginatedResponse,
  CollectiveSessionFilters,
  SessionFilters,
  GlobalSessionStats,
} from '../types';
import { sessionsService } from './sessions.service';
import CollectiveSessionsService from './collective-sessions.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UnifiedSessionFilters extends SessionFilters {
  type?: 'individuelle' | 'collective' | 'all';
}

/**
 * Service unifié pour gérer les sessions individuelles ET collectives
 * Fournit une API unique pour l'interface utilisateur
 */
export class SessionsUnifiedService {
  /**
   * Obtenir toutes les sessions (individuelles + collectives) mélangées
   */
  static async findAll(
    filters?: UnifiedSessionFilters,
  ): Promise<UnifiedSessionPaginatedResponse> {
    const type = filters?.type || 'all';

    // Si on veut seulement les individuelles
    if (type === 'individuelle') {
      const response = await sessionsService.getGroupedSessions(filters);
      return {
        data: this.mapGroupedToUnified(response.data),
        meta: response.meta,
        stats: {
          totalIndividuelles: response.meta.totalItems,
          totalCollectives: 0,
        },
      };
    }

    // Si on veut seulement les collectives
    if (type === 'collective') {
      const response = await CollectiveSessionsService.findAll(filters as CollectiveSessionFilters);
      return {
        data: this.mapCollectivesToUnified(response.data),
        meta: response.meta,
        stats: {
          totalIndividuelles: 0,
          totalCollectives: response.meta.totalItems,
        },
      };
    }

    // Si on veut TOUTES les sessions mélangées
    // Note: L'endpoint backend /sessions/unified n'existe pas encore
    // On utilise directement le merge côté client pour de meilleures performances
    return this.mergeSessionsClientSide(filters);
  }

  /**
   * Obtenir une session par ID (auto-détection du type)
   */
  static async findOne(
    id: number,
    type?: 'individuelle' | 'collective',
  ): Promise<UnifiedSession> {
    // Si le type est connu, appeler directement le bon service
    if (type === 'individuelle') {
      const session = await sessionsService.getSession(id);
      return {
        ...session,
        type: 'individuelle',
      };
    }

    if (type === 'collective') {
      const session = await CollectiveSessionsService.findOne(id);
      return {
        ...session,
        type: 'collective',
      };
    }

    // Sinon, essayer d'auto-détecter en parallèle
    // Essayer les deux types simultanément pour éviter les conflits d'ID
    const [collectiveResult, individualResult] = await Promise.allSettled([
      CollectiveSessionsService.findOne(id).then(s => ({ ...s, type: 'collective' as const })),
      sessionsService.getSession(id).then(s => ({ ...s, type: 'individuelle' as const })),
    ]);

    // Log si les deux ont réussi (collision d'ID)
    if (collectiveResult.status === 'fulfilled' && individualResult.status === 'fulfilled') {
      console.warn(
        `Collision d'ID détectée: L'ID ${id} existe à la fois comme session collective et individuelle. ` +
        `Priorisation de la session collective.`
      );
    }

    // Prioriser les sessions collectives si trouvées
    if (collectiveResult.status === 'fulfilled') {
      return collectiveResult.value;
    }

    // Sinon essayer individuelles
    if (individualResult.status === 'fulfilled') {
      return individualResult.value;
    }

    // Les deux ont échoué - logger les erreurs pour debug
    const errors = [];
    if (collectiveResult.status === 'rejected') {
      errors.push(`Collective: ${collectiveResult.reason}`);
    }
    if (individualResult.status === 'rejected') {
      errors.push(`Individuelle: ${individualResult.reason}`);
    }

    console.error(
      `Session ${id} introuvable dans les deux types.`,
      'Erreurs:', errors
    );

    throw new Error(`Session ${id} introuvable`);
  }

  /**
   * Créer une session (individuelle ou collective selon le type)
   */
  static async create(data: any, type: 'individuelle' | 'collective'): Promise<UnifiedSession> {
    if (type === 'individuelle') {
      const session = await sessionsService.createSession(data);
      return {
        ...session,
        type: 'individuelle',
      };
    } else {
      const session = await CollectiveSessionsService.create(data);
      return {
        ...session,
        type: 'collective',
      };
    }
  }

  /**
   * Mettre à jour une session
   */
  static async update(
    id: number,
    data: any,
    type: 'individuelle' | 'collective',
  ): Promise<UnifiedSession> {
    if (type === 'individuelle') {
      const session = await sessionsService.updateSession(id, data);
      return {
        ...session,
        type: 'individuelle',
      };
    } else {
      const session = await CollectiveSessionsService.update(id, data);
      return {
        ...session,
        type: 'collective',
      };
    }
  }

  /**
   * Supprimer une session
   */
  static async delete(
    id: number,
    type: 'individuelle' | 'collective',
  ): Promise<{ message: string }> {
    if (type === 'individuelle') {
      return sessionsService.cancelSession(id);
    } else {
      return CollectiveSessionsService.delete(id);
    }
  }

  /**
   * Obtenir les statistiques globales (tous types de sessions)
   */
  static async getGlobalStats(filters?: any): Promise<GlobalSessionStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/stats/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      return response.json();
    } catch (error) {
      // Fallback : calculer côté client
      console.warn('Fallback to client-side stats calculation');
      const [indivStats, collecStats] = await Promise.all([
        sessionsService.getGlobalStats(),
        this.getCollectiveStats(filters),
      ]);

      return this.mergeStatsClientSide(indivStats, collecStats);
    }
  }

  /**
   * Obtenir toutes les sessions d'un collaborateur (les deux types)
   */
  static async getCollaborateurSessions(collaborateurId: number) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/unified/collaborateur/${collaborateurId}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des sessions');
      }

      return response.json();
    } catch (error) {
      // Fallback : récupérer séparément
      console.warn('Fallback to separate fetching');
      const individuelles = await sessionsService.getCollaborateurSessions(collaborateurId);
      // TODO: Implémenter récupération sessions collectives pour un collaborateur
      return {
        individuelles: individuelles.data || [],
        collectives: [],
        total: (individuelles.data || []).length,
      };
    }
  }

  // ==================== MÉTHODES PRIVÉES ====================

  /**
   * Merger les sessions côté client si le backend ne le supporte pas encore
   * APPROCHE RAPIDE: Ne charge que la page courante de chaque type
   */
  private static async mergeSessionsClientSide(
    filters?: UnifiedSessionFilters,
  ): Promise<UnifiedSessionPaginatedResponse> {
    const requestedPage = filters?.page || 1;
    const requestedLimit = filters?.limit || 10;

    // Retirer le paramètre 'type' des filtres
    const { type, ...cleanFilters } = filters || {};

    // Stratégie simple et rapide: récupérer la même page des deux types
    // Chaque type retourne sa propre page, on les mélange
    const [indivResponse, collecResponse] = await Promise.all([
      sessionsService.getGroupedSessions({
        ...cleanFilters,
        page: requestedPage,
        limit: requestedLimit,
      }),
      CollectiveSessionsService.findAll({
        ...cleanFilters,
        page: requestedPage,
        limit: requestedLimit,
      } as CollectiveSessionFilters),
    ]);

    const individuelles = this.mapGroupedToUnified(indivResponse.data);
    const collectives = this.mapCollectivesToUnified(collecResponse.data);

    // Mélanger et trier par date
    const allSessions = [...individuelles, ...collectives].sort((a, b) => {
      const dateA = a.dateDebut ? new Date(a.dateDebut).getTime() : 0;
      const dateB = b.dateDebut ? new Date(b.dateDebut).getTime() : 0;
      return dateB - dateA; // Plus récent en premier
    });

    // Limiter au nombre demandé (les deux types peuvent retourner jusqu'à requestedLimit chacun)
    const limitedSessions = allSessions.slice(0, requestedLimit);

    // Calculer les totaux réels à partir des métadonnées backend
    const totalIndividuelles = indivResponse.meta.totalItems;
    const totalCollectives = collecResponse.meta.totalItems;
    const totalItems = totalIndividuelles + totalCollectives;
    const totalPages = Math.ceil(totalItems / requestedLimit);

    return {
      data: limitedSessions,
      meta: {
        currentPage: requestedPage,
        totalPages,
        totalItems,
        itemsPerPage: requestedLimit,
        hasNext: requestedPage < totalPages,
        hasPrevious: requestedPage > 1,
      },
      stats: {
        totalIndividuelles,
        totalCollectives,
      },
    };
  }

  /**
   * Mapper les sessions groupées vers le format unifié
   */
  private static mapGroupedToUnified(groupedSessions: any[]): UnifiedSession[] {
    return groupedSessions
      .filter((group) => {
        // Valider que les champs requis existent
        if (!group.formationId) {
          console.warn('Session groupée ignorée: formationId manquant', group);
          return false;
        }
        if (!group.participants || group.participants.length === 0) {
          console.warn('Session groupée ignorée: aucun participant', group);
          return false;
        }
        if (!group.participants[0].sessionId) {
          console.warn('Session groupée ignorée: sessionId manquant', group);
          return false;
        }
        return true;
      })
      .map((group) => {
        const firstParticipant = group.participants[0];
        const nom = firstParticipant?.nom || '';
        const prenom = firstParticipant?.prenom || '';
        return {
          id: firstParticipant?.sessionId,
          type: 'individuelle' as const,
          formationId: group.formationId,
          formation: {
            id: group.formationId,
            nomFormation: group.formationNom,
            codeFormation: group.formationCode,
          },
          groupKey: group.groupKey,
          dateDebut: group.dateDebut,
          dateFin: group.dateFin,
          statut: group.stats?.inscrit > 0 ? 'inscrit' : 'complete',
          anneeBudgetaire: firstParticipant?.anneeBudgetaire,
          collaborateurId: firstParticipant?.collaborateurId,
          collaborateur: firstParticipant
            ? {
                id: firstParticipant.collaborateurId,
                nomComplet: `${nom} ${prenom}`.trim() || 'Inconnu',
              }
            : undefined,
          tarifHT: group.tarifHT,
          commentaires: firstParticipant?.commentaire,
          // Champs additionnels pour compatibilité UI
          formationNom: group.formationNom,
          formationCode: group.formationCode,
          organismeNom: group.organisme,
          categorie: group.categorie,
          typeFormation: group.typeFormation,
          dureeHeures: group.dureeHeures,
          coutTotal: group.coutTotal,
          stats: group.stats,
          participants: group.participants,
        };
      });
  }

  /**
   * Mapper les sessions collectives vers le format unifié
   */
  private static mapCollectivesToUnified(collectiveSessions: any[]): UnifiedSession[] {
    return collectiveSessions
      .filter((session) => {
        // Valider que les champs requis existent
        if (!session.id || session.id <= 0) {
          console.warn('Session collective ignorée: id invalide', session);
          return false;
        }
        if (!session.formationId) {
          console.warn('Session collective ignorée: formationId manquant', session);
          return false;
        }
        return true;
      })
      .map((session) => ({
        id: session.id,
        type: 'collective' as const,
        formationId: session.formationId,
        formation: session.formation,
        organismeId: session.organismeId,
        organisme: session.organisme,
        dateDebut: session.dateDebut,
        dateFin: session.dateFin,
        statut: session.statut,
        anneeBudgetaire: session.anneeBudgetaire,
        titre: session.titre,
        lieu: session.lieu,
        modalite: session.modalite,
        capaciteMax: session.capaciteMax,
        nombreParticipants: session._count?.participants || 0,
        participants: session.participants,
        tarifHT: session.tarifTotalHT,
        dateCreation: session.dateCreation,
        dateModification: session.dateModification,
        // Champs additionnels pour compatibilité UI
        formationNom: session.formation?.nomFormation,
        formationCode: session.formation?.codeFormation,
        organismeNom: session.organisme?.nomOrganisme,
        categorie: session.formation?.categorie,
        typeFormation: session.formation?.typeFormation,
        dureeHeures: session.dureePrevue,
        coutTotal: session.tarifTotalHT,
      }));
  }

  /**
   * Obtenir les stats des sessions collectives
   */
  private static async getCollectiveStats(filters?: any) {
    // TODO: Implémenter l'appel API pour les stats collectives
    return {
      total: 0,
      complete: 0,
      enCours: 0,
      planifie: 0,
    };
  }

  /**
   * Merger les stats côté client
   */
  private static mergeStatsClientSide(indivStats: any, collecStats: any): GlobalSessionStats {
    return {
      totalSessions: (indivStats.totalSessions || 0) + (collecStats.total || 0),
      totalIndividuelles: indivStats.totalSessions || 0,
      totalCollectives: collecStats.total || 0,
      totalParticipants: (indivStats.totalSessions || 0) + (collecStats.total || 0),
      tauxCompletionGlobal: 0,
      heuresFormationTotales: indivStats.heuresFormationTotal || 0,
      coutTotalHT: (indivStats.coutTotalFormations || 0),
      parStatut: {
        planifie: (indivStats.sessionsPlanifiees || 0) + (collecStats.planifie || 0),
        enCours: (indivStats.sessionsEnCours || 0) + (collecStats.enCours || 0),
        complete: (indivStats.sessionsTerminees || 0) + (collecStats.complete || 0),
        annule: 0,
      },
      parModalite: {
        presentiel: 0,
        distanciel: 0,
        hybride: 0,
      },
    };
  }
}

export default SessionsUnifiedService;
