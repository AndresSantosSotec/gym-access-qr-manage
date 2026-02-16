import api from './api.service';
import type { User, CreateUserData, UpdateUserData } from '@/types/models';

// Helper to map backend snake_case to frontend camelCase
const mapUser = (backendUser: any): User => ({
  ...backendUser,
  id: String(backendUser.id),
  roleId: backendUser.role_id ? String(backendUser.role_id) : undefined,
  birthDate: backendUser.birth_date,
  hireDate: backendUser.hire_date,
  cvUrl: backendUser.cv_url,
  emergencyContact: {
    name: backendUser.emergency_contact_name || '',
    phone: backendUser.emergency_contact_phone || '',
    relationship: backendUser.emergency_contact_relationship || '',
  },
  fingerprintId: backendUser.fingerprint_id,
  fingerprintRegisteredAt: backendUser.fingerprint_registered_at,
  photos: (backendUser.photos || []).map((p: any) => typeof p === 'string' ? p : p.url),
  documents: (backendUser.documents || []).map((d: any) => ({
    name: d.name,
    url: d.url,
    type: d.type,
    category: d.category
  })),
  createdAt: backendUser.created_at,
  updatedAt: backendUser.updated_at,
});

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<any[]>('/users');
    return response.data.map(mapUser);
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<any>(`/users/${id}`);
    return mapUser(response.data);
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<any>('/users', data);
    return mapUser(response.data);
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.put<any>(`/users/${id}`, data);
    return mapUser(response.data);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
