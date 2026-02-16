import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { receiptsService, type Receipt } from '@/services/receipts.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReceiptListProps {
  clientId?: number;
  onReceiptSelect?: (receipt: Receipt) => void;
}

/**
 * Componente para listar y gestionar recibos
 */
export function ReceiptList({ clientId, onReceiptSelect }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', message: '' });

  useEffect(() => {
    loadReceipts();
  }, [clientId]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = clientId 
        ? await receiptsService.byClient(clientId)
        : (await receiptsService.getAll()).data;
      setReceipts(data);
    } catch (error) {
      toast.error('Error cargando recibos');
      console.error(error);
    } finally {
      setLoading(false);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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

  const handleSendEmail = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEmailData({ email: receipt.client?.email || '', message: '' });
    setEmailOpen(true);
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
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      pending: 'outline',
      paid: 'default',
      cancelled: 'destructive',
    };
    
    const icons: Record<string, any> = {
      draft: <FileText className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      paid: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
    };

    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending: 'Pendiente',
      paid: 'Pagado',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="flex gap-1 items-center w-fit">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading && receipts.length === 0) {
    return <div className="text-center py-8">Cargando recibos...</div>;
  }

  if (receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recibos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay recibos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recibos y Facturas</CardTitle>
          <CardDescription>Gestiona recibos, descargas e impresiones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Facturado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-sm">
                      {receipt.receipt_number}
                    </TableCell>
                    <TableCell>{receipt.client?.name || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      Q{receipt.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {receipt.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell>
                      {receipt.is_invoiced ? (
                        <Badge className="bg-green-600">
                          {receipt.invoice_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
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
                            Descargar Recibo PDF
                          </DropdownMenuItem>

                          {receipt.is_invoiced && (
                            <DropdownMenuItem onClick={() => handleDownloadInvoice(receipt)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar Factura PDF
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleSendEmail(receipt)}>
                            <EnvelopeOpen className="w-4 h-4 mr-2" />
                            Enviar por Email
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => onReceiptSelect?.(receipt)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReceipt ? `${selectedReceipt.receipt_number} - ${selectedReceipt.client?.name}` : 'Preview'}
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
            <div className="text-center py-8">Cargando preview...</div>
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
              {selectedReceipt?.receipt_number} - {selectedReceipt?.client?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="cliente@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mensaje (Opcional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Mensaje personalizado..."
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
    </>
  );
}

export default ReceiptList;
