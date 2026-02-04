import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, EnvelopeSimple, DeviceMobile, Warning } from '@phosphor-icons/react';

export function Notifications() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones Push</h1>
        <p className="text-muted-foreground mt-1">
          Configura notificaciones automáticas para tus clientes
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Bell size={24} className="text-blue-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-blue-900">Funcionalidad Futura</CardTitle>
              <CardDescription className="text-blue-700">
                Sistema de notificaciones push requiere integración con servicios externos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones de Vencimiento</CardTitle>
            <CardDescription>Recordatorios automáticos de membresía</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>7 días antes del vencimiento</Label>
                <p className="text-sm text-muted-foreground">Recordatorio anticipado</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>3 días antes del vencimiento</Label>
                <p className="text-sm text-muted-foreground">Recordatorio urgente</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>El día del vencimiento</Label>
                <p className="text-sm text-muted-foreground">Notificación final</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2 mt-6">
              <Label>Plantilla de Mensaje</Label>
              <Textarea
                placeholder="Hola {nombre}, tu membresía vence en {dias} días. ¡Renueva ahora!"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promociones y Ofertas</CardTitle>
            <CardDescription>Notificaciones de marketing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Ofertas especiales</Label>
                <p className="text-sm text-muted-foreground">Promociones mensuales</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Nuevas clases disponibles</Label>
                <p className="text-sm text-muted-foreground">Avisar sobre horarios</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Eventos especiales</Label>
                <p className="text-sm text-muted-foreground">Competencias, charlas, etc.</p>
              </div>
              <Switch />
            </div>

            <div className="space-y-2 mt-6">
              <Label>Plantilla de Promoción</Label>
              <Textarea
                placeholder="¡Oferta exclusiva! {descripcion_oferta}. Válido hasta {fecha}."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canales de Notificación</CardTitle>
          <CardDescription>Configura los métodos de envío</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <EnvelopeSimple size={32} className="text-blue-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Notificaciones por correo electrónico</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Requiere SMTP</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DeviceMobile size={32} className="text-green-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">WhatsApp</CardTitle>
                <CardDescription>Mensajes por WhatsApp Business</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Requiere API</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell size={32} className="text-purple-600 mb-2" weight="duotone" />
                <CardTitle className="text-lg">Push Notifications</CardTitle>
                <CardDescription>Notificaciones en la app móvil</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Requiere FCM</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-yellow-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-yellow-900">Servicios Requeridos</CardTitle>
              <CardDescription className="text-yellow-700">
                Para implementar notificaciones se requiere:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-yellow-900">
            <li>• <strong>Email:</strong> Servidor SMTP o servicio como SendGrid, Mailgun</li>
            <li>• <strong>WhatsApp:</strong> WhatsApp Business API (Twilio, 360Dialog)</li>
            <li>• <strong>Push:</strong> Firebase Cloud Messaging (FCM) o OneSignal</li>
            <li>• <strong>Backend:</strong> Cron jobs o workers para envío programado</li>
            <li>• <strong>Base de datos:</strong> Registro de preferencias de notificación</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled>
          Guardar Configuración (Disabled - Demo)
        </Button>
      </div>
    </div>
  );
}
