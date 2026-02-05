import { useKV } from '@github/spark/hooks';
import type { AuthState } from '@/types/models';

export function useAuth() {
  const [auth, setAuth, deleteAuth] = useKV<AuthState | null>('gym_auth', null);

  const login = async (email: string, password: string): Promise<void> => {
    const DEMO_USER_USERNAME = 'admin';
    const DEMO_USER_EMAIL = 'admin@demo.com';
    const DEMO_USER_PASSWORD = 'Admin123!';

    await new Promise((resolve) => setTimeout(resolve, 500));

    if ((email === DEMO_USER_USERNAME || email === DEMO_USER_EMAIL) && password === DEMO_USER_PASSWORD) {
      const authState: AuthState = {
        token: `mock-token-${Date.now()}`,
        user: {
          id: 'admin-1',
          name: 'Administrador Demo',
          username: DEMO_USER_USERNAME,
          email: DEMO_USER_EMAIL,
          roleId: 'admin-role',
          active: true,
          createdAt: new Date().toISOString(),
        },
      };
      
      setAuth((current) => authState);
      return;
    }

    throw new Error('Credenciales inválidas');
  };

  const logout = () => {
    deleteAuth();
  };

  const isAuthenticated = !!auth?.token;

  return {
    auth,
    login,
    logout,
    isAuthenticated,
  };
}
