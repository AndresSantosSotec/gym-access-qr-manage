import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, QrCode, Video, Warning } from '@phosphor-icons/react';

export function Cameras() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integración con Cámaras</h1>
        <p className="text-muted-foreground mt-1">
          Sistema de escaneo automático de QR con cámaras
        </p>
      </div>

      <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Camera size={24} className="text-green-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-green-900">Funcionalidad Futura</CardTitle>
              <CardDescription className="text-green-700">
                Integración con cámaras de seguridad para control de acceso automatizado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fuentes de Cámara</CardTitle>
            <CardDescription>Cámaras conectadas al sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Entrada Principal', status: 'offline', ip: '192.168.1.100' },
              { name: 'Recepción', status: 'offline', ip: '192.168.1.101' },
              { name: 'Área de Pesas', status: 'offline', ip: '192.168.1.102' },
            ].map((camera, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video size={24} weight="duotone" />
                  <div>
                    <p className="font-medium">{camera.name}</p>
                    <p className="text-sm text-muted-foreground">{camera.ip}</p>
                  </div>
                </div>
                <Badge variant={camera.status === 'online' ? 'default' : 'secondary'}>
                  {camera.status === 'online' ? 'En línea' : 'Sin conexión'}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4" disabled>
              + Agregar Cámara (Demo)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Escaneo</CardTitle>
            <CardDescription>Parámetros de detección de QR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zona de Escaneo</span>
                <Badge variant="outline">Centro de la imagen</Badge>
              </div>
              <div className="h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <QrCode size={64} className="mx-auto text-muted-foreground mb-2" weight="duotone" />
                  <p className="text-sm text-muted-foreground">Vista previa de cámara</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className="text-sm">Detección Automática</span>
                <Badge>Habilitado</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className="text-sm">Tiempo de Escaneo</span>
                <Badge variant="outline">500ms</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className="text-sm">Confirmación Visual</span>
                <Badge>Sí</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <span className="text-sm">Audio de Confirmación</span>
                <Badge>Sí</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Escaneos Automáticos</CardTitle>
          <CardDescription>Últimos accesos detectados por cámaras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Camera size={48} className="mx-auto mb-4" weight="duotone" />
            <p>No hay escaneos registrados</p>
            <p className="text-sm mt-1">Los escaneos automáticos aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-orange-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-orange-900">Requisitos Técnicos</CardTitle>
              <CardDescription className="text-orange-700">
                Para implementar integración con cámaras se requiere:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-orange-900">
            <li>• <strong>Hardware:</strong> Cámaras IP compatibles con RTSP/HTTP</li>
            <li>• <strong>Software:</strong> OpenCV o librería similar para procesamiento de video</li>
            <li>• <strong>Backend:</strong> Servicio para decodificar QR desde stream de video</li>
            <li>• <strong>Networking:</strong> Red local con conectividad a las cámaras</li>
            <li>• <strong>Performance:</strong> Procesamiento en tiempo real (30+ FPS)</li>
            <li>• <strong>Alternativa:</strong> WebRTC para streaming directo al navegador</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
