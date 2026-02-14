// Export centralisé de tous les services

export { authService } from '../api';
export { collaborateursService } from './collaborateurs.service';
export { formationsService } from './formations.service';
export { sessionsService } from './sessions.service';
export { statsService } from './stats.service';
export { importService } from './import.service';
export { commonService } from './common.service';
export { managersService } from './managers.service';
export { departementsService } from './departements.service';
export { organismesService } from './organismes.service';
export { exportsService } from './exports.service';
export type { ExportFilters, ExportType } from './exports.service';
export { aiAssistantService } from './ai-assistant.service';
export type { AIQueryRequest, AIResponse, AICapability, AICapabilitiesResponse, AIHealthResponse } from './ai-assistant.service';
export { notificationsService } from './notifications.service';
export type { SendReminderDto, SendRemindersResponse, EmailStatusResponse } from './notifications.service';
export { attachmentsService } from './attachments.service';
export type { Attachment } from './attachments.service';
export { managerAccountsService } from './manager-accounts.service';
export type { ManagerAccount, ManagerAccountsResponse, InvitableManager, InviteManagerDto, InviteManagerResponse } from './manager-accounts.service';
export { managerPortalService } from './manager-portal.service';
export type {
  ManagerDashboardSummary,
  ManagerDashboardCharts,
  ManagerTeamMember,
  ManagerTeamResponse,
  ManagerTeamMemberDetail,
  ManagerTeamFormation,
  ManagerTeamFormationsResponse,
  ManagerTeamStats,
} from './manager-portal.service';

// Ré-export des types pour faciliter l'import
export * from '../types';