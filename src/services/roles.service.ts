import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Role, PermissionKey } from '@/types/models';

const ROLES_KEY = 'gymflow_roles';

export const rolesService = {
  getAllRoles: (): Role[] => {
    return storage.get<Role[]>(ROLES_KEY) || [];
  },

  getRoleById: (id: string): Role | undefined => {
    const roles = rolesService.getAllRoles();
    return roles.find(r => r.id === id);
  },

  createRole: (data: Omit<Role, 'id' | 'createdAt'>): Role => {
    const roles = rolesService.getAllRoles();
    
    const newRole: Role = {
      ...data,
      id: `role-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...roles, newRole];
    storage.set(ROLES_KEY, updated);
    
    return newRole;
  },

  updateRole: (id: string, data: Partial<Omit<Role, 'id' | 'createdAt'>>): Role | null => {
    const roles = rolesService.getAllRoles();
    const index = roles.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    const updated = roles.map(r => 
      r.id === id ? { ...r, ...data } : r
    );
    
    storage.set(ROLES_KEY, updated);
    return updated[index];
  },

  deleteRole: (id: string): boolean => {
    const roles = rolesService.getAllRoles();
    const filtered = roles.filter(r => r.id !== id);
    
    if (filtered.length === roles.length) return false;
    
    storage.set(ROLES_KEY, filtered);
    return true;
  },

  hasPermission: (roleId: string, permission: PermissionKey): boolean => {
    const role = rolesService.getRoleById(roleId);
    if (!role) return false;
    return role.permissions.includes(permission);
  },
};
