import api from '../api';

export interface SendReminderDto {
  managerIds: number[];
  periode: 'annee' | 'mois' | 'plage';
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReminderResult {
  managerId: number;
  managerNom: string;
  managerEmail: string;
  success: boolean;
  messageId?: string;
  error?: string;
  collaborateursCount: number;
  formationsCount: number;
}

export interface SendRemindersResponse {
  success: boolean;
  message: string;
  periode: string;
  totalManagers: number;
  envoyesAvecSucces: number;
  erreurs: number;
  details: ReminderResult[];
}

export interface EmailStatusResponse {
  configured: boolean;
  connectionValid: boolean;
  message: string;
}

export const notificationsService = {
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
