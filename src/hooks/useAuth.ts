import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  createdAt: string;
}

const AUTH_KEY = 'auth-state';

export function useAuth() {
  // Initialize state from localStorage immediately to avoid flicker
  const [auth, setAuthState] = useState<AuthState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(AUTH_KEY);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Error reading auth state:', error);
      return null;
    }
  });

  // Function to update auth state and localStorage
  const setAuth = useCallback((validAuth: AuthState | null) => {
    setAuthState(validAuth);
    try {
      if (validAuth) {
        window.localStorage.setItem(AUTH_KEY, JSON.stringify(validAuth));
      } else {
        window.localStorage.removeItem(AUTH_KEY);
      }
    } catch (error) {
      console.warn('Error saving auth state:', error);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username && password) {
      const newAuth: AuthState = {
        token: 'demo-token-' + Date.now(),
        user: {
          id: Date.now().toString(),
          username: username,
          name: username.includes('@') ? 'Administrador' : username,
        },
        createdAt: new Date().toISOString(),
      };
      setAuth(newAuth);
      return true;
    }
    throw new Error('Credenciales inválidas');
  }, [setAuth]);

  const logout = useCallback(() => {
    setAuth(null);
  }, [setAuth]);

  return {
    auth,
    login,
    logout,
    isAuthenticated: !!auth,
  };
}
