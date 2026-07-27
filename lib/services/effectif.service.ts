import api from '../api';
import type {
  AppliquerEffectifRequest,
  AppliquerEffectifResponse,
  EffectifReconciliation,
} from '../types/effectif.types';

export const effectifService = {
  /**
   * Compare le fichier d'effectif RH aux collaborateurs enregistrés.
   * Analyse en lecture seule : rien n'est modifié tant que `appliquer` n'est pas appelé.
   */
  async analyser(file: File): Promise<EffectifReconciliation> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/effectif/analyse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 320000, // même marge que les imports Excel
    });

    return response.data;
  },

  /** Désactive ou réactive les collaborateurs sélectionnés dans l'analyse */
  async appliquer(
    request: AppliquerEffectifRequest,
  ): Promise<AppliquerEffectifResponse> {
    const response = await api.post('/import/effectif/appliquer', request);
    return response.data;
  },

  /** Récupère une analyse encore en session (30 min) */
  async getAnalyse(reconciliationId: string): Promise<EffectifReconciliation> {
    const response = await api.get(`/import/effectif/${reconciliationId}`);
    return response.data;
  },

  /** Abandonne l'analyse côté serveur */
  async annuler(reconciliationId: string): Promise<void> {
    await api.delete(`/import/effectif/${reconciliationId}`);
  },
};
