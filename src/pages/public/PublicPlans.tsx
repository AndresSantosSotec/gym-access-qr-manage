import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { membershipsService } from '@/services/memberships.service';
import { CheckCircle } from '@phosphor-icons/react';
import { formatCurrency } from '@/utils/date';

export function PublicPlans() {
  const plans = membershipsService.getPublishedPlans();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              Planes de Membresía
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus objetivos y comienza tu transformación hoy
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">
                  No hay planes disponibles en este momento
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="relative hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    {plan.id === 'PLAN-003' && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                          Más Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl">{plan.name}</CardTitle>
                      <CardDescription className="text-base">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="pb-6 border-b">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-primary">
                            {formatCurrency(plan.price)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2">
                          {plan.durationDays} días de acceso completo
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(plan.price / plan.durationDays)} por día
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-4">Incluye:</h4>
                        <ul className="space-y-3">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle
                                size={20}
                                className="text-green-600 flex-shrink-0 mt-0.5"
                                weight="fill"
                              />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6 space-y-3">
                        <Button asChild className="w-full" size="lg">
                          <Link to={`/p/planes/${plan.slug}`}>
                            Ver Detalles
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          <Link to={`/p/suscripcion?plan=${plan.slug}`}>
                            Suscribirme Ahora
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle>¿Tienes dudas?</CardTitle>
                  <CardDescription>
                    Nuestro equipo está listo para ayudarte a elegir el mejor plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg">
                    <Link to="/p/contacto">Contáctanos</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
