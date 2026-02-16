import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Eye,
  Printer,
  EnvelopeOpen,
} from '@phosphor-icons/react';
import { receiptsService, type Receipt } from '@/services/receipts.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReceiptCardProps {
  receipt: Receipt;
  onDownload?: (receipt: Receipt) => void;
  onPreview?: (receipt: Receipt) => void;
  compact?: boolean;
}

/**
 * Tarjeta compacta de recibo con acciones rápidas
 */
export function ReceiptCard({ 
  receipt, 
  onDownload, 
  onPreview,
  compact = false 
}: ReceiptCardProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
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
      onDownload?.(receipt);
    } catch (error) {
      toast.error('Error descargando recibo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    pending: 'Pendiente',
    paid: 'Pagado',
    cancelled: 'Cancelado',
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded border">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm font-semibold">{receipt.receipt_number}</div>
          <div className="text-xs text-muted-foreground">
            Q{receipt.total.toFixed(2)} • {new Date(receipt.created_at).toLocaleDateString('es-GT')}
          </div>
        </div>
        <div className={cn('px-2 py-1 text-xs rounded font-medium', getStatusColor(receipt.status))}>
          {statusLabel[receipt.status] || receipt.status}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-mono font-semibold text-lg">{receipt.receipt_number}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(receipt.created_at).toLocaleDateString('es-GT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
        <div className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(receipt.status))}>
          {statusLabel[receipt.status] || receipt.status}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Monto Total</div>
          <div className="text-2xl font-bold">Q{receipt.total.toFixed(2)}</div>
        </div>
        <div className="text-right">
          {receipt.is_invoiced && (
            <div>
              <div className="text-xs text-muted-foreground">Factura #</div>
              <div className="font-mono text-sm font-semibold">{receipt.invoice_number}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={loading}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-1" />
          Descargar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPreview?.(receipt)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </div>

      {receipt.description && (
        <div className="text-xs p-2 bg-muted rounded">
          {receipt.description}
        </div>
      )}
    </div>
  );
}

export default ReceiptCard;
