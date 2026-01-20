import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Configuration de base
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types pour l'authentification
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
  };
}

// Créer une instance axios avec configuration de base
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helper pour récupérer les tokens depuis localStorage et cookies
const getTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
};

// Helper pour gérer les cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Helper pour sauvegarder les tokens dans localStorage et cookies
const saveTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return;
  
  console.log('Saving tokens:', tokens);
  
  // Sauvegarder dans localStorage pour l'utilisation côté client
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  // Sauvegarder dans les cookies pour le middleware
  setCookie('accessToken', tokens.accessToken, 7); // 7 jours
  setCookie('refreshToken', tokens.refreshToken, 7);
  
  console.log('Tokens saved. Verification:', {
    localStorage: {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    }
  });
};

// Helper pour supprimer les tokens de localStorage et cookies
const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  // Supprimer de localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Supprimer les cookies
  removeCookie('accessToken');
  removeCookie('refreshToken');
};

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens();

    if (tokens?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 🔍 DEBUG: Log de TOUTES les erreurs HTTP
    if (error.response) {
      console.error(`🚨 ERREUR ${error.response.status} DÉTECTÉE`);
      console.error('URL appelée:', originalRequest.url);
      console.error('Méthode:', originalRequest.method);
      console.error('Response data:', error.response?.data);
    }

    // Si erreur 401 et qu'on a un refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 🔍 DEBUG: Log détaillé de l'erreur 401
      console.error('🚨 ERREUR 401 - Tentative de refresh du token');
      console.error('URL appelée:', originalRequest.url);
      console.error('Méthode:', originalRequest.method);
      console.error('Response data:', error.response?.data);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = getTokens();

      // 🔍 DEBUG: Vérifier l'état des tokens
      console.error('État des tokens:', {
        hasAccessToken: !!tokens?.accessToken,
        hasRefreshToken: !!tokens?.refreshToken,
        accessTokenLength: tokens?.accessToken?.length || 0,
        refreshTokenLength: tokens?.refreshToken?.length || 0
      });

      if (!tokens?.refreshToken) {
        console.error('❌ PAS DE REFRESH TOKEN - DÉCONNEXION FORCÉE');
        console.error('LocalStorage accessToken:', localStorage.getItem('accessToken'));
        console.error('LocalStorage refreshToken:', localStorage.getItem('refreshToken'));

        // 🔍 ALERT pour bloquer la redirection et voir les logs
        alert('ERREUR: Pas de refresh token trouvé! Vérifiez la console (F12) avant de cliquer OK');

        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      try {
        console.log('🔄 Tentative de refresh du token...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });

        console.log('✅ Refresh réussi!');
        const { accessToken, refreshToken } = response.data;
        saveTokens({ accessToken, refreshToken });

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError: any) {
        // 🔍 DEBUG: Log détaillé de l'échec du refresh
        console.error('❌ ÉCHEC DU REFRESH TOKEN');
        console.error('Erreur de refresh:', refreshError.response?.status, refreshError.response?.data);
        console.error('Message:', refreshError.message);

        // 🔍 ALERT pour bloquer la redirection et voir les logs
        alert(`ERREUR: Le refresh du token a échoué!\nStatus: ${refreshError.response?.status}\nMessage: ${refreshError.response?.data?.message || refreshError.message}\n\nVérifiez la console (F12) avant de cliquer OK`);

        processQueue(refreshError, null);
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Export de l'instance axios configurée
export default api;

// Fonctions utilitaires pour l'authentification
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    // Le backend retourne { user, tokens: { accessToken, refreshToken, expiresIn } }
    const { tokens, user } = response.data;
    const { accessToken, refreshToken } = tokens;

    saveTokens({ accessToken, refreshToken });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  isAuthenticated(): boolean {
    const tokens = getTokens();
    console.log('Checking authentication, tokens:', tokens);
    return !!tokens;
  },
  
  getUser() {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};