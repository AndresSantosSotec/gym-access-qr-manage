import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaretDown, CaretUp, Lightbulb } from '@phosphor-icons/react';

interface Feature {
  title: string;
  description: string;
  status: 'planned' | 'future';
}

const UPCOMING_FEATURES: Feature[] = [
  {
    title: 'Pagos Avanzados',
    description: 'Sistema completo de facturación con recibos PDF y recordatorios automáticos',
    status: 'planned',
  },
  {
    title: 'Roles y Permisos',
    description: 'Sistema multi-usuario con recepcionistas, entrenadores y administradores',
    status: 'planned',
  },
  {
    title: 'Reportes y Analytics',
    description: 'Dashboard avanzado con gráficos de ingresos, asistencias y retención',
    status: 'planned',
  },
  {
    title: 'Notificaciones Push',
    description: 'Alertas automáticas de vencimientos y promociones a clientes',
    status: 'future',
  },
  {
    title: 'Integración con Cámaras',
    description: 'Escaneo automático de QR con cámaras de seguridad en la entrada',
    status: 'future',
  },
  {
    title: 'App Móvil Nativa',
    description: 'Aplicación iOS/Android para clientes con check-in por GPS',
    status: 'future',
  },
];

export function DevContinueButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <Card className="mb-4 w-96 max-h-[500px] overflow-y-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-accent" weight="duotone" size={24} />
              Funcionalidades Futuras
            </CardTitle>
            <CardDescription>
              Próximas características del sistema (requiere backend PHP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {UPCOMING_FEATURES.map((feature, index) => (
              <div key={index} className="border-l-2 border-primary pl-4 py-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <Badge variant={feature.status === 'planned' ? 'default' : 'secondary'}>
                    {feature.status === 'planned' ? 'Planificado' : 'Futuro'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        onClick={() => setIsExpanded(!isExpanded)}
        className="shadow-lg hover:shadow-xl transition-all"
      >
        {isExpanded ? (
          <>
            <CaretDown className="mr-2" />
            Ocultar Roadmap
          </>
        ) : (
          <>
            <CaretUp className="mr-2" />
            Ver Próximas Features
          </>
        )}
      </Button>
    </div>
  );
}
