import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { stripeService } from '@/services/stripe.service';
import { CheckCircle, Warning, CreditCard } from '@phosphor-icons/react';
import type { StripeSession } from '@/types/models';

export function PublicStripeDemoCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session');
  const [session, setSession] = useState<StripeSession | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const foundSession = stripeService.getSessionById(sessionId);
      setSession(foundSession);
    }
  }, [sessionId]);

  const handleSimulatePayment = async () => {
    if (!session) return;

    setProcessing(true);

    setTimeout(() => {
      const payment = stripeService.simulateWebhookSuccess(session.sessionId);
      if (payment) {
        setSuccess(true);
        setTimeout(() => {
          if (session.clientId) {
            navigate(`/qr/${session.clientId}`);
          } else {
            navigate('/p');
          }
        }, 3000);
      }
      setProcessing(false);
    }, 2000);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sesión no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La sesión de pago no existe o ha expirado.
            </p>
            <Button asChild>
              <a href="/p">Volver al Inicio</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle size={80} className="mx-auto text-green-600 mb-6" weight="fill" />
            <h1 className="text-3xl font-bold mb-2">¡Pago Exitoso!</h1>
            <p className="text-muted-foreground mb-6">
              Tu pago ha sido procesado correctamente. Serás redirigido...
            </p>
            <div className="animate-pulse text-sm text-muted-foreground">
              Redirigiendo...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-start gap-3 mb-4">
            <Warning size={24} className="text-yellow-600 mt-1" weight="fill" />
            <div>
              <Badge variant="outline" className="mb-2">DEMO - Simulación</Badge>
              <CardTitle>Checkout de Stripe (Demo)</CardTitle>
              <CardDescription>
                Esta es una simulación. NO se procesará ningún pago real.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">Importante</h3>
            <p className="text-sm text-blue-800">
              Este es un checkout simulado para demostración. En producción, aquí se integraría
              Stripe Checkout real con claves API y procesamiento de pagos verificado.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Monto a Pagar</span>
              <span className="font-bold text-2xl text-primary">
                Q{session.amount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Sesión ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {session.sessionId}
              </code>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                {session.status === 'completed' ? 'Completado' : 'Pendiente'}
              </Badge>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard size={24} />
                Datos de Tarjeta (Demo)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número:</span>
                <span className="font-mono">4242 4242 4242 4242</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimiento:</span>
                <span className="font-mono">12/34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CVC:</span>
                <span className="font-mono">123</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                En Stripe real, estos datos se procesan de forma segura (PCI-DSS compliant)
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSimulatePayment}
              disabled={processing || session.status === 'completed'}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Simular Pago Exitoso
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a href="/p">Cancelar</a>
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <h4 className="font-bold text-yellow-900 mb-2">Implementación Real con Stripe:</h4>
            <ul className="space-y-1 text-yellow-800">
              <li>1. Backend PHP/Node crea sesión con Stripe API</li>
              <li>2. Usuario redirigido a Stripe Checkout hosted</li>
              <li>3. Webhook recibe confirmación de pago</li>
              <li>4. Backend actualiza estado de membresía</li>
              <li>5. Usuario ve su QR de acceso</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
