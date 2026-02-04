import { authService } from './auth.service';
import { rolesService } from './roles.service';
import type { PermissionKey } from '@/types/models';

export const can = (permission: PermissionKey): boolean => {
  const auth = authService.getCurrentUser();
  if (!auth) return false;

  const role = rolesService.getRoleById(auth.user.roleId);
  if (!role) return false;

  return role.permissions.includes(permission);
};

export const canAny = (permissions: PermissionKey[]): boolean => {
  return permissions.some(p => can(p));
};

export const canAll = (permissions: PermissionKey[]): boolean => {
  return permissions.every(p => can(p));
};
