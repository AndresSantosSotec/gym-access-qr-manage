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
import { clientsService } from '@/services/clients.service';
import { can } from '@/services/permissions';
import { formatCurrency, formatDate } from '@/utils/date';
import { buildStorageUrl } from '@/utils/url.utils';
import {
  CreditCard,
  Money,
  Bank,
  Lightning,
  CalendarBlank,
  Warning,
  CheckCircle,
  Check,
  ArrowsClockwise,
  CurrencyCircleDollar,
  Receipt,
  Download,
  MagnifyingGlass,
  Printer,
  FileText,
  Trash,
  Envelope,
  DeviceMobile,
  FileArrowDown,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    transferDate: new Date().toISOString().split('T')[0],
    transferDocument: '',
  });
  const [isPaying, setIsPaying] = useState(false);

  // Recurrente checkout link state
  const [recurrenteCheckoutUrl, setRecurrenteCheckoutUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const generateRecurrenteLink = async () => {
    if (!selectedInstallment?.membership?.plan_id && !selectedInstallment?.membership?.membership_plan_id) {
      toast.error('Esta cuota no tiene plan de Recurrente asociado');
      return;
    }
    setIsGeneratingLink(true);
    try {
      const planId = selectedInstallment?.membership?.plan_id
        ?? selectedInstallment?.membership?.membership_plan_id;
      const clientId = selectedInstallment.client_id;
      const { data } = await import('@/services/api.service').then(m =>
        m.api.post('/recurrente/checkout', {
          client_id: clientId,
          plan_id: planId,
          success_url: `${window.location.origin}/p/pago-exitoso?client_id=${clientId}`,
          cancel_url: `${window.location.origin}/p/pago-fallido`,
        })
      );
      if (!data.checkout_url) throw new Error('No se recibio URL de checkout');
      setRecurrenteCheckoutUrl(data.checkout_url);
      window.open(data.checkout_url, '_blank');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err.message;
      toast.error(msg || 'No se pudo generar el link de Recurrente');
    } finally {
      setIsGeneratingLink(false);
    }
  };

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
      transferDate: new Date().toISOString().split('T')[0],
      transferDocument: '',
    });
    setRecurrenteCheckoutUrl(null);
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!selectedInstallment || !payForm.amount) return;
    setIsPaying(true);
    try {
      const finalReference = payForm.payment_method === 'transfer' && payForm.transferDate
        ? `${payForm.reference} (Fecha: ${payForm.transferDate})`
        : (payForm.reference || undefined);

      const result = await membershipsService.payInstallment(
        selectedInstallment.id,
        parseFloat(payForm.amount),
        payForm.payment_method,
        finalReference,
        payForm.notes || undefined,
        payForm.payment_method === 'transfer' && payForm.transferDocument ? payForm.transferDocument : undefined
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3 mt-1" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 mb-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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
                  <SelectItem value="recurrente">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} /> Tarjeta (Recurrente)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payForm.payment_method === 'transfer' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-semibold text-sm">Datos de Transferencia</h4>
                <div className="space-y-2">
                  <Label>Fecha de Boleta / Transferencia</Label>
                  <Input
                    type="date"
                    value={payForm.transferDate}
                    onChange={(e) => setPayForm({ ...payForm, transferDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Referencia / Boleta *</Label>
                  <Input
                    value={payForm.reference}
                    onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                    placeholder="Ej. AB01239"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comprobante / Boleta (Opcional)</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Validar tipo
                      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                        toast.error('Solo se permiten imágenes o PDF');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPayForm({ ...payForm, transferDocument: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                  {payForm.transferDocument && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check size={12} /> Documento adjuntado
                    </p>
                  )}
                </div>
              </div>
            )}

            {payForm.payment_method === 'recurrente' && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={18} className="text-blue-600" />
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Pago con Tarjeta (Recurrente)</h4>
                </div>
                {!recurrenteCheckoutUrl ? (
                  <Button
                    type="button"
                    onClick={generateRecurrenteLink}
                    disabled={isGeneratingLink}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard size={16} className="mr-2" />
                    {isGeneratingLink ? 'Generando enlace...' : 'Generar Enlace de Pago'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">✅ Enlace generado</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => window.open(recurrenteCheckoutUrl, '_blank')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Abrir Enlace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(recurrenteCheckoutUrl);
                          toast.success('Enlace copiado');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setRecurrenteCheckoutUrl(null)}
                      className="w-full text-muted-foreground"
                    >
                      Regenerar enlace
                    </Button>
                  </div>
                )}
              </div>
            )}

            {payForm.payment_method !== 'transfer' && payForm.payment_method !== 'recurrente' && (
              <div className="space-y-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  value={payForm.reference}
                  onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                  placeholder="Nº de recibo, boleta, etc."
                />
              </div>
            )}

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
            {payForm.payment_method === 'recurrente' ? (
              <Button
                onClick={() => {
                  toast.success('Membresía se activará automáticamente cuando Recurrente confirme el pago');
                  setPayDialogOpen(false);
                }}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={!recurrenteCheckoutUrl}
              >
                <CheckCircle size={16} weight="fill" />
                Ya completó el pago
              </Button>
            ) : (
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
            )}
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
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);

  // Enviar comprobante por correo
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogData, setEmailDialogData] = useState<{
    paymentId: number;
    receiptId: number;
    receiptNumber: string;
    clientId: number;
    clientEmail: string;
    clientPhone: string;
    clientNit: string | null;
  } | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [nitInputValue, setNitInputValue] = useState('');
  const [savingNit, setSavingNit] = useState(false);

  // Filtro por día o rango, método de pago y paginación
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [revenueByDay, setRevenueByDay] = useState<{ total_revenue: number; count: number } | null>(null);
  const [totalRevenueAll, setTotalRevenueAll] = useState<number | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!filterDate) {
      api.get('/payments/revenue').then((res) => setTotalRevenueAll(res.data.total_revenue ?? 0)).catch(() => setTotalRevenueAll(null));
    }
  }, [filterDate]);

  useEffect(() => {
    loadPayments();
  }, [page, perPage, filterDate, filterDateTo, filterPaymentMethod]);

  useEffect(() => {
    if (filterDate || filterDateTo) {
      const from = filterDate || filterDateTo;
      const to = filterDateTo || filterDate || filterDateTo;
      api.get('/payments/revenue', { params: { from, to } })
        .then((res) => setRevenueByDay(res.data))
        .catch(() => setRevenueByDay(null));
    } else {
      setRevenueByDay(null);
    }
  }, [filterDate, filterDateTo]);

  const [downloadingCorte, setDownloadingCorte] = useState(false);
  const [downloadingCorteExcel, setDownloadingCorteExcel] = useState(false);

  const getCorteCajaDates = () => {
    const today = new Date().toISOString().slice(0, 10);
    const from = filterDate || today;
    const to = filterDateTo || filterDate || today;
    return { from, to };
  };

  const handleDownloadCorteCajaPdf = async () => {
    const { from, to } = getCorteCajaDates();
    setDownloadingCorte(true);
    try {
      const res = await api.get('/payments/corte-caja/pdf', {
        params: { from, to },
        responseType: 'blob',
      });
      const blob = res.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        toast.error('No se pudo generar el reporte');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corte-caja-${from}${from !== to ? `_a_${to}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Corte de caja (PDF) descargado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al descargar el reporte');
    } finally {
      setDownloadingCorte(false);
    }
  };

  const handleDownloadCorteCajaExcel = async () => {
    const { from, to } = getCorteCajaDates();
    setDownloadingCorteExcel(true);
    try {
      const res = await api.get('/payments/corte-caja/excel', {
        params: { from, to },
        responseType: 'blob',
      });
      const blob = res.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        toast.error('No se pudo generar el Excel');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corte-caja-${from}${from !== to ? `_a_${to}` : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Corte de caja (Excel) descargado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al descargar el Excel');
    } finally {
      setDownloadingCorteExcel(false);
    }
  };

  const handleDeletePayment = async (p: { id: number }) => {
    if (!confirm('¿Eliminar este pago y los recibos/facturas asociados? Esta acción no se puede deshacer.')) return;
    setDeletingPaymentId(p.id);
    try {
      await api.delete(`/payments/${p.id}`);
      toast.success('Pago y recibos asociados eliminados');
      loadPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo eliminar el pago');
    } finally {
      setDeletingPaymentId(null);
    }
  };

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
      const effectivePerPage = perPage === 9999 ? 9999 : perPage;
      const params: Record<string, string | number> = { page, per_page: effectivePerPage };
      if (filterDate && filterDateTo) {
        params.date_from = filterDate;
        params.date_to = filterDateTo;
      } else if (filterDate) {
        params.date = filterDate;
      }
      if (filterPaymentMethod) params.method = filterPaymentMethod;
      const response = await api.get('/payments', { params });
      const data = response.data;
      setPayments(data.data || []);
      setTotalItems(data.total ?? 0);
      setLastPage(data.last_page ?? 1);
    } catch (e) {
      toast.error('Error al cargar pagos');
      setPayments([]);
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

  /** Obtiene el recibo del pago o lo genera con los datos del pago y del cliente (facturación). */
  const getOrCreateReceiptForPayment = async (p: {
    id: number;
    membership_id?: number | null;
  }): Promise<{ receipt: { id: number; receipt_number?: string }; wasCreated: boolean } | null> => {
    const res = await receiptsService.getAll({ payment_id: p.id, per_page: 1 });
    const list = (res as any).data ?? [];
    if (list[0]?.id) return { receipt: list[0], wasCreated: false };
    const paymentType = p.membership_id ? 'subscription' : 'individual_payment';
    const created = await receiptsService.createFromPayment(p.id, 'receipt', paymentType);
    return { receipt: created as { id: number; receipt_number?: string }, wasCreated: true };
  };

  const handleDownloadReceipt = async (p: { id: number; membership_id?: number | null }) => {
    try {
      const result = await getOrCreateReceiptForPayment(p);
      if (!result?.receipt?.id) {
        toast.error('No se pudo generar el recibo para este pago');
        return;
      }
      const { receipt, wasCreated } = result;
      if (wasCreated) toast.info('Recibo generado, descargando…');
      const blob = await receiptsService.downloadReceiptPdf(receipt.id);
      if (!(blob instanceof Blob) || blob.size === 0) {
        toast.error('El recibo está vacío o no se pudo generar');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${receipt.receipt_number ?? p.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Recibo descargado');
    } catch (error: any) {
      console.error('Error descargando recibo:', error);
      const msg = error?.response?.data?.message ?? error?.message ?? 'Error descargando recibo';
      toast.error(msg);
    }
  };

  const handleOpenEmailDialog = async (p: any) => {
    try {
      const result = await getOrCreateReceiptForPayment(p);
      if (!result?.receipt?.id) {
        toast.error('No se pudo generar el recibo para este pago');
        return;
      }
      const receipt = result.receipt;
      const clientId = p.client_id ?? p.client?.id;
      const clientEmail = p.client?.email ?? '';
      const clientPhone = p.client?.phone ?? '';
      const clientNit = p.client?.nit ?? null;
      setEmailDialogData({
        paymentId: p.id,
        receiptId: receipt.id,
        receiptNumber: receipt.receipt_number ?? String(receipt.id),
        clientId: clientId ?? 0,
        clientEmail,
        clientPhone,
        clientNit,
      });
      setEmailTo(clientEmail);
      setEmailMessage('');
      setNitInputValue(clientNit ?? '');
      setEmailDialogOpen(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'No se pudo cargar el recibo');
    }
  };

  const handleSaveClientNit = async () => {
    if (!emailDialogData?.clientId || !nitInputValue.trim()) return;
    setSavingNit(true);
    try {
      await clientsService.update(String(emailDialogData.clientId), { nit: nitInputValue.trim() });
      setEmailDialogData((prev) => (prev ? { ...prev, clientNit: nitInputValue.trim() } : null));
      toast.success('NIT guardado. Aparecerá en el recibo al enviar por correo.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al guardar el NIT');
    } finally {
      setSavingNit(false);
    }
  };

  const handleSendReceiptEmail = async () => {
    if (!emailDialogData || !emailTo.trim()) {
      toast.error('Ingresa un correo válido');
      return;
    }
    const email = emailTo.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      toast.error('El correo no es válido');
      return;
    }
    setSendingEmail(true);
    try {
      await receiptsService.emailReceipt(emailDialogData.receiptId, email, emailMessage.trim() || undefined);
      toast.success('Comprobante enviado por correo');
      setEmailDialogOpen(false);
      setEmailDialogData(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al enviar el correo');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrintTicket = async (p: { id: number; membership_id?: number | null }) => {
    try {
      const result = await getOrCreateReceiptForPayment(p);
      if (!result?.receipt?.id) {
        toast.error('No se pudo generar el recibo para este pago');
        return;
      }
      const receipt = result.receipt;
      const html = await receiptsService.previewTicket(receipt.id);
      const printWindow = window.open('', '', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
        toast.success('Ticket listo para imprimir');
      } else {
        toast.error('Permite ventanas emergentes para imprimir');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Error generando ticket');
    }
  };

  const totalRevenue = filterDate && revenueByDay !== null
    ? revenueByDay.total_revenue
    : (totalRevenueAll ?? payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0));

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

  const completedCount = filterDate ? (revenueByDay?.count ?? 0) : payments.filter((p) => p.status === 'completed').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const thisMonth = payments.filter((p) => {
    const date = new Date(p.created_at || p.paid_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 mb-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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

      {/* Filtro por día + Ingresos del día */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ver pagos por día</CardTitle>
          <CardDescription>Filtra por fecha o rango de fechas, revisa ingresos y descarga el corte de caja en PDF</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarBlank size={20} className="text-muted-foreground" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
              placeholder="Desde"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
              placeholder="Hasta"
            />
            <Select
              value={filterPaymentMethod || 'all'}
              onValueChange={(v) => {
                setFilterPaymentMethod(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="recurrente">Recurrente</SelectItem>
              </SelectContent>
            </Select>
            {(filterDate || filterDateTo || filterPaymentMethod) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDate('');
                  setFilterDateTo('');
                  setFilterPaymentMethod('');
                  setPage(1);
                }}
              >
                Limpiar
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadCorteCajaPdf}
              disabled={downloadingCorte}
              title="Generar y descargar corte de caja en PDF"
            >
              {downloadingCorte ? (
                <ArrowsClockwise size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Corte de caja (PDF)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadCorteCajaExcel}
              disabled={downloadingCorteExcel}
              title="Generar y descargar corte de caja en Excel"
            >
              {downloadingCorteExcel ? (
                <ArrowsClockwise size={16} className="animate-spin" />
              ) : (
                <FileArrowDown size={16} />
              )}
              Corte de caja (Excel)
            </Button>
          </div>
          {(filterDate || filterDateTo) && revenueByDay !== null && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {filterDateTo && filterDate !== filterDateTo ? 'Ingresos del periodo:' : 'Ingresos del día:'}
              </span>
              <span className="text-xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(revenueByDay.total_revenue)}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">
                ({revenueByDay.count} pago{revenueByDay.count !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                {filterDate || filterDateTo
                  ? filterDateTo && filterDate !== filterDateTo
                    ? `Pagos del ${new Date(filterDate + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })} al ${new Date(filterDateTo + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Pagos del ${new Date((filterDate || filterDateTo) + 'T12:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Todos los pagos registrados'}
              </CardDescription>
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
                      <div className="flex flex-col gap-1 justify-center align-middle">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleDownloadReceipt(p)}
                            title="Descargar Recibo PDF"
                          >
                            <Download size={14} />
                            Recibo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handlePrintTicket(p)}
                            title="Imprimir Ticket 80mm"
                          >
                            <Printer size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleOpenEmailDialog(p)}
                            title="Enviar comprobante por correo"
                          >
                            <Envelope size={14} />
                            Correo
                          </Button>
                          {can('ROLES_MANAGE') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeletePayment(p)}
                              disabled={deletingPaymentId === p.id}
                              title="Eliminar pago y recibos/facturas asociados"
                            >
                              <Trash size={14} />
                            </Button>
                          )}
                        </div>
                        {p.document_url && (
                          <div className="flex gap-1 justify-center">
                            <a
                              href={buildStorageUrl(p.document_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <FileText size={14} /> Ver Comprobante
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      {(filterDate || filterDateTo) ? 'No hay pagos en el periodo seleccionado' : 'No hay pagos registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filas por página</span>
              <Select
                value={perPage === 9999 ? 'all' : String(perPage)}
                onValueChange={(v) => {
                  setPerPage(v === 'all' ? 9999 : Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[95px]">
                  <SelectValue placeholder="Filas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {totalItems === 0
                  ? '0 resultados'
                  : (() => {
                      const from = (page - 1) * (perPage === 9999 ? totalItems : perPage) + 1;
                      const to = perPage === 9999 ? totalItems : Math.min(page * perPage, totalItems);
                      return `Mostrando ${from} a ${to} de ${totalItems} resultado${totalItems !== 1 ? 's' : ''}`;
                    })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Página {page} de {lastPage || 1}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                ›
              </Button>
            </div>
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

      {/* Enviar comprobante por correo */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => { setEmailDialogOpen(open); if (!open) setEmailDialogData(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar comprobante</DialogTitle>
            <DialogDescription>
              Envía el recibo por correo al cliente o a otro correo. Si el cliente tiene NIT registrado, el PDF ya lo incluye.
            </DialogDescription>
          </DialogHeader>
          {emailDialogData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Correo *</Label>
                <Input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
                {!emailDialogData.clientEmail && (
                  <p className="text-xs text-muted-foreground">El cliente no tiene correo registrado. Ingresa uno para enviar.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Mensaje (opcional)</Label>
                <Input
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Ej: Adjunto tu recibo..."
                />
              </div>
              {emailDialogData.clientPhone && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <DeviceMobile size={16} />
                    Teléfono del cliente: <span className="font-medium text-foreground">{emailDialogData.clientPhone}</span>
                  </p>
                </div>
              )}
              {/* NIT: si tiene, mostrarlo; si no, permitir agregar y guardar */}
              <div className="space-y-2">
                <Label>NIT del cliente</Label>
                {emailDialogData.clientNit ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{emailDialogData.clientNit}</span> — incluido en el recibo
                  </p>
                ) : emailDialogData.clientId ? (
                  <>
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                      <AlertDescription>
                        El cliente no tiene NIT registrado. Agrégalo aquí y guarda para que aparezca en el recibo.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Input
                        value={nitInputValue}
                        onChange={(e) => setNitInputValue(e.target.value)}
                        placeholder="Ej: 12345678-9"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSaveClientNit}
                        disabled={savingNit || !nitInputValue.trim()}
                        className="shrink-0"
                      >
                        {savingNit ? <ArrowsClockwise size={16} className="animate-spin" /> : <Check size={16} />}
                        Guardar
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendReceiptEmail}
              disabled={sendingEmail || !emailTo.trim()}
              className="gap-2"
            >
              {sendingEmail ? (
                <ArrowsClockwise size={16} className="animate-spin" />
              ) : (
                <Envelope size={16} />
              )}
              Enviar por correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
