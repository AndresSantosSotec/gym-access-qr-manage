import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { CheckCircle, HourglassMedium, House } from '@phosphor-icons/react';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const isPending = status === 'pending';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="py-12 space-y-6">
            {isPending ? (
              <>
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <HourglassMedium size={48} className="text-yellow-600" weight="fill" />
                </div>
                <h1 className="text-3xl font-bold">Pago en Proceso</h1>
                <p className="text-muted-foreground">
                  Tu transferencia bancaria está siendo procesada. Esto puede tomar hasta 24 horas.
                  Recibirás una notificación por correo cuando se confirme.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={48} className="text-green-600" weight="fill" />
                </div>
                <h1 className="text-3xl font-bold">¡Pago Exitoso!</h1>
                <p className="text-muted-foreground">
                  Tu membresía ha sido activada exitosamente. Recibirás un correo de confirmación
                  con los detalles de tu suscripción.
                </p>
              </>
            )}

            <div className="pt-4 space-y-3">
              <Button onClick={() => navigate('/p')} size="lg" className="w-full">
                <House size={20} className="mr-2" />
                Volver al Inicio
              </Button>
              <Button variant="outline" onClick={() => navigate('/p/planes')} className="w-full">
                Ver Planes
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
