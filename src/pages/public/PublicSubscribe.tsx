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
import { RecurrenteCheckoutEmbed } from '@/components/RecurrenteCheckoutEmbed';
import { membershipsService } from '@/services/memberships.service';
import { recurrenteService } from '@/services/recurrente.service';
import { SubscribeFormSkeleton } from '@/components/skeletons';
import { CheckCircle, CreditCard, ShieldCheck, ArrowLeft, CircleNotch, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/types/models';

// ─────────────────────────────────────────────────────────────
//  Tipos del flujo
// ─────────────────────────────────────────────────────────────

type CheckoutStep = 'form' | 'processing' | 'checkout' | 'success' | 'error';

export function PublicSubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planSlug = searchParams.get('plan') || '';

  // ── Estado ──────────────────────────────────────────────────
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [step, setStep] = useState<CheckoutStep>('form');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    planSlug: planSlug,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Carga de planes ────────────────────────────────────────
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

  // Sincronizar planSlug con query param
  useEffect(() => {
    if (planSlug && !formData.planSlug) {
      setFormData(prev => ({ ...prev, planSlug }));
    }
  }, [planSlug]);

  const selectedPlan = plans.find(p => p.slug === formData.planSlug);

  // ── Enviar formulario: crear checkout ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.planSlug) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!selectedPlan) {
      toast.error('Selecciona un plan válido');
      return;
    }

    setSubmitting(true);
    setStep('processing');

    try {
      const result = await recurrenteService.createPublicCheckout(
        formData.name,
        formData.email,
        formData.phone,
        selectedPlan.id,
      );

      if (result.checkout_url) {
        setCheckoutUrl(result.checkout_url);
        setStep('checkout');
        toast.success('¡Checkout listo! Completa tu pago a continuación.');
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error: any) {
      console.error('Error al crear checkout:', error);
      const msg = error?.response?.data?.error || error?.message || 'Error al procesar la solicitud';
      setErrorMessage(msg);
      setStep('error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Callbacks del checkout embebido ────────────────────────
  const handleCheckoutSuccess = (paymentData: any) => {
    console.log('[Checkout] Pago exitoso:', paymentData);
    setStep('success');
    toast.success('¡Pago completado exitosamente!');

    // Redirigir después de 3 segundos
    setTimeout(() => {
      navigate(`/p/pago-exitoso?checkout_id=${paymentData?.checkoutId || ''}`);
    }, 3000);
  };

  const handleCheckoutFailure = (error: any) => {
    console.log('[Checkout] Pago fallido:', error);

    // Si es una notificación (validación del formulario del checkout), no cambiar de step
    if (error?.notice) {
      toast.warning(error.notice);
      return;
    }

    setErrorMessage(error?.error || 'El pago no pudo ser procesado');
    toast.error(error?.error || 'Error en el pago');
  };

  const handlePaymentInProgress = (data: any) => {
    console.log('[Checkout] Transferencia en proceso:', data);
    toast.info('Tu transferencia bancaria está en proceso. Puede tomar hasta 24 horas.');
    setTimeout(() => {
      navigate(`/p/pago-exitoso?status=pending&checkout_id=${data?.checkoutId || ''}`);
    }, 3000);
  };

  const handleBack = () => {
    setStep('form');
    setCheckoutUrl(null);
    setErrorMessage('');
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">

            {/* ════════════ PASO 1: Formulario ════════════ */}
            {step === 'form' && (
              <>
                <div className="text-center mb-12">
                  <h1 className="text-5xl font-bold mb-4">Suscríbete Ahora</h1>
                  <p className="text-xl text-muted-foreground">
                    Completa tus datos y realiza el pago de forma segura
                  </p>
                </div>

                {loadingPlans ? (
                  <SubscribeFormSkeleton />
                ) : (
                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Formulario */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard size={24} weight="duotone" />
                          Información para el Pago
                        </CardTitle>
                        <CardDescription>
                          Ingresa tus datos para procesar tu suscripción
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
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="juan@ejemplo.com"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Recibirás confirmación de pago y recibos aquí
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+502 1234-5678"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="plan">Plan *</Label>
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
                                    {plan.name} — Q{plan.price}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={submitting || !formData.name || !formData.email || !formData.planSlug}
                          >
                            {submitting ? (
                              <>
                                <CircleNotch size={20} className="animate-spin mr-2" />
                                Preparando checkout...
                              </>
                            ) : (
                              <>
                                <CreditCard size={20} className="mr-2" />
                                Continuar al Pago
                              </>
                            )}
                          </Button>

                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                            <ShieldCheck size={16} weight="fill" className="text-green-600" />
                            <span>Pago seguro procesado por Recurrente</span>
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Info del plan seleccionado */}
                    <div className="space-y-6">
                      {selectedPlan ? (
                        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
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
                              <span className="text-base font-normal text-muted-foreground">
                                /{selectedPlan.durationDays <= 31 ? 'mes' : selectedPlan.durationDays <= 93 ? 'trimestre' : 'periodo'}
                              </span>
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
                      ) : (
                        <Card>
                          <CardContent className="py-12 text-center text-muted-foreground">
                            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Selecciona un plan para ver los detalles</p>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">1</span>
                            </div>
                            <div>
                              <p className="font-medium">Llena tus datos</p>
                              <p className="text-muted-foreground">Nombre, email y plan</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">2</span>
                            </div>
                            <div>
                              <p className="font-medium">Ingresa tu tarjeta</p>
                              <p className="text-muted-foreground">Pago seguro vía Recurrente</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">3</span>
                            </div>
                            <div>
                              <p className="font-medium">¡Listo! Comienza a entrenar</p>
                              <p className="text-muted-foreground">Tu membresía se activa al instante</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ════════════ PASO 1.5: Procesando ════════════ */}
            {step === 'processing' && (
              <div className="text-center py-20">
                <CircleNotch size={64} className="animate-spin mx-auto mb-6 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Preparando tu checkout...</h2>
                <p className="text-muted-foreground">
                  Estamos creando tu sesión de pago segura. Un momento por favor.
                </p>
              </div>
            )}

            {/* ════════════ PASO 2: Checkout Embebido ════════════ */}
            {step === 'checkout' && checkoutUrl && (
              <>
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-4"
                  >
                    <ArrowLeft size={20} className="mr-2" />
                    Volver al formulario
                  </Button>

                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold mb-2">Completa tu Pago</h2>
                    {selectedPlan && (
                      <p className="text-muted-foreground">
                        Plan: <span className="font-semibold">{selectedPlan.name}</span> —{' '}
                        <span className="font-semibold text-primary">Q{selectedPlan.price}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="max-w-2xl mx-auto">
                  <Card className="overflow-hidden">
                    <RecurrenteCheckoutEmbed
                      checkoutUrl={checkoutUrl}
                      onSuccess={handleCheckoutSuccess}
                      onFailure={handleCheckoutFailure}
                      onPaymentInProgress={handlePaymentInProgress}
                      height="850px"
                    />
                  </Card>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                    <ShieldCheck size={16} weight="fill" className="text-green-600" />
                    <span>Transacción cifrada y segura • Procesado por Recurrente</span>
                  </div>
                </div>
              </>
            )}

            {/* ════════════ PASO 3: Éxito ════════════ */}
            {step === 'success' && (
              <div className="text-center py-20 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} className="text-green-600" weight="fill" />
                </div>
                <h2 className="text-3xl font-bold mb-3">¡Pago Exitoso!</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Tu membresía ha sido activada. Recibirás un correo de confirmación en{' '}
                  <span className="font-medium">{formData.email}</span>.
                </p>
                {selectedPlan && (
                  <Card className="mb-6">
                    <CardContent className="py-4">
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-2xl font-bold text-primary">Q{selectedPlan.price}</p>
                    </CardContent>
                  </Card>
                )}
                <Button onClick={() => navigate('/p')} size="lg">
                  Volver al Inicio
                </Button>
              </div>
            )}

            {/* ════════════ Error ════════════ */}
            {step === 'error' && (
              <div className="text-center py-20 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Warning size={48} className="text-red-600" weight="fill" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Error en el proceso</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {errorMessage || 'Hubo un problema al procesar tu solicitud. Intenta de nuevo.'}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/p/planes')}>
                    Ver Planes
                  </Button>
                  <Button onClick={handleBack}>
                    Intentar de Nuevo
                  </Button>
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
