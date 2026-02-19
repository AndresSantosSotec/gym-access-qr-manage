import type { Role, PermissionKey } from '@/types/models';
import { api } from './api.service';

function mapRoleFromApi(data: any): Role {
  return {
    ...data,
    id: String(data.id),
    permissions: Array.isArray(data.permissions)
      ? data.permissions.map((p: any) => p.slug || p.name)
      : []
  };
}

export const rolesService = {
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const response = await api.get<any[]>('/roles');
      return response.data.map(mapRoleFromApi);
    } catch (e) {
      console.error('Error fetching roles:', e);
      return [];
    }
  },

  getRoleById: async (id: string): Promise<Role | undefined> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return mapRoleFromApi(response.data);
    } catch (e) {
      return undefined;
    }
  },

  createRole: async (data: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    const response = await api.post('/roles', data);
    return mapRoleFromApi(response.data);
  },

  updateRole: async (id: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<Role | null> => {
    try {
      const response = await api.put(`/roles/${id}`, data);
      return mapRoleFromApi(response.data);
    } catch (e) {
      return null;
    }
  },

  deleteRole: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/roles/${id}`);
      return true;
    } catch (e) {
      return false;
    }
  },

  hasPermission: async (roleId: string, permission: PermissionKey): Promise<boolean> => {
    const role = await rolesService.getRoleById(roleId);
    if (!role) return false;
    return role.permissions.includes(permission);
  },
};
