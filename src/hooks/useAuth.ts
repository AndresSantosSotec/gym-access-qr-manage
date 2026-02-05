import { useKV } from '@github/spark/hooks';


export function useAuth() {
  const [auth, setAuth] = useKV<AuthState | null>('auth-state', null);

        token: 'demo-token-' + Date.now(),
          id: 'demo-user-1',
          username: 'admin',

          createdAt: new Date().toISOString(),
      };
        token: 'demo-token-' + Date.now(),
    }
          id: 'demo-user-1',

          username: 'admin',


    auth,
          createdAt: new Date().toISOString(),
  };
      };

      setAuth(authState);

    }

    return false;
  };

  const logout = () => {

  };



  return {

    login,

    isAuthenticated,

}
