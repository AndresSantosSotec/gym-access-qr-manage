import api from './api.service';
import type { Role, PermissionKey } from '@/types/models';

// Helper to map backend to frontend
const mapRole = (backendRole: any): Role => ({
  ...backendRole,
  id: String(backendRole.id),
  createdAt: backendRole.created_at,
});

export const rolesService = {
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get<any[]>('/roles');
    return response.data.map(mapRole);
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await api.get<any>(`/roles/${id}`);
    return mapRole(response.data);
  },

  createRole: async (data: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    const response = await api.post<any>('/roles', data);
    return mapRole(response.data);
  },

  updateRole: async (id: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<Role> => {
    const response = await api.put<any>(`/roles/${id}`, data);
    return mapRole(response.data);
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  hasPermission: async (roleId: string, permission: PermissionKey): Promise<boolean> => {
    const role = await rolesService.getRoleById(roleId);
    if (!role) return false;
    // Assuming backend return permissions as array of objects with slug
    const permissionSlugs = (role.permissions as any).map((p: any) => p.slug || p);
    return permissionSlugs.includes(permission);
  },
};
