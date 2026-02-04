import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { membershipsService } from '@/services/memberships.service';
import { CheckCircle, ArrowLeft } from '@phosphor-icons/react';
import { formatCurrency } from '@/utils/date';

export function PublicPlanDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const plan = slug ? membershipsService.getPlanBySlug(slug) : null;

  if (!plan || !plan.published) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Plan no encontrado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                El plan que buscas no está disponible o no existe.
              </p>
              <Button asChild>
                <Link to="/p/planes">Ver Todos los Planes</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/p/planes')}
              className="gap-2 mb-6"
            >
              <ArrowLeft size={18} />
              Volver a Planes
            </Button>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h1 className="text-5xl font-bold mb-4">{plan.name}</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  {plan.description}
                </p>

                <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
                  <CardContent className="p-8">
                    <div className="mb-4">
                      <div className="text-6xl font-bold text-primary">
                        {formatCurrency(plan.price)}
                      </div>
                      <p className="text-lg text-muted-foreground mt-2">
                        Acceso por {plan.durationDays} días
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Solo {formatCurrency(plan.price / plan.durationDays)} por día
                      </p>
                    </div>

                    <div className="space-y-3 pt-6">
                      <Button asChild className="w-full" size="lg">
                        <Link to={`/p/suscripcion?plan=${plan.slug}`}>
                          Suscribirme Ahora
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full" size="lg">
                        <Link to="/p/contacto">Consultar por WhatsApp</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Beneficios Incluidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle
                            size={24}
                            className="text-green-600 flex-shrink-0"
                            weight="fill"
                          />
                          <span className="text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Detalles del Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">{plan.durationDays} días</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">Precio Total</span>
                      <span className="font-bold text-primary text-lg">
                        {formatCurrency(plan.price)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">Costo Diario</span>
                      <span className="font-medium">
                        {formatCurrency(plan.price / plan.durationDays)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-muted-foreground">Renovación</span>
                      <span className="font-medium">Manual</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
