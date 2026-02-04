import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AuthState, User } from '@/types/models';
import { usersService } from './users.service';

const DEMO_USER_USERNAME = 'admin';
const DEMO_USER_PASSWORD = 'Admin123!';

export const authService = {
  login: async (username: string, password: string): Promise<AuthState> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (username === DEMO_USER_USERNAME && password === DEMO_USER_PASSWORD) {
      let demoUser = usersService.getUserByUsername(DEMO_USER_USERNAME);
      
      if (!demoUser) {
        const roles = await import('./roles.service').then(m => m.rolesService.getAllRoles());
        const adminRole = roles.find(r => r.name === 'Admin');
        
        if (adminRole) {
          demoUser = usersService.createUser({
            name: 'Administrador Demo',
            username: DEMO_USER_USERNAME,
            email: 'admin@demo.com',
            roleId: adminRole.id,
            active: true,
          });
        }
      }

      if (!demoUser) {
        throw new Error('Error al inicializar usuario demo');
      }

      const authState: AuthState = {
        token: `mock-token-${Date.now()}`,
        user: demoUser,
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
