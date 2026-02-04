import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gear } from '@phosphor-icons/react';

export function Settings() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Ajustes del sistema (Próximamente)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear size={20} />
              Configuración General
            </CardTitle>
            <CardDescription>
              Ajustes básicos del gimnasio
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>• Nombre del gimnasio</p>
            <p>• Dirección y contacto</p>
            <p>• Horarios de apertura</p>
            <p>• Logo e imágenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear size={20} />
              Usuarios y Permisos
            </CardTitle>
            <CardDescription>
              Gestión de staff y roles
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>• Crear usuarios (recepcionistas, etc.)</p>
            <p>• Asignar roles y permisos</p>
            <p>• Registro de actividad</p>
            <p>• Seguridad y autenticación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear size={20} />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Alertas automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>• Recordatorios de vencimiento</p>
            <p>• Notificaciones por email/SMS</p>
            <p>• Promociones automáticas</p>
            <p>• Alertas de pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear size={20} />
              Integración Backend
            </CardTitle>
            <CardDescription>
              Conexión con API PHP
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>• URL del servidor</p>
            <p>• Credenciales API</p>
            <p>• Sincronización de datos</p>
            <p>• Backup automático</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            <strong>Nota:</strong> Esta sección se habilitará cuando se implemente el backend PHP.
            Actualmente el sistema funciona con datos locales en el navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
