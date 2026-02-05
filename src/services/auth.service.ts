import type { AuthState, User } from '@/types/models';
import { usersService } from './users.service';

const DEMO_USER_USERNAME = 'admin';
const DEMO_USER_EMAIL = 'admin@demo.com';
const DEMO_USER_PASSWORD = 'Admin123!';

export const authService = {
  login: async (emailOrUsername: string, password: string): Promise<AuthState> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if ((emailOrUsername === DEMO_USER_USERNAME || emailOrUsername === DEMO_USER_EMAIL) && password === DEMO_USER_PASSWORD) {
      let demoUser = await usersService.getUserByUsername(DEMO_USER_USERNAME);
      
      if (!demoUser) {
        const roles = await import('./roles.service').then(m => m.rolesService.getAllRoles());
        const adminRole = roles.find(r => r.name === 'Admin');
        
        if (adminRole) {
          demoUser = await usersService.createUser({
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
      
      await window.spark.kv.set('gym_auth', authState);
      return authState;
    }

    throw new Error('Credenciales inválidas');
  },

  logout: async (): Promise<void> => {
    await window.spark.kv.delete('gym_auth');
  },

  getCurrentUser: async (): Promise<AuthState | null> => {
    return await window.spark.kv.get<AuthState>('gym_auth') || null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const auth = await window.spark.kv.get<AuthState>('gym_auth');
    return !!auth?.token;
  },
};
