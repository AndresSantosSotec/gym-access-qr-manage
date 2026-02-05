import { useKV } from '@github/spark/hooks';
import type { AuthState } from '@/types/models';

  const login = async (emai
    const DEMO_USER_EMAIL = 'admin@demo.com';


      const authState: AuthState = {
        user: {
          name: 'Administrador Demo',

          active: true,

      
      return;

  };
  const logout = () => {
  };
  const isAuthenticated = !!auth?.token
  return {
    login,
    isAuthenticated,
}























