import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usersService } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
import type { User } from '@/types/models';
import {
  Plus,
  MagnifyingGlass,
  DotsThreeVertical,
  Pencil,
  Trash,
  Key,
  UserCircle,
  Eye,
  Fingerprint,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatDate } from '@/utils/date';
import type { Role } from '@/types/models';

export function Staff() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        usersService.getAllUsers(),
        rolesService.getAllRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    navigate('/admin/staff/new');
  };

  const handleOpenEdit = (user: User) => {
    navigate(`/admin/staff/edit/${user.id}`);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Eliminar al usuario "${user.name}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      await usersService.deleteUser(user.id);
      await loadData();
      toast.success('Usuario eliminado correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar usuario');
    }
  };

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`Ingresa la nueva contraseña para ${user.name}:`);

    if (!newPassword) return;

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      // TODO: Implementar resetPassword en el backend
      toast.info('Función de resetear contraseña pendiente de implementar');
    } catch (error) {
      toast.error('Error al resetear la contraseña');
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Sin rol';
  };

  const getRoleBadgeVariant = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return 'secondary';

    if (role.name.toLowerCase().includes('admin')) return 'default';
    if (role.name.toLowerCase().includes('manager') || role.name.toLowerCase().includes('gerente')) return 'secondary';
    return 'outline';
  };

  const columns: ColumnDef<User>[] = [
    {
      header: 'Usuario',
      cell: (user) => (
        <div className="flex items-center gap-3">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle size={24} className="text-primary" />
            </div>
          )}
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">@{user.username}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Contacto',
      cell: (user) => (
        <div className="text-sm">
          <div>{user.email}</div>
          {user.phone && (
            <div className="text-muted-foreground">{user.phone}</div>
          )}
        </div>
      )
    },
    {
      header: 'Puesto',
      cell: (user) => (
        user.position ? (
          <Badge variant="outline">{user.position}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">No definido</span>
        )
      )
    },
    {
      header: 'Rol',
      cell: (user) => (
        <Badge variant={getRoleBadgeVariant(user.roleId)}>
          {getRoleName(user.roleId)}
        </Badge>
      )
    },
    {
      header: 'Huella',
      cell: (user) => (
        user.fingerprintId ? (
          <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
            <CheckCircle size={14} weight="fill" />
            Registrada
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <XCircle size={14} />
            Sin huella
          </Badge>
        )
      )
    },
    {
      header: 'Estado',
      cell: (user) => (
        user.active ? (
          <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )
      )
    },
    {
      header: 'Fecha Ingreso',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.hireDate ? formatDate(user.hireDate) : formatDate(user.createdAt)}
        </span>
      )
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewingUser(user)}>
              <Eye size={16} className="mr-2" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
              <Pencil size={16} className="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
              <Key size={16} className="mr-2" />
              Cambiar contraseña
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(user)}
              className="text-destructive focus:text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal y Staff</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema y el personal del gimnasio
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="lg">
          <Plus size={20} className="mr-2" weight="bold" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Usuarios</div>
            <div className="text-2xl font-bold mt-1">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Activos</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {users.filter(u => u.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Inactivos</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">
              {users.filter(u => !u.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Fingerprint size={16} /> Con Huella
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {users.filter(u => u.fingerprintId).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Roles Únicos</div>
            <div className="text-2xl font-bold mt-1">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MagnifyingGlass size={20} className="text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario, email o puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <DataTable
            data={filteredUsers}
            columns={columns}
            emptyMessage={searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          />
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          roles={roles}
          onClose={() => setViewingUser(null)}
          onEdit={() => {
            if (viewingUser) {
              navigate(`/admin/staff/edit/${viewingUser.id}`);
              setViewingUser(null);
            }
          }}
        />
      )}
    </div>
  );
}

// Componente para ver detalles del usuario
function UserDetailModal({
  user,
  roles,
  onClose,
  onEdit
}: {
  user: User;
  roles: any[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const role = roles.find(r => r.id === user.roleId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle size={40} className="text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Información Personal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div>{user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Teléfono</div>
                  <div>{user.phone || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fecha de Nacimiento</div>
                  <div>{user.birthDate ? formatDate(user.birthDate) : 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dirección</div>
                  <div className="text-sm">{user.address || 'No especificado'}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Información Laboral</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Puesto</div>
                  <div>{user.position || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rol</div>
                  <div>{role?.name || 'Sin rol'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fecha de Ingreso</div>
                  <div>{user.hireDate ? formatDate(user.hireDate) : 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Salario</div>
                  <div>{user.salary ? `Q ${user.salary.toLocaleString()}` : 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estado</div>
                  <div>
                    {user.active ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {user.fingerprintId && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Fingerprint size={20} className="text-blue-600" />
                  Huella Digital
                </h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <CheckCircle size={24} className="text-blue-600" weight="fill" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Huella Registrada</div>
                        <div className="text-sm text-muted-foreground">ID: {user.fingerprintId}</div>
                        {user.fingerprintRegisteredAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Registrada: {formatDate(user.fingerprintRegisteredAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {user.photos && user.photos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Galería de Fotos ({user.photos.length})</h3>
                <div className="grid grid-cols-3 gap-3">
                  {user.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user.emergencyContact && (
              <div>
                <h3 className="font-semibold mb-3">Contacto de Emergencia</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Nombre</div>
                    <div>{user.emergencyContact.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Teléfono</div>
                    <div>{user.emergencyContact.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Relación</div>
                    <div>{user.emergencyContact.relationship}</div>
                  </div>
                </div>
              </div>
            )}

            {(user.cvUrl || (user.documentsUrls && user.documentsUrls.length > 0)) && (
              <div>
                <h3 className="font-semibold mb-3">Documentos</h3>
                <div className="space-y-2">
                  {user.cvUrl && (
                    <div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={user.cvUrl} target="_blank" rel="noopener noreferrer">
                          Ver Hoja de Vida (CV)
                        </a>
                      </Button>
                    </div>
                  )}
                  {user.documentsUrls && user.documentsUrls.length > 0 && (
                    <div className="space-y-1">
                      {user.documentsUrls.map((url, idx) => (
                        <div key={idx}>
                          <Button variant="outline" size="sm" asChild>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              Documento {idx + 1}
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.notes && (
              <div>
                <h3 className="font-semibold mb-3">Notas</h3>
                <div className="text-sm bg-muted p-3 rounded-lg">
                  {user.notes}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
              <Button onClick={onEdit}>
                <Pencil size={16} className="mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
