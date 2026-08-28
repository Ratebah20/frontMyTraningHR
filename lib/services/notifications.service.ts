import api from '../api';

export interface SendReminderDto {
  // Vue par ÉQUIPE : destinataires = managers sélectionnés.
  managerIds?: number[];
  // Vue par DÉPARTEMENT : destinataires = directeurs des départements sélectionnés.
  departementIds?: number[];
  periode: 'annee' | 'mois' | 'plage';
  date?: string;
  startDate?: string;
  endDate?: string;
  // Périmètre des obligatoires visées par le rappel (défaut backend : annuelle)
  type?: 'annuelle' | 'onboarding' | 'securite';
}

/** Un destinataire tel que renvoyé par la prévisualisation d'une relance. */
export interface ReminderPreviewRecipient {
  /** Id du manager, ou id du directeur pour une relance département (0 si inconnu) */
  id: number;
  nom: string;
  email: string;
  type: 'manager' | 'departement';
  departementNom?: string;
  collaborateursCount: number;
  formationsCount: number;
  collaborateurs: Array<{ nom: string; formations: string[] }>;
  /** Dernier rappel tracé pour ce destinataire (null = jamais relancé) */
  dernierRappel: { dateEnvoi: string; statut: string } | null;
  /** Renseigné quand le destinataire ne recevra RIEN (pas d'email, pas de directeur) */
  probleme?: string;
}

/**
 * Aperçu d'une relance : mêmes destinataires que l'envoi, et VRAI corps HTML
 * du mail. Aucun envoi, aucune écriture en base.
 */
export interface ReminderPreviewResponse {
  periode: string;
  type: 'annuelle' | 'onboarding' | 'securite';
  totalDestinataires: number;
  totalInjoignables: number;
  destinataires: ReminderPreviewRecipient[];
  apercuHtml: string | null;
  apercuObjet: string | null;
}

/** Une ligne de l'historique des relances (table ReminderLog). */
export interface ReminderHistoryEntry {
  id: number;
  managerId: number;
  managerNom: string;
  managerEmail: string;
  collaborateurs: Array<{ nom: string; formations: string[] }>;
  formations: Array<{ collaborateur: string; formation: string }>;
  dateEnvoi: string;
  statut: string;
  erreurMessage: string | null;
  envoyePar: string | null;
  /** null pour les relances antérieures à la traçabilité */
  type: string | null;
  periode: string | null;
}

export interface ReminderResult {
  /**
   * Id du manager, ou id du DIRECTEUR pour une relance par département.
   * Vaut 0 quand aucun destinataire n'a pu être identifié (échec tracé).
   */
  managerId: number;
  managerNom: string;
  managerEmail: string;
  success: boolean;
  messageId?: string;
  error?: string;
  collaborateursCount: number;
  formationsCount: number;
  /** Absent = 'manager' (réponses des versions antérieures) */
  type?: 'manager' | 'departement';
  departementId?: number;
  departementNom?: string;
}

export interface SendRemindersResponse {
  success: boolean;
  message: string;
  periode: string;
  /** Managers notifiés (sémantique historique) */
  totalManagers: number;
  /** Directeurs de département notifiés */
  totalDirecteurs: number;
  /** Managers + directeurs */
  totalDestinataires: number;
  envoyesAvecSucces: number;
  erreurs: number;
  details: ReminderResult[];
}

export interface EmailStatusResponse {
  configured: boolean;
  connectionValid: boolean;
  message: string;
}

export interface SendConvocationResponse {
  success: boolean;
  message: string;
  totalDestinataires: number;
  envoyes: number;
  erreurs: number;
  sansEmail: number;
}

export const notificationsService = {
  /**
   * Envoie les rappels aux managers (managerIds) et/ou aux directeurs des
   * départements (departementIds). Au moins une des deux listes doit être
   * non vide, sinon le backend renvoie un 400.
   */
  async sendMandatoryTrainingReminders(dto: SendReminderDto): Promise<SendRemindersResponse> {
    const response = await api.post('/notifications/send-mandatory-training-reminders', dto);
    return response.data;
  },

  async checkEmailStatus(): Promise<EmailStatusResponse> {
    const response = await api.get('/notifications/email-status');
    return response.data;
  },

  async sendSessionNotification(sessionId: number, type: 'individuelle' | 'collective'): Promise<{ success: boolean; message: string; recipients?: number }> {
    const response = await api.post('/notifications/send-session-notification', { sessionId, type });
    return response.data;
  },

  async sendConvocation(sessionId: number, type: 'individuelle' | 'collective'): Promise<SendConvocationResponse> {
    const response = await api.post('/notifications/send-convocation', { sessionId, type });
    return response.data;
  },

  /**
   * Aperçu d'une relance : lecture seule côté backend (aucun mail, aucune
   * écriture). Même DTO que l'envoi, donc mêmes destinataires.
   */
  async previewMandatoryTrainingReminders(dto: SendReminderDto): Promise<ReminderPreviewResponse> {
    const response = await api.post('/notifications/mandatory-training-reminders/preview', dto);
    return response.data;
  },

  async getReminderHistory(params?: {
    managerId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  }): Promise<ReminderHistoryEntry[]> {
    const response = await api.get('/notifications/reminder-history', { params });
    return response.data;
  },
};
