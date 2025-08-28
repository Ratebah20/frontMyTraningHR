// Export centralisé de tous les services

export { authService } from '../api';
export { collaborateursService } from './collaborateurs.service';
export { formationsService } from './formations.service';
export { sessionsService } from './sessions.service';
export { statsService } from './stats.service';
export { importService } from './import.service';
export { commonService } from './common.service';

// Ré-export des types pour faciliter l'import
export * from '../types';