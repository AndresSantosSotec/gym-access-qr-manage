import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { rolesService } from '@/services/roles.service';
import { usersService } from '@/services/users.service';
import type { Role, PermissionKey } from '@/types/models';
import { Plus, Pencil, Trash, UserGear } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatDate } from '@/utils/date';

const PERMISSION_GROUPS = {
  'Dashboard': ['DASHBOARD_VIEW'] as PermissionKey[],
  'Clientes': ['CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_EDIT', 'CLIENTS_DELETE'] as PermissionKey[],
  'Planes': ['PLANS_VIEW', 'PLANS_MANAGE'] as PermissionKey[],
  'Membresías': ['MEMBERSHIPS_VIEW', 'MEMBERSHIPS_MANAGE'] as PermissionKey[],
  'Pagos': ['PAYMENTS_VIEW', 'PAYMENTS_MANAGE'] as PermissionKey[],
  'Caja': ['CASH_VIEW', 'CASH_MANAGE'] as PermissionKey[],
  'Inventario': ['INVENTORY_VIEW', 'INVENTORY_MANAGE'] as PermissionKey[],
  'Control de Acceso': ['ACCESS_VIEW', 'ACCESS_MANAGE'] as PermissionKey[],
  'Configuración': ['SETTINGS_VIEW', 'SETTINGS_MANAGE'] as PermissionKey[],
  'Roles': ['ROLES_VIEW', 'ROLES_MANAGE'] as PermissionKey[],
  'Usuarios': ['USERS_VIEW', 'USERS_MANAGE'] as PermissionKey[],
  'Varios': ['REPORTS_VIEW', 'NOTIFICATIONS_VIEW', 'CAMERAS_VIEW'] as PermissionKey[],
};

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await rolesService.getAllRoles();
      setRoles(data);
    } catch (error) {
      toast.error('Error al cargar roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setPermissions([]);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    // Ensure permissions is an array of strings (backend might return objects)
    const perms = Array.isArray(role.permissions)
      ? role.permissions.map(p => typeof p === 'string' ? p : (p as any).slug)
      : [];
    setPermissions(perms);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
  };

  const handleTogglePermission = (permission: PermissionKey) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleToggleGroup = (group: PermissionKey[]) => {
    const allSelected = group.every(p => permissions.includes(p));
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !group.includes(p)));
    } else {
      setPermissions(prev => [...new Set([...prev, ...group])]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (permissions.length === 0) {
      toast.error('Debe seleccionar al menos un permiso');
      return;
    }

    try {
      if (editingRole) {
        const hasRolesManage = permissions.includes('ROLES_MANAGE');
        const otherRolesWithManage = roles.filter(
          r => r.id !== editingRole.id &&
            (Array.isArray(r.permissions) && r.permissions.some(p => (typeof p === 'string' ? p : (p as any).slug) === 'ROLES_MANAGE'))
        );

        if (!hasRolesManage && otherRolesWithManage.length === 0) {
          toast.error('Debe existir al menos un rol con permiso ROLES_MANAGE');
          return;
        }

        await rolesService.updateRole(editingRole.id, { name, description, permissions });
        toast.success('Rol actualizado');
      } else {
        await rolesService.createRole({ name, description, permissions });
        toast.success('Rol creado');
      }

      await loadRoles();
      handleCloseDialog();
    } catch (error) {
      toast.error('Error al guardar el rol');
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;

    try {
      const users = await usersService.getAllUsers();
      const usersWithRole = users.filter(u => u.roleId === role.id || (u as any).role_id === role.id);

      if (usersWithRole.length > 0) {
        toast.error(`No se puede eliminar. ${usersWithRole.length} usuario(s) tienen este rol.`);
        return;
      }

      const rolePerms = Array.isArray(role.permissions)
        ? role.permissions.map(p => typeof p === 'string' ? p : (p as any).slug)
        : [];

      if (rolePerms.includes('ROLES_MANAGE')) {
        const otherRolesWithManage = roles.filter(
          r => r.id !== role.id &&
            (Array.isArray(r.permissions) && r.permissions.some(p => (typeof p === 'string' ? p : (p as any).slug) === 'ROLES_MANAGE'))
        );

        if (otherRolesWithManage.length === 0) {
          toast.error('No se puede eliminar el último rol con permiso ROLES_MANAGE');
          return;
        }
      }

      await rolesService.deleteRole(role.id);
      await loadRoles();
      toast.success('Rol eliminado');
    } catch (error) {
      toast.error('Error al eliminar el rol');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Administra los roles del sistema y sus permisos
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" weight="bold" />
          Nuevo Rol
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <UserGear size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay roles creados</p>
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    {role.description && (
                      <CardDescription>{role.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(role)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(role.permissions || []).map((p) => {
                    const slug = typeof p === 'string' ? p : (p as any).slug;
                    return (
                      <Badge key={slug} variant="secondary">
                        {slug}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Creado: {formatDate(role.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription>
              Define el nombre y los permisos del rol
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Rol *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Recepcionista"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional del rol"
                rows={2}
              />
            </div>

            <div>
              <Label>Permisos *</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona los módulos y acciones permitidas
              </p>

              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
                  const allSelected = groupPermissions.every(p => permissions.includes(p));
                  const someSelected = groupPermissions.some(p => permissions.includes(p));

                  return (
                    <Card key={groupName}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => handleToggleGroup(groupPermissions)}
                            className={someSelected && !allSelected ? 'data-[state=checked]:bg-muted' : ''}
                          />
                          <CardTitle className="text-base">{groupName}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-8">
                          {groupPermissions.map((permission) => (
                            <div key={permission} className="flex items-center gap-2">
                              <Checkbox
                                checked={permissions.includes(permission)}
                                onCheckedChange={() => handleTogglePermission(permission)}
                              />
                              <Label className="text-sm font-normal cursor-pointer">
                                {permission.split('_').pop()}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Permisos seleccionados: {permissions.length}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingRole ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
