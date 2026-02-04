import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { accessService } from '@/services/access.service';
import { formatDate, formatDateTime, formatCurrency, getDaysRemaining } from '@/utils/date';
import { toast } from 'sonner';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  User,
  Phone,
  EnvelopeSimple,
  IdentificationCard,
  Calendar,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { Client } from '@/types/models';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const plans = membershipsService.getPlans();
  const payments = client ? membershipsService.getPaymentsByClient(client.id) : [];
  const accessLogs = client ? accessService.getLogsByClient(client.id) : [];

  useEffect(() => {
    if (id) {
      const foundClient = clientsService.getById(id);
      if (!foundClient) {
        toast.error('Cliente no encontrado');
        navigate('/admin/clients');
        return;
      }
      setClient(foundClient);
    }
  }, [id, navigate]);

  const handleGenerateQR = () => {
    if (!client) return;
    const qrUrl = `${window.location.origin}/qr/${client.id}`;
    window.open(qrUrl, '_blank');
    toast.success('QR generado - Se abrió en nueva pestaña');
  };

  const handleAssignMembership = (e: React.FormEvent) => {
    e.preventDefault();

    if (!client || !selectedPlanId) {
      toast.error('Selecciona un plan');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    const payment = membershipsService.assignMembership(
      client.id,
      selectedPlanId,
      paymentMethod,
      amount,
      paymentReference
    );

    if (payment) {
      const updatedClient = clientsService.getById(client.id);
      setClient(updatedClient);
      setIsMembershipDialogOpen(false);
      setSelectedPlanId('');
      setPaymentAmount('');
      setPaymentReference('');
      toast.success('Membresía asignada exitosamente');
    }
  };

  if (!client) {
    return null;
  }

  const daysRemaining = client.membershipEnd ? getDaysRemaining(client.membershipEnd) : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground mt-1">ID: {client.id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateQR} variant="outline">
            <QrCode className="mr-2" size={20} />
            Ver QR
          </Button>
          <Button onClick={() => setIsMembershipDialogOpen(true)}>
            <CreditCard className="mr-2" size={20} weight="bold" />
            Asignar Membresía
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={client.status === 'active' ? 'default' : 'destructive'}
              className="text-base px-4 py-1"
            >
              {client.status === 'active' ? 'Activo' : client.status === 'expired' ? 'Vencido' : 'Inactivo'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha Fin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {client.membershipEnd ? formatDate(client.membershipEnd) : 'Sin membresía'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Días Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold ${daysRemaining && daysRemaining < 7 ? 'text-destructive' : ''}`}>
              {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido') : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="access">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="font-semibold">{client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-semibold">{client.phone}</p>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <EnvelopeSimple className="text-muted-foreground" size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold">{client.email}</p>
                    </div>
                  </div>
                )}

                {client.dpi && (
                  <div className="flex items-center gap-3">
                    <IdentificationCard className="text-muted-foreground" size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground">DPI</p>
                      <p className="font-semibold">{client.dpi}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Miembro desde</p>
                    <p className="font-semibold">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
              </div>

              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Notas</p>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const plan = membershipsService.getPlanById(payment.planId);
                    return (
                      <div key={payment.id} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{plan?.name || 'Plan desconocido'}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDateTime(payment.createdAt)}
                            </p>
                            <Badge variant="outline" className="mt-2">
                              {payment.method === 'cash' ? 'Efectivo' : payment.method === 'card' ? 'Tarjeta' : 'Transferencia'}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        </div>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay check-ins registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.result === 'ALLOWED' ? (
                          <CheckCircle className="text-green-600" size={24} weight="fill" />
                        ) : (
                          <XCircle className="text-red-600" size={24} weight="fill" />
                        )}
                        <div>
                          <p className="font-semibold">{formatDateTime(log.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant={log.result === 'ALLOWED' ? 'default' : 'destructive'}>
                        {log.result === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Membresía</DialogTitle>
            <DialogDescription>
              Selecciona un plan y registra el pago
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignMembership} className="space-y-4">
            <div className="space-y-2">
              <Label>Plan de Membresía</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)} ({plan.durationDays} días)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto Pagado</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (Opcional)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Número de transacción o recibo"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMembershipDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Asignar y Pagar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
