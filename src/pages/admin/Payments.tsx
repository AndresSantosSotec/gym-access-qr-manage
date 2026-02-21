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
import { receiptsService } from '@/services/receipts.service';
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
  Download,
  MagnifyingGlass,
  Printer,
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

  // Modal client state
  const [selectedClientData, setSelectedClientData] = useState<any>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

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

      // We must reload data and also update the selected client's installments
      await loadData();

      // A hacky way to keep the modal open with updated data:
      // The loadData updates `installments`, but we need to update `selectedClientData`
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al procesar pago');
    } finally {
      setIsPaying(false);
    }
  };

  // Whenever installments are reloaded, if the modal is open, update selectedClientData
  useEffect(() => {
    if (clientModalOpen && selectedClientData) {
      const updatedClientInstallments = installments.filter(
        (i) => i.client_id === selectedClientData.client.id
      );
      setSelectedClientData((prev: any) => ({
        ...prev,
        installments: updatedClientInstallments
      }));
    }
  }, [installments]);

  // GROUP INSTALLMENTS BY CLIENT
  const clientsMap = new Map();
  installments.forEach(inst => {
    if (!inst.client) return;
    if (!clientsMap.has(inst.client_id)) {
      clientsMap.set(inst.client_id, {
        client: inst.client,
        installments: [],
        totalPending: 0,
        overdueCount: 0
      });
    }
    const c = clientsMap.get(inst.client_id);
    c.installments.push(inst);
    const remaining = inst.amount - inst.amount_paid;
    if (remaining > 0) c.totalPending += remaining;
    if (inst.status !== 'paid' && new Date(inst.due_date) < new Date()) c.overdueCount++;
  });
  const clientsWithInstallments = Array.from(clientsMap.values());

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
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Cuotas Totales</TableHead>
                  <TableHead className="text-center">Cuotas Vencidas</TableHead>
                  <TableHead className="text-right">Saldo Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithInstallments.map((c: any) => {
                  const hasOverdue = c.overdueCount > 0;
                  return (
                    <TableRow key={c.client.id}>
                      <TableCell className="font-medium">
                        {c.client.first_name} {c.client.last_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.installments.length}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.overdueCount > 0 ? (
                          <Badge variant="destructive">{c.overdueCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600">
                        {c.totalPending > 0 ? formatCurrency(c.totalPending) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.totalPending === 0 ? (
                          <Badge variant="default" className="bg-green-600">Al Día</Badge>
                        ) : hasOverdue ? (
                          <Badge variant="destructive">Mora</Badge>
                        ) : (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClientData(c);
                            setClientModalOpen(true);
                          }}
                        >
                          Ver Cuotas
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {clientsWithInstallments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No hay clientes con planes de cuotas activos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal with Installments for Selected Client */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cuotas del Cliente</DialogTitle>
            <DialogDescription>
              {selectedClientData && (
                <>Plan de financiamiento para {selectedClientData.client.first_name} {selectedClientData.client.last_name}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedClientData && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Num</TableHead>
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
                  {selectedClientData.installments
                    // Optional: filter logic could be applied here too if you want the same tabs
                    .map((inst: any) => {
                      const remaining = inst.amount - inst.amount_paid;
                      const isOverdue = inst.status !== 'paid' && new Date(inst.due_date) < new Date();
                      return (
                        <TableRow key={inst.id} className={cn(isOverdue && 'bg-red-50/50')}>
                          <TableCell className="font-mono font-bold text-sm">#{inst.installment_number}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{inst.membership?.plan?.name || '-'}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn('text-sm font-medium', isOverdue && 'text-red-600')}>
                              {fmtDate(inst.due_date)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(inst.amount)}</TableCell>
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
                              <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => openPayDialog(inst)}>
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
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    client_id: '',
    amount: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients', { params: { per_page: 100 } });
      setClients(response.data.data || []);
    } catch (e) {
      console.error('Error al cargar clientes', e);
    }
  };

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

  const handleCreatePayment = async () => {
    if (!newPaymentForm.client_id || !newPaymentForm.amount) {
      toast.error('Por favor completa cliente y monto');
      return;
    }

    setIsCreatingPayment(true);
    try {
      const paymentResponse = await api.post('/payments', {
        client_id: newPaymentForm.client_id,
        amount: parseFloat(newPaymentForm.amount),
        payment_method: newPaymentForm.payment_method,
        transaction_id: newPaymentForm.transaction_id || undefined,
        notes: newPaymentForm.notes || undefined,
        status: 'completed',
      });

      const paymentId = paymentResponse.data.id;

      // Create receipt automatically
      try {
        await receiptsService.createFromPayment(paymentId, 'receipt', 'individual_payment');
        toast.success('Pago registrado y recibo generado');
      } catch (receiptError) {
        console.error('Error creating receipt:', receiptError);
        toast.success('Pago registrado (recibo no generado)');
      }

      setNewPaymentOpen(false);
      setNewPaymentForm({
        client_id: '',
        amount: '',
        payment_method: 'cash',
        transaction_id: '',
        notes: '',
      });
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al crear pago');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      // Get receipts for this payment
      const receipts = await api.get(`/receipts?payment_id=${paymentId}`);
      if (receipts.data.data && receipts.data.data.length > 0) {
        const receipt = receipts.data.data[0];
        const blob = await receiptsService.downloadReceiptPdf(receipt.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${receipt.receipt_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Recibo descargado');
      } else {
        toast.info('No hay recibo disponible para este pago');
      }
    } catch (error) {
      console.error('Error descargando recibo:', error);
      toast.error('Error descargando recibo');
    }
  };

  const handlePrintTicket = async (paymentId: number) => {
    try {
      const receipts = await api.get(`/receipts?payment_id=${paymentId}`);
      if (receipts.data.data && receipts.data.data.length > 0) {
        const receipt = receipts.data.data[0];
        const html = await receiptsService.previewTicket(receipt.id);
        const printWindow = window.open('', '', 'width=350,height=600');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 300);
        }
        toast.success('Ticket listo para imprimir');
      } else {
        toast.info('No hay recibo disponible para este pago');
      }
    } catch (error) {
      toast.error('Error generando ticket');
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const search = clientSearch.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(search) ||
      c.last_name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.document_number?.toLowerCase().includes(search) ||
      c.cui?.toLowerCase().includes(search)
    );
  });

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Todos los pagos registrados en el sistema</CardDescription>
            </div>
            <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => setNewPaymentOpen(true)}>
              <CurrencyCircleDollar size={16} weight="fill" />
              Agregar Pago
            </Button>
          </div>
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
                  <TableHead className="text-center">Acciones</TableHead>
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
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => handleDownloadReceipt(p.id)}
                          title="Descargar Recibo PDF"
                        >
                          <Download size={14} />
                          Recibo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handlePrintTicket(p.id)}
                          title="Imprimir Ticket 80mm"
                        >
                          <Printer size={14} />
                        </Button>
                      </div>
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

      {/* New Payment Dialog */}
      <Dialog open={newPaymentOpen} onOpenChange={setNewPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Pago</DialogTitle>
            <DialogDescription>
              Registra un pago manual de un cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={newPaymentForm.client_id} onValueChange={(v) => setNewPaymentForm({ ...newPaymentForm, client_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2 border-b sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        autoFocus
                        placeholder="Buscar cliente..."
                        className="h-9 pl-8"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="pt-1">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No se encontraron clientes
                      </div>
                    ) : (
                      filteredClients.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          <div className="flex flex-col text-left">
                            <span>{c.first_name} {c.last_name}</span>
                            {(c.email || c.document_number || c.cui) && (
                              <span className="text-xs text-muted-foreground block mt-0.5">
                                {c.email || c.document_number || c.cui}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newPaymentForm.amount}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={newPaymentForm.payment_method} onValueChange={(v) => setNewPaymentForm({ ...newPaymentForm, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input
                value={newPaymentForm.transaction_id}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, transaction_id: e.target.value })}
                placeholder="Nº de transacción, recibo, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={newPaymentForm.notes}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, notes: e.target.value })}
                placeholder="Observaciones del pago"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPaymentOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={isCreatingPayment || !newPaymentForm.client_id || !newPaymentForm.amount}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isCreatingPayment ? (
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
