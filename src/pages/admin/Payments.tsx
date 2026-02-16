import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api.service';
import { membershipsService } from '@/services/memberships.service';
import { formatCurrency, formatDate } from '@/utils/date';
import {
  CreditCard,
  Money,
  Bank,
  Lightning,
  CalendarBlank,
  Warning,
  CheckCircle,
  ArrowsClockwise,
  CurrencyCircleDollar,
  Receipt,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PaymentInstallment } from '@/types/models';

// ─── Helpers ───
function fmtDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    partial: 'Parcial',
    paid: 'Pagado',
    overdue: 'Vencido',
    completed: 'Completado',
    failed: 'Fallido',
  };
  return map[s?.toLowerCase()] || s;
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s?.toLowerCase()) {
    case 'paid':
    case 'completed':
      return 'default';
    case 'partial':
      return 'secondary';
    case 'overdue':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function methodIcon(m: string) {
  switch (m?.toLowerCase()) {
    case 'cash':
      return <Money size={16} weight="fill" />;
    case 'card':
      return <CreditCard size={16} />;
    case 'transfer':
      return <Bank size={16} />;
    case 'stripe':
      return <Lightning size={16} weight="fill" />;
    default:
      return <Money size={16} />;
  }
}

function methodLabel(m: string) {
  const map: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    stripe: 'Stripe',
  };
  return map[m?.toLowerCase()] || m;
}

// ═════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════
export function Payments() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagos & Cuotas</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de pagos, cuotas de membresía y plan de financiamiento
        </p>
      </div>

      <Tabs defaultValue="installments" className="w-full">
        <TabsList className="w-full sm:w-auto gap-1 p-1.5 bg-muted/80">
          <TabsTrigger value="installments" className="gap-1.5">
            <CalendarBlank size={16} weight="fill" /> Cuotas Pendientes
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <Receipt size={16} weight="fill" /> Historial de Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installments" className="mt-4">
          <InstallmentsTab />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═════════════════════════════════════════════════
