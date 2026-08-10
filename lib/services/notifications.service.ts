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
  type?: 'annuelle' | 'onboarding';
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

  async getReminderHistory(params?: {
    managerId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any> {
    const response = await api.get('/notifications/reminder-history', { params });
    return response.data;
  },
};
