import type { Role, PermissionKey } from '@/types/models';

const ROLES_KEY = 'gymflow_roles';

export const rolesService = {
  getAllRoles: async (): Promise<Role[]> => {
    return await window.spark.kv.get<Role[]>(ROLES_KEY) || [];
  },

  getRoleById: async (id: string): Promise<Role | undefined> => {
    const roles = await rolesService.getAllRoles();
    return roles.find(r => r.id === id);
  },

  createRole: async (data: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    const roles = await rolesService.getAllRoles();
    
    const newRole: Role = {
      ...data,
      id: `role-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...roles, newRole];
    await window.spark.kv.set(ROLES_KEY, updated);
    
    return newRole;
  },

  updateRole: async (id: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<Role | null> => {
    const roles = await rolesService.getAllRoles();
    const index = roles.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    const updated = roles.map(r => 
      r.id === id ? { ...r, ...data } : r
    );
    
    await window.spark.kv.set(ROLES_KEY, updated);
    return updated[index];
  },

  deleteRole: async (id: string): Promise<boolean> => {
    const roles = await rolesService.getAllRoles();
    const filtered = roles.filter(r => r.id !== id);
    
    if (filtered.length === roles.length) return false;
    
    await window.spark.kv.set(ROLES_KEY, filtered);
    return true;
  },

  hasPermission: async (roleId: string, permission: PermissionKey): Promise<boolean> => {
    const role = await rolesService.getRoleById(roleId);
    if (!role) return false;
    return role.permissions.includes(permission);
  },
};