// TAB 1: INSTALLMENTS (CUOTAS)
// ═════════════════════════════════════════════════
function InstallmentsTab() {
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  // Pay dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference: '',
    notes: '',
  });
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [installmentsRes, summaryRes] = await Promise.all([
        membershipsService.getInstallments(),
        membershipsService.getInstallmentSummary(),
      ]);
      setInstallments(installmentsRes);
      setSummary(summaryRes);
    } catch (e) {
      toast.error('Error al cargar cuotas');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = installments.filter((i) => {
    if (filter === 'pending') return i.status === 'pending' || i.status === 'partial';
    if (filter === 'overdue') return i.status === 'overdue' || (i.status !== 'paid' && new Date(i.due_date) < new Date());
    if (filter === 'paid') return i.status === 'paid';
    return true;
  });

  const openPayDialog = (inst: PaymentInstallment) => {
    setSelectedInstallment(inst);
    const remaining = inst.amount - inst.amount_paid;
    setPayForm({
      amount: remaining.toFixed(2),
      payment_method: 'cash',
      reference: '',
      notes: '',
    });
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!selectedInstallment || !payForm.amount) return;
    setIsPaying(true);
    try {
      const result = await membershipsService.payInstallment(
        selectedInstallment.id,
        parseFloat(payForm.amount),
        payForm.payment_method,
        payForm.reference || undefined,
        payForm.notes || undefined,
      );
      toast.success(result.message || 'Pago registrado exitosamente');
      setPayDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al procesar pago');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <ArrowsClockwise className="animate-spin text-primary" size={32} />
        <p className="text-muted-foreground text-sm">Cargando cuotas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-red-600 font-medium text-xs">Cuotas Vencidas</CardDescription>
              <CardTitle className="text-2xl text-red-700">{summary.overdue_count}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-semibold text-red-600">{formatCurrency(summary.overdue_amount)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-medium text-xs">Próximas 7 Días</CardDescription>
              <CardTitle className="text-2xl text-amber-700">{summary.due_soon_count}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-semibold text-amber-600">{formatCurrency(summary.due_soon_amount)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-medium text-xs">Cuotas Pendientes</CardDescription>
              <CardTitle className="text-2xl text-blue-700">{summary.total_pending_count}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(summary.total_pending_amount)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Cuotas de Membresía</CardTitle>
              <CardDescription>Cuotas de planes de pago activos</CardDescription>
            </div>
            <div className="flex gap-1">
              {(['all', 'pending', 'overdue', 'paid'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'text-xs',
                    f === 'overdue' && filter === f && 'bg-red-600 hover:bg-red-700',
                    f === 'paid' && filter === f && 'bg-green-600 hover:bg-green-700',
                  )}
                >
                  {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'overdue' ? 'Vencidas' : 'Pagadas'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cuota</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-center">Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inst) => {
                  const remaining = inst.amount - inst.amount_paid;
                  const isOverdue = inst.status !== 'paid' && new Date(inst.due_date) < new Date();
                  return (
                    <TableRow
                      key={inst.id}
                      className={cn(isOverdue && 'bg-red-50/50')}
                    >
                      <TableCell className="font-mono font-bold text-sm">
                        #{inst.installment_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {inst.client
                          ? `${inst.client.first_name} ${inst.client.last_name}`
                          : `ID: ${inst.client_id}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inst.membership?.plan?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          'text-sm font-medium',
                          isOverdue && 'text-red-600',
                        )}>
                          {fmtDate(inst.due_date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inst.amount)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {inst.amount_paid > 0 ? formatCurrency(inst.amount_paid) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {remaining > 0 ? formatCurrency(remaining) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant(isOverdue ? 'overdue' : inst.status)}>
                          {statusLabel(isOverdue ? 'overdue' : inst.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {inst.status !== 'paid' && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700"
                            onClick={() => openPayDialog(inst)}
                          >
                            <CurrencyCircleDollar size={14} weight="fill" />
                            Pagar
                          </Button>
                        )}
                        {inst.status === 'paid' && (
                          <CheckCircle size={20} weight="fill" className="text-green-600 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No se encontraron cuotas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Cuota</DialogTitle>
            <DialogDescription>
              {selectedInstallment && (
                <>
                  Cuota #{selectedInstallment.installment_number} —{' '}
                  Vence: {fmtDate(selectedInstallment.due_date)}
                  <br />
                  Saldo pendiente:{' '}
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedInstallment.amount - selectedInstallment.amount_paid)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto a Pagar (Q) *</Label>
              <Input
                type="number"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Puedes hacer un abono parcial o pagar la cuota completa
              </p>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Select
                value={payForm.payment_method}
                onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Money size={16} weight="fill" /> Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} /> Tarjeta
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center gap-2">
                      <Bank size={16} /> Transferencia
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input
                value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                placeholder="Nº de recibo, boleta, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Observaciones del pago"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handlePay}
              disabled={isPaying || !payForm.amount}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isPaying ? (
                <ArrowsClockwise size={16} className="animate-spin" />
              ) : (
                <CurrencyCircleDollar size={16} weight="fill" />
              )}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════
// TAB 2: PAYMENTS HISTORY
// ═════════════════════════════════════════════════
function PaymentsHistoryTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/payments', { params: { per_page: 100 } });
      setPayments(response.data.data || []);
    } catch (e) {
      toast.error('Error al cargar pagos');
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const completedCount = payments.filter((p) => p.status === 'completed').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const thisMonth = payments.filter((p) => {
    const date = new Date(p.created_at || p.paid_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <ArrowsClockwise className="animate-spin text-primary" size={32} />
        <p className="text-muted-foreground text-sm">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Totales</CardDescription>
            <CardTitle className="text-3xl text-green-600">{formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pagos Completados</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Este Mes</CardDescription>
            <CardTitle className="text-3xl">{thisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Todos los pagos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">#{p.id}</TableCell>
                    <TableCell className="font-medium">
                      {p.client
                        ? `${p.client.first_name} ${p.client.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(parseFloat(p.amount))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {methodIcon(p.payment_method)}
                        <span className="text-sm">{methodLabel(p.payment_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariant(p.status)}>
                        {statusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.transaction_id ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {p.transaction_id}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {p.notes || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {fmtDate(p.paid_at || p.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
