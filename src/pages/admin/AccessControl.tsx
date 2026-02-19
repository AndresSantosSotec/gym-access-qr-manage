import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { accessService } from '@/services/access.service';
import { formatDateTime, getDaysRemaining } from '@/utils/date';
import { toast } from 'sonner';
import { QrCode, CheckCircle, XCircle, MagnifyingGlass } from '@phosphor-icons/react';

export function AccessControl() {
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await accessService.getRecentLogs(15);
        setRecentLogs(Array.isArray(logs) ? logs : []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };
    fetchLogs();
  }, []);

  const handleVerify = async () => {
    if (!qrCode.trim()) {
      toast.error('Ingresa un código QR');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await accessService.verifyAccess(qrCode); // Await the async result
      setVerificationResult(result);

      if (result.allowed) {
        toast.success(result.message);
        // Refresh logs after successful verification
        try {
          const logs = await accessService.getRecentLogs(15);
          setRecentLogs(Array.isArray(logs) ? logs : []);
        } catch (e) { }
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error('Error al verificar');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setQrCode('');
    setVerificationResult(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Acceso</h1>
        <p className="text-muted-foreground mt-1">
          Verificación de códigos QR en tiempo real
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verificar Acceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-code">Código QR</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-code"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="QR-CLIENT-000"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  className="flex-1"
                />
                <Button onClick={handleVerify} disabled={isVerifying}>
                  <MagnifyingGlass className="mr-2" size={20} />
                  {isVerifying ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Escanea o ingresa el código QR del cliente
              </p>
            </div>

            {verificationResult && (
              <div
                className={`p-6 rounded-lg border-2 ${verificationResult.allowed
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
                  }`}
              >
                <div className="flex items-start gap-4">
                  {verificationResult.allowed ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={48} weight="fill" />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0" size={48} weight="fill" />
                  )}

                  <div className="flex-1">
                    <h3
                      className={`text-xl font-bold mb-2 ${verificationResult.allowed ? 'text-green-900' : 'text-red-900'
                        }`}
                    >
                      {verificationResult.message}
                    </h3>

                    {verificationResult.client && (
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">{verificationResult.client.name}</p>
                        <div className="flex gap-2 items-center">
                          <Badge
                            variant={verificationResult.client.status === 'active' ? 'default' : 'destructive'}
                          >
                            {verificationResult.client.status === 'active' ? 'Activo' : 'Vencido'}
                          </Badge>
                          {verificationResult.client.membershipEnd && (
                            <span className="text-sm">
                              Vence:{' '}
                              {new Date(verificationResult.client.membershipEnd).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                        {verificationResult.client.membershipEnd && (
                          <p className="text-sm">
                            Días restantes: {getDaysRemaining(verificationResult.client.membershipEnd)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="w-full mt-4"
                >
                  Verificar Otro
                </Button>
              </div>
            )}

            {!verificationResult && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <QrCode className="mx-auto mb-3" size={48} weight="duotone" />
                <p className="font-semibold">Esperando código QR</p>
                <p className="text-sm mt-1">Ingresa el código para verificar acceso</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Accesos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay registros de acceso</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {log.result === 'ALLOWED' ? (
                        <CheckCircle className="text-green-600" size={20} weight="fill" />
                      ) : (
                        <XCircle className="text-red-600" size={20} weight="fill" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {log.clientName || `Cliente ${log.clientId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={log.result === 'ALLOWED' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {log.result === 'ALLOWED' ? 'OK' : 'Denegado'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
