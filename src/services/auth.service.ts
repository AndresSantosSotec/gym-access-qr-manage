import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AuthState, User } from '@/types/models';

const DEMO_USER = {
  email: 'admin@demo.com',
  password: 'Admin123!',
  name: 'Administrador Demo',
  role: 'admin' as const,
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthState> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const authState: AuthState = {
        token: `mock-token-${Date.now()}`,
        user: {
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          role: DEMO_USER.role,
        },
      };
      
      storage.set(STORAGE_KEYS.AUTH, authState);
      return authState;
    }

    throw new Error('Credenciales inválidas');
  },

  logout: (): void => {
    storage.remove(STORAGE_KEYS.AUTH);
  },

  getCurrentUser: (): AuthState | null => {
    return storage.get<AuthState>(STORAGE_KEYS.AUTH);
  },

  isAuthenticated: (): boolean => {
    const auth = storage.get<AuthState>(STORAGE_KEYS.AUTH);
    return !!auth?.token;
  },
};
