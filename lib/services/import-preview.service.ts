import api from '../api';
import type {
  ImportPreviewResponse,
  SubmitResolutionsRequest,
  SubmitResolutionsResponse,
  RegleImport,
  EntityOption,
  TypeEntiteImport,
  UpdateRegleImportRequest,
  RulesStats,
} from '../types/import-preview.types';
import type { ImportResult } from './import.service';

export const importPreviewService = {
  /**
   * Genere un preview de l'import OLU
   */
  async generatePreview(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/olu/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes pour l'analyse
    });

    return response.data;
  },

  /**
   * Soumet les resolutions de conflits
   */
  async submitResolutions(
    data: SubmitResolutionsRequest,
  ): Promise<SubmitResolutionsResponse> {
    const response = await api.post('/import/olu/preview/resolve', data);
    return response.data;
  },

  /**
   * Confirme et execute l'import
   */
  async confirmImport(previewId: string): Promise<ImportResult> {
    const response = await api.post(
      '/import/olu/preview/confirm',
      { previewId },
      {
        timeout: 600000, // 10 minutes pour l'import
      },
    );
    return response.data;
  },

  /**
   * Annule une session de preview
   */
  async cancelPreview(previewId: string): Promise<void> {
    await api.delete(`/import/olu/preview/${previewId}`);
  },

  // ============================================
  // Gestion des regles
  // ============================================

  /**
   * Recupere toutes les regles d'import
   */
  async getRules(filters?: {
    typeEntite?: TypeEntiteImport;
    actif?: boolean;
  }): Promise<RegleImport[]> {
    const params = new URLSearchParams();
    if (filters?.typeEntite) params.append('typeEntite', filters.typeEntite);
    if (filters?.actif !== undefined) params.append('actif', String(filters.actif));

    const response = await api.get(`/import/rules?${params.toString()}`);
    return response.data;
  },

  /**
   * Recupere les statistiques des regles par type
   */
  async getRulesStats(): Promise<RulesStats[]> {
    const response = await api.get('/import/rules/stats');
    return response.data;
  },

  /**
   * Recupere une regle par son ID
   */
  async getRuleById(id: number): Promise<RegleImport> {
    const response = await api.get(`/import/rules/${id}`);
    return response.data;
  },

  /**
   * Met a jour une regle
   */
  async updateRule(
    id: number,
    data: UpdateRegleImportRequest,
  ): Promise<RegleImport> {
    const response = await api.put(`/import/rules/${id}`, data);
    return response.data;
  },

  /**
   * Desactive une regle (soft delete)
   */
  async deleteRule(id: number): Promise<void> {
    await api.delete(`/import/rules/${id}`);
  },

  /**
   * Supprime definitivement une regle
   */
  async hardDeleteRule(id: number): Promise<void> {
    await api.delete(`/import/rules/${id}/hard`);
  },

  /**
   * Recupere les entites disponibles pour le mapping
   */
  async getAvailableEntities(typeEntite: TypeEntiteImport): Promise<EntityOption[]> {
    const response = await api.get(`/import/rules/entities/${typeEntite}`);
    return response.data;
  },
};

export default importPreviewService;
