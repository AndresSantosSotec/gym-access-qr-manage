import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, Shield } from '@phosphor-icons/react';

export function Roles() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona roles de usuario y permisos del sistema
        </p>
      </div>

      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Lock size={24} className="text-yellow-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-yellow-900">Funcionalidad Planificada</CardTitle>
              <CardDescription className="text-yellow-700">
                El módulo de Roles y Permisos está en desarrollo. Funcionalidades previstas:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield size={32} className="text-blue-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">Roles Predefinidos</CardTitle>
                <CardDescription>
                  Administrador, Recepcionista, Entrenador, Mantenimiento
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <UserPlus size={32} className="text-green-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">Asignación Flexible</CardTitle>
                <CardDescription>
                  Asigna roles a usuarios y personaliza permisos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Lock size={32} className="text-purple-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">Control Granular</CardTitle>
                <CardDescription>
                  Permisos por módulo: Clientes, Pagos, Reportes, etc.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-white p-6 rounded-lg border mt-6">
            <h3 className="font-bold text-lg mb-4">Permisos por Módulo (Demo)</h3>
            <div className="space-y-3">
              {[
                { module: 'Clientes', permissions: ['Ver', 'Crear', 'Editar', 'Eliminar'] },
                { module: 'Membresías', permissions: ['Ver', 'Asignar', 'Modificar'] },
                { module: 'Pagos', permissions: ['Ver', 'Registrar', 'Anular'] },
                { module: 'Control de Acceso', permissions: ['Verificar', 'Reportes'] },
                { module: 'Configuración', permissions: ['Acceso Completo'] },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{item.module}</span>
                  <div className="flex gap-2">
                    {item.permissions.map((perm, i) => (
                      <Badge key={i} variant="outline">{perm}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-900">
              <strong>Próximos pasos:</strong> Para implementar esta funcionalidad se requiere:
              backend para gestión de usuarios, JWT con roles, middleware de autorización,
              y UI completa para CRUD de roles y permisos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
