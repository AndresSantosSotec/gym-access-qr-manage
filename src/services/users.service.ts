import type { User } from '@/types/models';
import { api } from './api.service';

function mapUserFromApi(data: any): User {
  return {
    ...data,
    roleId: data.role_id ? String(data.role_id) : undefined,
    birthDate: data.birth_date,
    hireDate: data.hire_date,
    cvUrl: data.cv_url,
    fingerprintId: data.fingerprint_id ? String(data.fingerprint_id) : null,
    fingerprintRegisteredAt: data.fingerprint_registered_at,
    emergencyContact: data.emergency_contact_name ? {
      name: data.emergency_contact_name,
      phone: data.emergency_contact_phone,
      relationship: data.emergency_contact_relationship
    } : undefined
  };
}

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<any[]>('/users');
      return response.data.map(mapUserFromApi);
    } catch (e) {
      console.error('Error fetching users:', e);
      return [];
    }
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const response = await api.get(`/users/${id}`);
      return mapUserFromApi(response.data);
    } catch (e) {
      return undefined;
    }
  },

  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const users = await usersService.getAllUsers();
    return users.find(u => u.username === username);
  },

  createUser: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const response = await api.post('/users', data);
    return mapUserFromApi(response.data);
  },

  updateUser: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return mapUserFromApi(response.data);
    } catch (e) {
      return null;
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${id}`);
      return true;
    } catch (e) {
      return false;
    }
  },
};
