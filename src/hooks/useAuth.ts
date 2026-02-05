import { useKV } from '@github/spark/hooks';

  user: {
    username: st
  user: {
    id: string;
    username: string;
  };
  const [auth, setAu
 

export function useAuth() {
  const [auth, setAuth] = useKV<AuthState | null>('auth-state', null);

  const login = (username: string, password: string) => {
    if (username && password) {
      const authState: AuthState = {
        token: 'demo-token-' + Date.now(),
        user: {
      return true;
          username: username,
        },
        createdAt: new Date().toISOString(),
  return

    isAuthenticated,
      return true;






    setAuth(null);


  const isAuthenticated = !!auth;


    auth,

    logout,

  };
