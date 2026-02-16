import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { membershipsService } from '@/services/memberships.service';
import { leadsService } from '@/services/leads.service';
import { SubscribeFormSkeleton } from '@/components/skeletons';
import { CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/types/models';

export function PublicSubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planSlug = searchParams.get('plan') || '';

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await membershipsService.getPublishedPlans();
        setPlans(data);
      } catch (error) {
        console.error('Error al cargar planes:', error);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const selectedPlan = plans.find(p => p.slug === planSlug);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    planSlug: planSlug,
    preferredPaymentMethod: 'cash' as 'cash' | 'card',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.planSlug) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const lead = leadsService.createLead({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      planSlug: formData.planSlug,
      preferredPaymentMethod: formData.preferredPaymentMethod,
    });

    toast.success('¡Solicitud enviada! Te contactaremos pronto.');
    
    setTimeout(() => {
      navigate('/p');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">Suscríbete Ahora</h1>
              <p className="text-xl text-muted-foreground">
                Completa el formulario y nos pondremos en contacto contigo
              </p>
            </div>

            {loadingPlans ? (
              <SubscribeFormSkeleton />
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                    <CardDescription>
                      Completa tus datos para que podamos contactarte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+502 1234-5678"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="juan@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan de Interés *</Label>
                      <Select
                        value={formData.planSlug}
                        onValueChange={(v) => setFormData({ ...formData, planSlug: v })}
                        required
                      >
                        <SelectTrigger id="plan">
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.slug}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment">Método de Pago Preferido *</Label>
                      <Select
                        value={formData.preferredPaymentMethod}
                        onValueChange={(v: any) => setFormData({ ...formData, preferredPaymentMethod: v })}
                      >
                        <SelectTrigger id="payment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Enviar Solicitud
                    </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {selectedPlan && (
                    <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
                      <CardHeader>
                        <CardTitle>Plan Seleccionado</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold">{selectedPlan.name}</h3>
                          <p className="text-muted-foreground mt-1">{selectedPlan.description}</p>
                        </div>
                        <div className="text-4xl font-bold text-primary">
                          Q{selectedPlan.price}
                        </div>
                        <ul className="space-y-2">
                          {selectedPlan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle size={18} className="text-green-600" weight="fill" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>¿Qué sigue?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Recibimos tu solicitud</p>
                          <p className="text-muted-foreground">Inmediatamente</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Te contactamos</p>
                          <p className="text-muted-foreground">En menos de 24 horas</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Coordinas el pago</p>
                          <p className="text-muted-foreground">Con nuestro equipo</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-primary">4</span>
                        </div>
                        <div>
                          <p className="font-medium">¡Comienza a entrenar!</p>
                          <p className="text-muted-foreground">Mismo día si lo deseas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
