import type { PermissionKey } from '@/types/models';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AuthState } from '@/types/models';

/**
 * Lee los permisos del usuario desde localStorage (síncrono).
 * No necesita async — los permisos ya vienen incluidos en el AuthState
 * desde el momento del login (useAuth.ts los guarda en 'gym_auth').
 */
function getLocalPermissions(): PermissionKey[] {
  try {
    const raw = storage.get<AuthState>(STORAGE_KEYS.AUTH);
    return (raw?.user?.role?.permissions ?? []) as PermissionKey[];
  } catch {
    return [];
  }
}

/**
 * Verifica síncronamente si el usuario tiene un permiso.
 * Lee del localStorage — nunca hace un fetch de red.
 */
export function can(permission: PermissionKey): boolean {
  const perms = getLocalPermissions();
  return perms.includes(permission);
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos.
 */
export function canAny(permissions: PermissionKey[]): boolean {
  return permissions.some(p => can(p));
}

/**
 * Verifica si el usuario tiene TODOS los permisos.
 */
export function canAll(permissions: PermissionKey[]): boolean {
  return permissions.every(p => can(p));
}
