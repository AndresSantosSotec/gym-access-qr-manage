import { useState, useCallback } from 'react';
import axios from 'axios';
import type { AuthState } from '@/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Unified auth key — must match STORAGE_KEYS.AUTH ('gym_auth')
 * and what api.service.ts reads for Bearer token injection.
 */
const AUTH_KEY = 'gym_auth';

/** Also keep legacy key in sync so authService.getCurrentUser() works */
const LEGACY_AUTH_KEY = 'auth-state';

function readAuth(): AuthState | null {
  try {
    const item = window.localStorage.getItem(AUTH_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function writeAuth(auth: AuthState | null) {
  try {
    if (auth) {
      const json = JSON.stringify(auth);
      window.localStorage.setItem(AUTH_KEY, json);
      window.localStorage.setItem(LEGACY_AUTH_KEY, json);
    } else {
      window.localStorage.removeItem(AUTH_KEY);
      window.localStorage.removeItem(LEGACY_AUTH_KEY);
    }
  } catch (e) {
    console.warn('Error saving auth state:', e);
  }
}

export function useAuth() {
  const [auth, setAuthState] = useState<AuthState | null>(() => readAuth());

  const setAuth = useCallback((a: AuthState | null) => {
    setAuthState(a);
    writeAuth(a);
  }, []);

  /**
   * Real login — calls POST /api/login on the Laravel backend.
   * The backend returns { access_token, token_type, user }.
   * We map the snake_case user to our camelCase AuthState.
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    const data = response.data;

    const backendUser = data.user;

    const authState: AuthState = {
      token: data.access_token,
      user: {
        id: String(backendUser.id),
        name: backendUser.name ?? '',
        username: backendUser.username ?? backendUser.email ?? '',
        email: backendUser.email ?? '',
        roleId: String(backendUser.role_id ?? ''),
        role: backendUser.role
          ? {
              id: String(backendUser.role.id),
              name: backendUser.role.name,
              description: backendUser.role.description ?? '',
              permissions: (backendUser.role.permissions ?? []).map(
                (p: any) => p.name ?? p
              ),
              createdAt: backendUser.role.created_at ?? '',
            }
          : undefined,
        active: backendUser.active ?? true,
        createdAt: backendUser.created_at ?? new Date().toISOString(),
      },
    };

    setAuth(authState);
    return true;
  }, [setAuth]);

  const logout = useCallback(async () => {
    // Try to call backend logout (revoke token)
    try {
      const current = readAuth();
      if (current?.token) {
        await axios.post(
          `${API_URL}/logout`,
          {},
          { headers: { Authorization: `Bearer ${current.token}` } }
        );
      }
    } catch {
      // Ignore — we clear local state anyway
    }
    setAuth(null);
  }, [setAuth]);

  return {
    auth,
    login,
    logout,
    isAuthenticated: !!auth,
  };
}
