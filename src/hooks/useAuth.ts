import { useKV } from '@github/spark/hooks';

  user: {
    username: st
  user: {
    id: string;
    username: string;
expo
  createdAt: string;
}

export function useAuth() {
  const [auth, setAuth] = useKV<AuthState | null>('auth-state', null);

  const login = (username: string, password: string) => {
    if (username && password) {
      const authState: AuthState = {
        token: 'demo-token-' + Date.now(),
        user: {
          id: Date.now().toString(),
          username: username,
        },
        createdAt: new Date().toISOString(),
      };
      setAuth(authState);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth(null);
  };

    isAuthenticated,





    isAuthenticated,
  };
}
