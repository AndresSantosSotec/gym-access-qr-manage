import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { membershipsService } from '@/services/memberships.service';
import { formatCurrency } from '@/utils/date';
import { CheckCircle } from '@phosphor-icons/react';

export function Memberships() {
  const plans = membershipsService.getPlans();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planes de Membresía</h1>
        <p className="text-muted-foreground mt-1">
          Catálogo de planes disponibles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            {plan.id === 'PLAN-003' && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-accent text-accent-foreground">Más Popular</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-muted-foreground">/ {plan.durationDays} días</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(plan.price / plan.durationDays)} por día
                </p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} weight="fill" />
                  <span className="text-sm">Acceso completo al gimnasio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} weight="fill" />
                  <span className="text-sm">Todas las clases grupales</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} weight="fill" />
                  <span className="text-sm">Vestuarios y duchas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} weight="fill" />
                  <span className="text-sm">WiFi gratuito</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle>¿Cómo asignar una membresía?</CardTitle>
          <CardDescription>Guía rápida para gestionar membresías</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Ve a la sección de <strong>Clientes</strong></p>
          <p>2. Selecciona un cliente y haz clic en <strong>Ver</strong></p>
          <p>3. Haz clic en el botón <strong>Asignar Membresía</strong></p>
          <p>4. Selecciona el plan, método de pago y monto</p>
          <p>5. La membresía se activará automáticamente</p>
        </CardContent>
      </Card>
    </div>
  );
}
