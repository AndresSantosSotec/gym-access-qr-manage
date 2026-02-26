import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AuthState } from '@/types/models';
import { getApiUrl } from '@/utils/url.utils';

const API_URL = getApiUrl();

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const auth = storage.get<AuthState>(STORAGE_KEYS.AUTH);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Si el error es 401 (no autenticado), limpiar sesión
    if (error.response?.status === 401) {
      storage.remove(STORAGE_KEYS.AUTH);           // 'gym_auth'
      storage.remove('auth-state' as any);          // legacy key
      // Evitar redirigir a /login si ya estamos ahí o si estamos en zona pública (/p)
      const isPublicRoute = window.location.pathname.startsWith('/p') || window.location.pathname === '/';
      if (!isPublicRoute && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Si el error es 403 (no autorizado)
    if (error.response?.status === 403) {
      console.error('No tienes permisos para realizar esta acción');
    }

    return Promise.reject(error);
  }
);

export const api = {
  // Métodos GET
  get: <T = any>(url: string, config = {}) => {
    return apiClient.get<T>(url, config);
  },

  // Métodos POST
  post: <T = any>(url: string, data?: any, config = {}) => {
    return apiClient.post<T>(url, data, config);
  },

  // Métodos PUT
  put: <T = any>(url: string, data?: any, config = {}) => {
    return apiClient.put<T>(url, data, config);
  },

  // Métodos PATCH
  patch: <T = any>(url: string, data?: any, config = {}) => {
    return apiClient.patch<T>(url, data, config);
  },

  // Métodos DELETE
  delete: <T = any>(url: string, config = {}) => {
    return apiClient.delete<T>(url, config);
  },

  // Obtener la instancia completa de axios si se necesita
  client: apiClient,
};

// Tipos de respuesta comunes
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Helper para extraer mensajes de error
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado';
};

export default api;
