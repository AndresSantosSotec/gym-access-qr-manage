import { useKV } from '@github/spark/hooks';

interface AuthState {
  token: string;
    usern
  createdAt: st

  co
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
  co

  const logout = () => {
    setAuth(null);
  };

}








