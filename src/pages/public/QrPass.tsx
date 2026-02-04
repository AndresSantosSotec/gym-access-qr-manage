import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clientsService } from '@/services/clients.service';
import { formatDate, getDaysRemaining } from '@/utils/date';
import { Barbell, CheckCircle, XCircle, Calendar, Clock } from '@phosphor-icons/react';
import type { Client } from '@/types/models';

export function QrPass() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (clientId) {
      const foundClient = clientsService.getById(clientId);
      setClient(foundClient);
    }
  }, [clientId]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto mb-4 text-destructive" size={64} weight="fill" />
            <h2 className="text-2xl font-bold mb-2">Pase No Encontrado</h2>
            <p className="text-muted-foreground">
              El código QR no es válido o el cliente no existe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qrCode = clientsService.generateQR(client.id);
  const isActive = client.status === 'active' && client.membershipEnd && !getDaysRemaining(client.membershipEnd) || getDaysRemaining(client.membershipEnd!) > 0;
  const daysRemaining = client.membershipEnd ? getDaysRemaining(client.membershipEnd) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Barbell size={28} weight="bold" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GymFlow</h1>
                <p className="text-sm opacity-90">Pase Digital</p>
              </div>
            </div>
            
            {isActive ? (
              <CheckCircle size={32} weight="fill" className="text-green-300" />
            ) : (
              <XCircle size={32} weight="fill" className="text-red-300" />
            )}
          </div>

          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-sm opacity-90 mt-1">ID: {client.id}</p>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-border flex items-center justify-center">
            <QRCodeSVG
              value={qrCode}
              size={200}
              level="H"
              includeMargin
              fgColor="#1a1a1a"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono">{qrCode}</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado de Membresía</span>
              <Badge
                variant={isActive ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {isActive ? 'Vigente' : client.status === 'expired' ? 'Vencida' : 'Inactiva'}
              </Badge>
            </div>

            {client.membershipEnd && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Fecha de Vencimiento</span>
                  </div>
                  <span className="font-semibold">{formatDate(client.membershipEnd)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    <span>Días Restantes</span>
                  </div>
                  <span className={`font-bold ${daysRemaining && daysRemaining < 7 ? 'text-destructive' : 'text-green-600'}`}>
                    {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido') : 'N/A'}
                  </span>
                </div>
              </>
            )}

            {!client.membershipEnd && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No tienes una membresía activa</p>
                <p className="text-xs mt-1">Contacta a recepción para adquirir un plan</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Presenta este código QR en la entrada del gimnasio</p>
            <p>Agrega esta página a favoritos para acceso rápido</p>
          </div>
        </CardContent>

        <div className="bg-muted px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Este es tu pase digital personal • No lo compartas
          </p>
        </div>
      </Card>
    </div>
  );
}
