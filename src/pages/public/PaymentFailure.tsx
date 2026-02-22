import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { Warning, ArrowCounterClockwise, House } from '@phosphor-icons/react';

export function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="py-12 space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Warning size={48} className="text-red-600" weight="fill" />
            </div>
            <h1 className="text-3xl font-bold">Pago No Procesado</h1>
            <p className="text-muted-foreground">
              Tu pago no pudo ser completado. Esto puede deberse a fondos insuficientes,
              datos incorrectos de la tarjeta o una restricción del banco emisor.
            </p>

            <div className="pt-4 space-y-3">
              <Button onClick={() => navigate('/p/suscribirse')} size="lg" className="w-full">
                <ArrowCounterClockwise size={20} className="mr-2" />
                Intentar de Nuevo
              </Button>
              <Button variant="outline" onClick={() => navigate('/p')} className="w-full">
                <House size={20} className="mr-2" />
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
