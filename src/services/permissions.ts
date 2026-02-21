import { authService } from './auth.service';
import { rolesService } from './roles.service';
import type { PermissionKey } from '@/types/models';

export const can = async (permission: PermissionKey): Promise<boolean> => {
  const auth = await authService.getCurrentUser();
  if (!auth) return false;

  // If user already has the role object loaded with permissions, use it directly
  if (auth.user.role?.permissions) {
    return auth.user.role.permissions.includes(permission);
  }

  // Fallback: fetch role by ID (avoid calling with undefined)
  if (!auth.user.roleId) return false;

  const role = await rolesService.getRoleById(auth.user.roleId);
  if (!role) return false;

  return role.permissions.includes(permission);
};

export const canAny = async (permissions: PermissionKey[]): Promise<boolean> => {
  const results = await Promise.all(permissions.map(p => can(p)));
  return results.some(r => r);
};

export const canAll = async (permissions: PermissionKey[]): Promise<boolean> => {
  const results = await Promise.all(permissions.map(p => can(p)));
  return results.every(r => r);
};
