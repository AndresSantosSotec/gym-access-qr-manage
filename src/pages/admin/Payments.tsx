import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paymentsService } from '@/services/payments.service';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { formatCurrency, formatDate } from '@/utils/date';
import { Plus, CreditCard, Money, Bank, Lightning, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

export function Payments() {
  const [payments, setPayments] = useState(paymentsService.getAllPayments());
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    planId: '',
    amount: '',
    method: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER',
    reference: '',
  });

  const clients = clientsService.getAll();
  const plans = membershipsService.getPlans();

  const handleCreateManualPayment = () => {
    if (!formData.clientId || !formData.planId || !formData.amount) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    paymentsService.createManualPayment({
      clientId: formData.clientId,
      planId: formData.planId,
      amount: parseFloat(formData.amount),
      method: formData.method,
      reference: formData.reference || undefined,
      status: 'PAID',
    });

    setPayments(paymentsService.getAllPayments());
    setIsManualDialogOpen(false);
    setFormData({
      clientId: '',
      planId: '',
      amount: '',
      method: 'CASH',
      reference: '',
    });
    toast.success('Pago registrado exitosamente');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Money size={18} weight="fill" />;
      case 'card': return <CreditCard size={18} />;
      case 'transfer': return <Bank size={18} />;
      case 'stripe': return <Lightning size={18} weight="fill" />;
      default: return <Money size={18} />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      stripe: 'Stripe',
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
    } as const;

    const labels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      failed: 'Fallido',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const totalRevenue = paymentsService.getTotalRevenue();
  const paidPayments = payments.filter(p => p.status === 'PAID');
  const pendingPayments = payments.filter(p => p.status === 'PENDING');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de pagos y transacciones
          </p>
        </div>
        <Button onClick={() => setIsManualDialogOpen(true)} className="gap-2">
          <Plus size={20} />
          Registrar Pago Manual
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Totales</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {formatCurrency(totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pagos Completados</CardDescription>
            <CardTitle className="text-3xl">{paidPayments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {pendingPayments.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Este Mes</CardDescription>
            <CardTitle className="text-3xl">
              {payments.filter(p => {
                const date = new Date(p.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && 
                       date.getFullYear() === now.getFullYear();
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-blue-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-blue-900">Integración Stripe (Demo)</CardTitle>
              <CardDescription className="text-blue-700">
                Esta es una simulación de Stripe. Para implementación real se requiere:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Backend PHP/Node para crear sesiones de checkout</li>
                  <li>Webhook endpoint para recibir confirmaciones</li>
                  <li>Claves API de Stripe (public y secret key)</li>
                </ul>
                En producción, los pagos se procesan en /p/pago-demo?session=XXX
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Todos los pagos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No hay pagos registrados
                  </TableCell>
                </TableRow>
              ) : (
                payments.slice().reverse().map((payment) => {
                  const client = payment.clientId ? clientsService.getById(payment.clientId) : null;
                  const plan = membershipsService.getPlanById(payment.planId);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell className="font-medium">
                        {client?.name || 'Lead'}
                      </TableCell>
                      <TableCell>{plan?.name || 'N/A'}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          {getMethodLabel(payment.method)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.reference ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {payment.reference}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago Manual</DialogTitle>
            <DialogDescription>
              Registra un pago recibido fuera del sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select value={formData.planId} onValueChange={(v) => setFormData({ ...formData, planId: v })}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto (Q) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="250"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago *</Label>
              <Select value={formData.method} onValueChange={(v: any) => setFormData({ ...formData, method: v })}>
                <SelectTrigger id="method">
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
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Nº de transacción, recibo, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateManualPayment}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
