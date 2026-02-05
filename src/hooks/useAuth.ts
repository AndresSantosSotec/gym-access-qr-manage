import { useKV } from '@github/spark/hooks';
import type { AuthState } from '@/types/models';

export function useAuth() {
  const [auth, setAuth] = useKV<AuthState | null>('auth-state', null);

  const login = async (email: string, password: string) => {
    const DEMO_USER_EMAIL = 'admin@demo.com';
    const DEMO_USER_PASSWORD = 'admin123';

    if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
      const authState: AuthState = {
        token: 'demo-token-' + Date.now(),
        user: {
          id: 'demo-user-1',
          name: 'Administrador Demo',
          username: 'admin',
          email: DEMO_USER_EMAIL,
          roleId: 'admin-role',
          active: true,
          createdAt: new Date().toISOString(),
        },
      };

      setAuth(authState);
      return true;
    }

    return false;
  };

  const logout = () => {
    setAuth(null);
  };

  const isAuthenticated = !!auth?.token;

  return {
    auth,
    login,
    logout,
    isAuthenticated,
  };
}
