import type { AuthState } from '@/types/models';

/**
 * Must match the key used by useAuth and api.service.ts
 */
const AUTH_KEY = 'gym_auth';

export const authService = {
  getCurrentUser: async (): Promise<AuthState | null> => {
    try {
      const item = window.localStorage.getItem(AUTH_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const item = window.localStorage.getItem(AUTH_KEY);
      const auth = item ? JSON.parse(item) : null;
      return !!auth?.token;
    } catch {
      return false;
    }
  },

  logout: async (): Promise<void> => {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem('auth-state'); // legacy cleanup
  },
};
