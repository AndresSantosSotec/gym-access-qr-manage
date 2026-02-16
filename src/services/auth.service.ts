import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AuthState, User } from '@/types/models';
import { api, getErrorMessage } from './api.service';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: any;
}

const backendRoleToFrontend = (role: any) => ({
  id: String(role.id),
  name: role.name,
  slug: role.slug,
  description: role.description,
  createdAt: role.created_at,
});

export const authService = {
  login: async (emailOrUsername: string, password: string): Promise<AuthState> => {
    try {
      // Login con el backend Laravel
      const response = await api.post<LoginResponse>('/login', {
        email: emailOrUsername,
        password: password,
      });

      const { access_token, user: backendUser } = response.data;

      // Transformar el usuario del backend al formato del frontend
      const user: User = {
        ...backendUser,
        id: String(backendUser.id),
        roleId: backendUser.role_id ? String(backendUser.role_id) : undefined,
        role: backendUser.role ? {
          ...backendRoleToFrontend(backendUser.role),
          permissions: (backendUser.role.permissions || []).map((p: any) =>
            typeof p === 'string' ? p : p.slug
          )
        } : undefined,
        active: backendUser.active !== false,
        createdAt: backendUser.created_at || new Date().toISOString(),
      };

      const authState: AuthState = {
        token: access_token,
        user: user,
      };

      storage.set(STORAGE_KEYS.AUTH, authState);
      return authState;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);

      // Mensajes de error más específicos
      if (error.response?.status === 422) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (error.response?.status === 401) {
        throw new Error('Email o contraseña incorrectos.');
      } else if (!error.response) {
        throw new Error('No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000');
      }

      throw new Error(errorMessage || 'Error al iniciar sesión');
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Intentar logout en el backend
      await api.post('/logout');
    } catch (error) {
      console.warn('Error al hacer logout en backend:', error);
    } finally {
      // Siempre limpiar el storage local
      storage.remove(STORAGE_KEYS.AUTH);
    }
  },

  getCurrentUser: (): AuthState | null => {
    return storage.get<AuthState>(STORAGE_KEYS.AUTH);
  },

  isAuthenticated: (): boolean => {
    const auth = storage.get<AuthState>(STORAGE_KEYS.AUTH);
    return !!auth?.token;
  },

  // Obtener usuario actual desde el backend
  fetchCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get<any>('/user');
      const backendUser = response.data;

      const user: User = {
        ...backendUser,
        id: String(backendUser.id),
        roleId: backendUser.role_id ? String(backendUser.role_id) : undefined,
        role: backendUser.role ? {
          ...backendRoleToFrontend(backendUser.role),
          permissions: (backendUser.role.permissions || []).map((p: any) =>
            typeof p === 'string' ? p : p.slug
          )
        } : undefined,
        active: backendUser.active !== false,
        createdAt: backendUser.created_at || new Date().toISOString(),
      };

      // Actualizar el usuario en storage
      const auth = storage.get<AuthState>(STORAGE_KEYS.AUTH);
      if (auth) {
        auth.user = user;
        storage.set(STORAGE_KEYS.AUTH, auth);
      }

      return user;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  },
};
