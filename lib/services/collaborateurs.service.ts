import api from '../api';
import {
  Collaborateur,
  CollaborateurFilters,
  UpdateCollaborateurDto,
  PaginatedResponse,
  SessionFormation
} from '../types';

/**
 * Congé longue durée (parental, maternité, maladie longue…).
 *
 * Champ SÉPARÉ de `actif` : le collaborateur reste dans l'effectif et visible
 * dans les listes, il est seulement exclu de la population cible des KPI de
 * formations obligatoires. Un `actif = false` ne conviendrait pas : l'import RH
 * remet `actif = true` à chaque passage pour toute personne présente dans le
 * fichier d'effectif, et un salarié en congé y figure toujours.
 *
 * Règle backend : quand `actif` passe à `false`, `enCongeLongueDuree` est remis
 * à `false` automatiquement (un ex-salarié n'est pas « en congé »).
 *
 * Types déclarés ici et non dans `lib/types/index.ts` (hors périmètre).
 */
export interface CollaborateurAvecConge extends Collaborateur {
  enCongeLongueDuree?: boolean;
}

export interface CollaborateurFiltersAvecConge extends CollaborateurFilters {
  /** `true` / `false` — omettre le filtre pour ne pas discriminer */
  enCongeLongueDuree?: boolean | string;
  /**
   * `'true'` : ne garder que les collaborateurs sans aucune formation.
   * S'accompagne éventuellement de `dateDebut` / `dateFin` (voir ci-dessous).
   */
  sansFormation?: boolean | string;
  /**
   * Bornes de période (`YYYY-MM-DD`) du filtre `sansFormation` : le backend ne
   * retient alors que les personnes sans session individuelle NI participation
   * collective sur la période (sessions sans date de début incluses).
   * Sans `sansFormation`, ces bornes n'ont aucun effet côté backend.
   */
  dateDebut?: string;
  dateFin?: string;
}

export interface UpdateCollaborateurAvecCongeDto extends UpdateCollaborateurDto {
  enCongeLongueDuree?: boolean;
}

export const collaborateursService = {
  // Créer un nouveau collaborateur
  async createCollaborateur(data: {
    matricule?: string;
    idExterne?: string;
    workerSubType?: string;
    nom: string;
    prenom: string;
    genre?: string;
    departementId?: number;
    managerId?: number;
    contratId?: number;
    typeUtilisateur?: string;
    actif?: boolean;
    enCongeLongueDuree?: boolean;
  }): Promise<any> {
    const response = await api.post('/collaborateurs', data);
    return response.data;
  },

  // Récupérer la liste des collaborateurs avec pagination et filtres
  async getCollaborateurs(
    filters?: CollaborateurFiltersAvecConge,
  ): Promise<PaginatedResponse<CollaborateurAvecConge>> {
    // Créer une copie des filtres pour éviter de modifier l'original
    const params: any = { ...filters };

    // S'assurer que actif est envoyé comme string si défini
    if (params.actif !== undefined) {
      params.actif = String(params.actif);
    }

    // Idem pour le filtre congé longue durée ('true' / 'false')
    if (params.enCongeLongueDuree !== undefined) {
      params.enCongeLongueDuree = String(params.enCongeLongueDuree);
    }

    const response = await api.get('/collaborateurs', { 
      params,
      // Forcer axios à ne pas filtrer les valeurs false
      paramsSerializer: {
        serialize: (params: any) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
              searchParams.append(key, params[key]);
            }
          });
          return searchParams.toString();
        }
      }
    });
    return response.data;
  },

  // Récupérer un collaborateur par ID
  async getCollaborateur(id: number): Promise<CollaborateurAvecConge> {
    const response = await api.get(`/collaborateurs/${id}`);
    return response.data;
  },

  // Récupérer les formations d'un collaborateur
  async getCollaborateurFormations(id: number): Promise<SessionFormation[]> {
    const response = await api.get(`/collaborateurs/${id}/formations`);
    return response.data;
  },

  // Rechercher des collaborateurs (recherche serveur, résultats limités côté backend)
  async searchCollaborateurs(
    query: string,
    options?: { includeInactive?: boolean; limit?: number }
  ): Promise<CollaborateurAvecConge[]> {
    const params: any = { q: query };
    if (options?.includeInactive) {
      params.includeInactive = 'true';
    }
    if (options?.limit) {
      params.limit = String(options.limit);
    }
    const response = await api.get('/collaborateurs/search', { params });
    return response.data;
  },

  // Mettre à jour un collaborateur
  async updateCollaborateur(
    id: number,
    data: UpdateCollaborateurAvecCongeDto,
  ): Promise<CollaborateurAvecConge> {
    const response = await api.put(`/collaborateurs/${id}`, data);
    return response.data;
  },

  // Supprimer un collaborateur
  async deleteCollaborateur(id: number): Promise<{
    message: string;
    subordonnesReassignes: number;
    formationsConservees: number;
  }> {
    const response = await api.delete(`/collaborateurs/${id}`);
    return response.data;
  },

  // Assigner ou changer le manager d'un collaborateur
  async assignManager(collaborateurId: number, managerId: number | null): Promise<any> {
    const response = await api.patch(`/collaborateurs/${collaborateurId}/assign-manager`, {
      managerId,
    });
    return response.data;
  },

  // Rattacher plusieurs collaborateurs à un manager (en lot)
  async bulkAssignManager(
    managerId: number,
    collaborateurIds: number[]
  ): Promise<{
    updated: number;
    manager?: { id: number; nomComplet: string };
    message?: string;
  }> {
    const response = await api.patch('/collaborateurs/bulk-assign-manager', {
      managerId,
      collaborateurIds,
    });
    return response.data;
  },

  // Importer des collaborateurs depuis Excel
  async importCollaborateurs(file: File, type: 'initial' | 'olu'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'initial' ? '/import/initial' : '/import/olu';
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 secondes pour l'import
    });
    
    return response.data;
  },

  // Récupérer l'historique des imports
  async getImportHistory(): Promise<any[]> {
    const response = await api.get('/import/history');
    return response.data;
  },

  // Exporter les collaborateurs en CSV
  async exportCollaborateurs(): Promise<Blob> {
    const response = await api.get('/export/collaborateurs.csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};