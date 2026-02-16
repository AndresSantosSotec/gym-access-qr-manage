import { useState, useEffect } from 'react';
import { ReceiptList } from '@/components/receipts/ReceiptList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { receiptsService } from '@/services/receipts.service';
import { toast } from 'sonner';
import type { Receipt } from '@/services/receipts.service';

interface ClientReceiptsProps {
  clientId: number;
}

/**
 * Componente para mostrar recibos de un cliente específico
 */
export function ClientReceipts({ clientId }: ClientReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  });

  useEffect(() => {
    loadClientReceipts();
  }, [clientId]);

  const loadClientReceipts = async () => {
    try {
      setLoading(true);
      const data = await receiptsService.byClient(clientId);
      setReceipts(data);

      // Calcular estadísticas
      const stats = {
        total: data.length,
        paid: data.filter(r => r.status === 'paid').length,
        pending: data.filter(r => r.status === 'pending').length,
      };
      setStats(stats);
    } catch (error) {
      toast.error('Error cargando recibos del cliente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recibos y Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando recibos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total de Recibos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Pagados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipts List */}
      <ReceiptList clientId={clientId} />
    </div>
  );
}

export default ClientReceipts;
