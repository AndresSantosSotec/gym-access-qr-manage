import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileText,
  Eye,
  EnvelopeOpen,
  DotsThreeVertical,
  Printer,
  CheckCircle,
  Clock,
  XCircle,
  MagnifyingGlass,
  CurrencyDollar,
  WhatsappLogo,
  ArrowsClockwise,
  Receipt as ReceiptIcon,
  CalendarBlank,
  Export,
  Trash,
  Stamp,
  FilePdf,
  FileCode,
  Prohibit,
} from '@phosphor-icons/react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { receiptsService, type Receipt, type FelBillingData } from '@/services/receipts.service';
import { can } from '@/services/permissions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { downloadBlobFile } from '@/utils/downloadFile';

/** Solo el admin puede borrar recibos/facturas (permiso ROLES_MANAGE = rol administrador) */
const canDeleteReceipts = () => can('ROLES_MANAGE');

interface FilterState {
  status: string;
  paymentType: string;
  isInvoiced: string;
  search: string;
}

/**
 * Página de administración de recibos y facturas
 */
export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentType: 'all',
    isInvoiced: 'all',
    search: '',
  });

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', message: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    date_from: '',
    date_to: '',
    status: '',
    payment_type: '',
    payment_method: '',
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    invoiced: 0,
  });

  // ─── FEL State ───
  const [felLoading, setFelLoading] = useState<number | null>(null);
  const [felDialogOpen, setFelDialogOpen] = useState(false);
  const [felResult, setFelResult] = useState<{ receipt: Receipt; fel: FelBillingData } | null>(null);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Receipt | null>(null);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    loadReceipts();
    loadStats();
  }, [filters]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await receiptsService.getAll({
        status: filters.status === 'all' ? undefined : filters.status || undefined,
        payment_type: filters.paymentType === 'all' ? undefined : filters.paymentType || undefined,
        is_invoiced: filters.isInvoiced === 'all' ? undefined : (filters.isInvoiced === 'true'),
      });

      let filtered = response.data;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(r =>
          r.receipt_number.toLowerCase().includes(search) ||
          r.invoice_number?.toLowerCase().includes(search) ||
          (r.client?.full_name || r.client?.name || '').toLowerCase().includes(search)
        );
      }

      setReceipts(filtered);
    } catch (error) {
      toast.error('Error cargando recibos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await receiptsService.statistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats', error);
    }
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      const blob = await receiptsService.downloadReceiptPdf(receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Recibo descargado');
    } catch (error) {
      toast.error('Error descargando recibo');
    }
  };

  const handleDownloadInvoice = async (receipt: Receipt) => {
    try {
      const blob = await receiptsService.downloadInvoicePdf(receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.invoice_number || receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Factura descargada');
    } catch (error) {
      toast.error('Error descargando factura');
    }
  };

  const handlePreview = async (receipt: Receipt, isInvoice: boolean = false) => {
    try {
      setPreviewLoading(true);
      setSelectedReceipt(receipt);
      const html = isInvoice
        ? await receiptsService.previewInvoice(receipt.id)
        : await receiptsService.previewReceipt(receipt.id);
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (error) {
      toast.error('Error cargando preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handlePrintTicket = async (receipt: Receipt) => {
    try {
      const html = await receiptsService.previewTicket(receipt.id);
      const printWindow = window.open('', '', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
      toast.success('Ticket listo para imprimir');
    } catch (error) {
      toast.error('Error generando ticket');
    }
  };

  const handleDownloadTicket = async (receipt: Receipt) => {
    try {
      const blob = await receiptsService.downloadTicketPdf(receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ticket_${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Ticket descargado');
    } catch (error) {
      toast.error('Error descargando ticket');
    }
  };

  const handleDownloadReport = async () => {
    try {
      setReportLoading(true);
      const blob = await receiptsService.downloadReportPdf({
        date_from: reportFilters.date_from || undefined,
        date_to: reportFilters.date_to || undefined,
        status: reportFilters.status || undefined,
        payment_type: reportFilters.payment_type || undefined,
        payment_method: reportFilters.payment_method || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Recibos_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Reporte descargado');
      setReportOpen(false);
    } catch (error) {
      toast.error('Error generando reporte');
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendEmail = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEmailData({ email: receipt.client?.email || '', message: '' });
    setEmailOpen(true);
  };

  const handleShareWhatsApp = async (receipt: Receipt) => {
    // First download the PDF so the user has it
    try {
      const blob = await receiptsService.downloadReceiptPdf(receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receipt.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.warn('Error descargando PDF para WhatsApp:', error);
    }

    // Build WhatsApp message
    const clientName = receipt.client?.full_name || receipt.client?.name || 'Cliente';
    const phone = receipt.client?.phone?.replace(/\D/g, '') || '';
    const total = `Q${Number(receipt.total || 0).toFixed(2)}`;
    const date = new Date(receipt.created_at).toLocaleDateString('es-GT');
    const typeLabel = receipt.payment_type === 'subscription' ? 'Membresía' :
      receipt.payment_type === 'individual_payment' ? 'Pago' :
        receipt.payment_type === 'course' ? 'Curso' :
          receipt.payment_type === 'product' ? 'Venta/POS' : 'Otro';

    const message = encodeURIComponent(
      `\u{1F3CB} *IronGym - Comprobante de Pago*\n\n` +
      `\u{1F4C4} Recibo: *${receipt.receipt_number}*\n` +
      `\u{1F464} Cliente: *${clientName}*\n` +
      `\u{1F4B0} Total: *${total}*\n` +
      `\u{1F4CB} Tipo: ${typeLabel}\n` +
      `\u{1F4C5} Fecha: ${date}\n` +
      `\u{2705} Estado: ${receipt.status === 'paid' ? 'Pagado' : 'Pendiente'}\n\n` +
      `El PDF del recibo se descargó automáticamente. Puedes adjuntarlo a este chat.\n\n` +
      `_Gracias por tu preferencia._`
    );

    // Open WhatsApp with pre-filled message (use phone if available)
    const waUrl = phone
      ? `https://wa.me/${phone.startsWith('502') ? phone : '502' + phone}?text=${message}`
      : `https://web.whatsapp.com/send?text=${message}`;

    window.open(waUrl, '_blank');
    toast.success('PDF descargado. WhatsApp abierto para enviar.');
  };

  const submitEmail = async () => {
    if (!selectedReceipt || !emailData.email) {
      toast.error('Ingrese un correo válido');
      return;
    }
    try {
      await receiptsService.emailReceipt(selectedReceipt.id, emailData.email, emailData.message);
      toast.success('Recibo enviado por correo');
      setEmailOpen(false);
    } catch (error) {
      toast.error('Error enviando recibo');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      pending: 'outline',
      paid: 'default',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending: 'Pendiente',
      paid: 'Pagado',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleDeleteReceipt = async (receipt: Receipt) => {
    if (!confirm(`¿Eliminar recibo/factura ${receipt.receipt_number}? Esta acción no se puede deshacer.`)) return;
    setDeletingId(receipt.id);
    try {
      await receiptsService.delete(receipt.id);
      toast.success('Recibo eliminado');
      loadReceipts();
      loadStats();
      if (selectedReceipt?.id === receipt.id) {
        setSelectedReceipt(null);
        setPreviewOpen(false);
      }
    } catch {
      toast.error('No se pudo eliminar el recibo');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── FEL Handlers ───
  const handleCertifyFel = async (receipt: Receipt) => {
    if (felLoading) return;
    setFelLoading(receipt.id);
    try {
      const result = await receiptsService.certifyFel(receipt.id);
      const fel: FelBillingData = result?.fel ?? result;
      // Refresh receipt to get updated details
      const updated = await receiptsService.getById(receipt.id);
      if (fel?.fel_status === 'certified') {
        toast.success('¡Factura electrónica certificada exitosamente!');
      } else {
        toast.warning(fel?.error || 'FEL no pudo certificarse');
      }
      setFelResult({ receipt: updated, fel });
      setFelDialogOpen(true);
      loadReceipts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || 'Error al certificar FEL');
    } finally {
      setFelLoading(null);
    }
  };

  const handleDownloadFelPdf = async (receipt: Receipt) => {
    try {
      const blob = await receiptsService.downloadFelPdf(receipt.id);
      const uuid = receipt.details?.electronic_billing?.uuid ?? receipt.id;
      downloadBlobFile(blob, receiptsService.felDownloadFilename(receipt.id, uuid, 'pdf'));
      toast.success('PDF FEL descargado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo descargar el PDF FEL del certificador');
    }
  };

  const handleDownloadFelXml = async (receipt: Receipt) => {
    try {
      const blob = await receiptsService.downloadFelXml(receipt.id);
      const uuid = receipt.details?.electronic_billing?.uuid ?? receipt.id;
      downloadBlobFile(blob, receiptsService.felDownloadFilename(receipt.id, uuid, 'xml'));
      toast.success('XML FEL descargado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo descargar el XML FEL del certificador');
    }
  };

  const handleVoidFel = (receipt: Receipt) => {
    setVoidTarget(receipt);
    setVoidDialogOpen(true);
  };

  const confirmVoidFel = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    try {
      const result = await receiptsService.voidFel(voidTarget.id);
      if (result?.result?.success) {
        toast.success('DTE FEL anulado correctamente');
      } else if (result?.expected_in_pruebas || result?.result?.expected_in_pruebas) {
        toast.warning(
          result?.message ||
            'Anulación rechazada por SAT en ambiente PRUEBAS. El XML se envió correctamente; en producción funcionará con DTEs reales.'
        );
      } else {
        toast.warning(result?.result?.message || result?.result?.error || result?.message || 'No se pudo anular el DTE');
      }
      loadReceipts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || 'Error al anular DTE FEL');
    } finally {
      setVoiding(false);
      setVoidDialogOpen(false);
      setVoidTarget(null);
    }
  };

  /** Helper: obtiene datos FEL de un recibo */
  const getFelData = (receipt: Receipt): FelBillingData | null =>
    (receipt.details?.electronic_billing as FelBillingData) ?? null;

  /** Helper: renderiza badge de estado FEL */
  const FelBadge = ({ receipt }: { receipt: Receipt }) => {
    const fel = getFelData(receipt);
    if (!fel) return null;
    if (fel.fel_status === 'certified') {
      return (
        <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0.5">
          <Stamp size={10} weight="fill" /> FEL
        </Badge>
      );
    }
    if (fel.fel_status === 'voided') {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5 border-amber-500 text-amber-700">
          <Prohibit size={10} weight="fill" /> FEL Anulado
        </Badge>
      );
    }
    if (fel.fel_status === 'failed') {
      return (
        <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0.5">
          <XCircle size={10} weight="fill" /> FEL Error
        </Badge>
      );
    }
    if (fel.fel_status === 'skipped') {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5 text-muted-foreground">
          <Clock size={10} /> FEL N/A
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Recibos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Facturados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.invoiced}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Número, cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <MagnifyingGlass className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Pago</label>
              <Select value={filters.paymentType} onValueChange={(v) => setFilters({ ...filters, paymentType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="subscription">Membresía</SelectItem>
                  <SelectItem value="individual_payment">Pago Individual</SelectItem>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="product">Venta/POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Facturación</label>
              <Select value={filters.isInvoiced} onValueChange={(v) => setFilters({ ...filters, isInvoiced: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Facturado</SelectItem>
                  <SelectItem value="false">No Facturado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recibos y Facturas</CardTitle>
              <CardDescription>
                {loading ? 'Cargando...' : `${receipts.length} recibos encontrados`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { loadReceipts(); loadStats(); }}>
                <ArrowsClockwise className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button size="sm" onClick={() => setReportOpen(true)}>
                <Export className="w-4 h-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Facturado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No hay recibos disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {receipt.receipt_number}
                          <FelBadge receipt={receipt} />
                        </div>
                      </TableCell>
                      <TableCell>{receipt.client?.full_name || receipt.client?.name || '-'}</TableCell>
                      <TableCell className="text-right font-bold">
                        Q{Number(receipt.total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {receipt.payment_type === 'subscription' ? 'Membresía' :
                            receipt.payment_type === 'individual_payment' ? 'Pago' :
                              receipt.payment_type === 'product' ? 'Venta/POS' : receipt.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell>
                        {receipt.is_invoiced ? (
                          <Badge className="bg-blue-600 text-xs">
                            {receipt.invoice_number}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(receipt.created_at).toLocaleDateString('es-GT')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <DotsThreeVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handlePreview(receipt)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Recibo
                            </DropdownMenuItem>

                            {receipt.is_invoiced && (
                              <DropdownMenuItem onClick={() => handlePreview(receipt, true)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Factura
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleDownloadReceipt(receipt)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>

                            {receipt.is_invoiced && (
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(receipt)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Descargar Factura
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleSendEmail(receipt)}>
                              <EnvelopeOpen className="w-4 h-4 mr-2" />
                              Enviar por Email
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleShareWhatsApp(receipt)}>
                              <WhatsappLogo className="w-4 h-4 mr-2" />
                              Enviar por WhatsApp
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handlePrintTicket(receipt)}>
                              <ReceiptIcon className="w-4 h-4 mr-2" />
                              Imprimir Ticket 80mm
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleDownloadTicket(receipt)}>
                              <Printer className="w-4 h-4 mr-2" />
                              Descargar Ticket PDF
                            </DropdownMenuItem>

                            {/* ─── FEL Actions ─── */}
                            <DropdownMenuSeparator />

                            {getFelData(receipt)?.fel_status !== 'certified' ? (
                              <DropdownMenuItem
                                onClick={() => handleCertifyFel(receipt)}
                                disabled={felLoading === receipt.id}
                                className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                              >
                                {felLoading === receipt.id ? (
                                  <ArrowsClockwise className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Stamp className="w-4 h-4 mr-2" />
                                )}
                                {felLoading === receipt.id ? 'Certificando FEL...' : 'Facturar con FEL'}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled
                                className="text-emerald-600 opacity-60"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                                FEL Certificado ✓
                              </DropdownMenuItem>
                            )}

                            {getFelData(receipt)?.uuid && (
                              <>
                                <DropdownMenuItem onClick={() => handleDownloadFelPdf(receipt)}>
                                  <FilePdf className="w-4 h-4 mr-2" />
                                  Descargar PDF FEL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadFelXml(receipt)}>
                                  <FileCode className="w-4 h-4 mr-2" />
                                  Descargar XML FEL
                                </DropdownMenuItem>
                              </>
                            )}

                            {getFelData(receipt)?.uuid && getFelData(receipt)?.fel_status === 'certified' && (
                              <DropdownMenuItem
                                onClick={() => handleVoidFel(receipt)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Prohibit className="w-4 h-4 mr-2" />
                                Anular DTE FEL
                              </DropdownMenuItem>
                            )}

                            {getFelData(receipt)?.fel_status === 'voided' && (
                              <DropdownMenuItem disabled className="opacity-60">
                                <Prohibit className="w-4 h-4 mr-2" />
                                DTE ya anulado
                              </DropdownMenuItem>
                            )}

                            {canDeleteReceipts() && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteReceipt(receipt)}
                                  disabled={deletingId === receipt.id}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  {deletingId === receipt.id ? 'Eliminando…' : 'Eliminar recibo/factura'}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── FEL Result Dialog ─── */}
      <Dialog open={felDialogOpen} onOpenChange={setFelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {felResult?.fel?.fel_status === 'certified' ? (
                <><CheckCircle className="w-5 h-5 text-emerald-600" weight="fill" /> Factura Electrónica Certificada</>
              ) : (
                <><XCircle className="w-5 h-5 text-destructive" weight="fill" /> Error en Certificación FEL</>
              )}
            </DialogTitle>
            <DialogDescription>
              {felResult?.receipt?.receipt_number} — {felResult?.receipt?.client?.full_name || felResult?.receipt?.client?.name}
            </DialogDescription>
          </DialogHeader>

          {felResult && (
            <div className="space-y-3">
              {felResult.fel.fel_status === 'certified' ? (
                <>
                  <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
                    {felResult.fel.uuid && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground font-medium">UUID del DTE</p>
                        <p className="font-mono text-sm font-bold text-emerald-700 break-all">{felResult.fel.uuid}</p>
                      </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      {felResult.fel.serie && (
                        <div>
                          <p className="text-xs text-muted-foreground">Serie</p>
                          <p className="font-semibold text-sm">{felResult.fel.serie}</p>
                        </div>
                      )}
                      {felResult.fel.numero && (
                        <div>
                          <p className="text-xs text-muted-foreground">Número</p>
                          <p className="font-semibold text-sm">{felResult.fel.numero}</p>
                        </div>
                      )}
                    </div>
                    {felResult.fel.receptor && (
                      <div>
                        <p className="text-xs text-muted-foreground">Receptor</p>
                        <p className="text-sm">{felResult.fel.receptor.id} — {felResult.fel.receptor.name}</p>
                      </div>
                    )}
                    {felResult.fel.certified_at && (
                      <div>
                        <p className="text-xs text-muted-foreground">Certificado</p>
                        <p className="text-sm">{new Date(felResult.fel.certified_at).toLocaleString('es-GT')}</p>
                      </div>
                    )}
                  </div>
                  <a
                    href="https://app.corposistemasgt.com/invoice/login"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <FileText size={14} /> Ver en portal Corpo Sistemas →
                  </a>
                </>
              ) : (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive font-medium">{felResult.fel.error || 'Error desconocido del certificador'}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {felResult.fel.uuid && (
                  <>
                    <button
                      onClick={() => handleDownloadFelPdf(felResult.receipt)}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <FilePdf size={14} /> PDF FEL
                    </button>
                    <button
                      onClick={() => handleDownloadFelXml(felResult.receipt)}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <FileCode size={14} /> XML FEL
                    </button>
                  </>
                )}
                <button
                  onClick={() => setFelDialogOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReceipt ? `${selectedReceipt.receipt_number} - ${selectedReceipt.client?.full_name || selectedReceipt.client?.name}` : 'Vista Previa'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button onClick={handlePrint} disabled={previewLoading}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </div>

          {previewLoading ? (
            <div className="text-center py-8">Cargando vista previa...</div>
          ) : (
            <div
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Recibo por Email</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.receipt_number} - {selectedReceipt?.client?.full_name || selectedReceipt?.client?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
              <Input
                type="email"
                placeholder="cliente@example.com"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mensaje (Opcional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={4}
                placeholder="Mensaje personalizado..."
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submitEmail}>
                <EnvelopeOpen className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Export className="w-5 h-5" />
              Exportar Reporte de Recibos
            </DialogTitle>
            <DialogDescription>
              Selecciona los filtros para generar el reporte en PDF (A4 horizontal).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Desde</label>
                <Input
                  type="date"
                  value={reportFilters.date_from}
                  onChange={(e) => setReportFilters({ ...reportFilters, date_from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Hasta</label>
                <Input
                  type="date"
                  value={reportFilters.date_to}
                  onChange={(e) => setReportFilters({ ...reportFilters, date_to: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select
                  value={reportFilters.status || 'all'}
                  onValueChange={(v) => setReportFilters({ ...reportFilters, status: v === 'all' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Pago</label>
                <Select
                  value={reportFilters.payment_type || 'all'}
                  onValueChange={(v) => setReportFilters({ ...reportFilters, payment_type: v === 'all' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="subscription">Membresía</SelectItem>
                    <SelectItem value="individual_payment">Pago Individual</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                    <SelectItem value="product">Producto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método de Pago</label>
              <Select
                value={reportFilters.payment_method || 'all'}
                onValueChange={(v) => setReportFilters({ ...reportFilters, payment_method: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportFilters({ date_from: '', date_to: '', status: '', payment_type: '', payment_method: '' })}
            >
              Limpiar Filtros
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReportOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDownloadReport} disabled={reportLoading}>
                {reportLoading ? (
                  <ArrowsClockwise className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {reportLoading ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular DTE FEL?</AlertDialogTitle>
            <AlertDialogDescription>
              {voidTarget
                ? `Se enviará la anulación del DTE del recibo ${voidTarget.receipt_number} a Corpo Sistemas/SAT. Esta acción es irreversible cuando la anulación es aceptada.`
                : 'Confirmar anulación del documento electrónico.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={voiding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={voiding}
              onClick={(e) => {
                e.preventDefault();
                confirmVoidFel();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {voiding ? 'Anulando...' : 'Anular DTE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ReceiptsPage;
