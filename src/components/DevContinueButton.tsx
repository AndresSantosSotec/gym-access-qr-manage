import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaretDown, CaretUp, Lightbulb, CheckCircle } from '@phosphor-icons/react';

interface Feature {
  title: string;
  description: string;
  status: 'implemented' | 'planned' | 'future';
}

const UPCOMING_FEATURES: Feature[] = [
  {
    title: 'CRUD de Membresías con Publicación Web',
    description: 'Gestión completa de planes publicables en web pública',
    status: 'implemented',
  },
  {
    title: 'Sitio Web Público Personalizable',
    description: 'Home, planes, blog, y contacto con configuración desde admin',
    status: 'implemented',
  },
  {
    title: 'Sistema de Leads desde Web',
    description: 'Formulario público de suscripción y gestión de leads en admin',
    status: 'implemented',
  },
  {
    title: 'Blog Administrativo',
    description: 'CRUD de posts con markdown y publicación en web pública',
    status: 'implemented',
  },
  {
    title: 'Módulo de Pagos',
    description: 'Registro manual de pagos y estructura para Stripe',
    status: 'implemented',
  },
  {
    title: 'Integración Real con Stripe',
    description: 'Backend PHP/Node para crear sesiones y recibir webhooks',
    status: 'planned',
  },
  {
    title: 'Roles y Permisos Funcionales',
    description: 'Sistema multi-usuario con control granular por módulo',
    status: 'planned',
  },
  {
    title: 'Reportes Avanzados con Recharts',
    description: 'Gráficos interactivos de ingresos, asistencia y KPIs',
    status: 'planned',
  },
  {
    title: 'Notificaciones Push Reales',
    description: 'Email SMTP, WhatsApp Business API, y FCM para mobile',
    status: 'future',
  },
  {
    title: 'Integración con Cámaras',
    description: 'OpenCV para escaneo automático de QR desde cámaras IP',
    status: 'future',
  },
  {
    title: 'App Móvil Nativa',
    description: 'React Native con check-in por GPS y notificaciones push',
    status: 'future',
  },
  {
    title: 'Marketplace de Productos',
    description: 'Venta de suplementos, ropa y accesorios dentro del sistema',
    status: 'future',
  },
];

export function DevContinueButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  const implementedCount = UPCOMING_FEATURES.filter(f => f.status === 'implemented').length;
  const plannedCount = UPCOMING_FEATURES.filter(f => f.status === 'planned').length;
  const futureCount = UPCOMING_FEATURES.filter(f => f.status === 'future').length;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <Card className="mb-4 w-96 max-h-[600px] overflow-y-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-accent" weight="duotone" size={24} />
              Roadmap del Sistema
            </CardTitle>
            <CardDescription>
              Estado de funcionalidades: {implementedCount} implementadas, {plannedCount} planificadas, {futureCount} futuras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {UPCOMING_FEATURES.map((feature, index) => (
              <div 
                key={index} 
                className={`border-l-2 pl-4 py-2 ${
                  feature.status === 'implemented' 
                    ? 'border-green-500 bg-green-50/50' 
                    : feature.status === 'planned'
                    ? 'border-blue-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {feature.status === 'implemented' && (
                      <CheckCircle size={16} className="text-green-600" weight="fill" />
                    )}
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                  </div>
                  <Badge 
                    variant={
                      feature.status === 'implemented' 
                        ? 'default' 
                        : feature.status === 'planned' 
                        ? 'default' 
                        : 'secondary'
                    }
                    className={
                      feature.status === 'implemented'
                        ? 'bg-green-600'
                        : ''
                    }
                  >
                    {feature.status === 'implemented' 
                      ? '✓ Hecho' 
                      : feature.status === 'planned' 
                      ? 'Planificado' 
                      : 'Futuro'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
            
            <div className="pt-4 border-t mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Las funciones "Planificadas" tienen UI/placeholder. 
                Las "Futuras" requieren backend completo y servicios externos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        onClick={() => setIsExpanded(!isExpanded)}
        className="shadow-lg hover:shadow-xl transition-all gap-2"
      >
        {isExpanded ? (
          <>
            <CaretDown />
            Ocultar Roadmap
          </>
        ) : (
          <>
            <CaretUp />
            Ver Roadmap ({implementedCount}/{UPCOMING_FEATURES.length})
          </>
        )}
      </Button>
    </div>
  );
}
