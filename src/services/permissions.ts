import { authService } from './auth.service';
import type { PermissionKey } from '@/types/models';

export const can = (permission: PermissionKey): boolean => {
  const auth = authService.getCurrentUser();
  if (!auth || !auth.user) return false;

  // Si el usuario tiene la relación role cargada (desde el backend)
  const role = auth.user.role;
  if (!role) return false;

  // Manejar permisos tanto si vienen como array de strings o array de objetos (slug)
  const permissions = role.permissions || [];

  return permissions.some(p => {
    if (typeof p === 'string') return p === permission;
    // @ts-ignore - Handle backend object format {slug: '...'}
    return p.slug === permission;
  });
};

export const canAny = (permissions: PermissionKey[]): boolean => {
  return permissions.some(p => can(p));
};

export const canAll = (permissions: PermissionKey[]): boolean => {
  return permissions.every(p => can(p));
};
