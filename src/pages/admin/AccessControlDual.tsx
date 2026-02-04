import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { accessService } from '@/services/access.service';
import { formatDate } from '@/utils/date';
import { QrCode, Fingerprint, CheckCircle, XCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { AccessLog, Client } from '@/types/models';

export function AccessControl() {
  const [qrCode, setQrCode] = useState('');
  const [fingerprintId, setFingerprintId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>(accessService.getRecentLogs(20));
  const [lastVerifiedClient, setLastVerifiedClient] = useState<Client | null>(null);
  const [lastResult, setLastResult] = useState<'ALLOWED' | 'DENIED' | null>(null);

  const handleVerifyQR = async () => {
    if (!qrCode.trim()) {
      toast.error('Ingresa un código QR');
      return;
    }

    setIsVerifying(true);
    setLastVerifiedClient(null);
    setLastResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = accessService.verifyAccessByQR(qrCode);
      
      if (result.client) {
        setLastVerifiedClient(result.client);
        if (result.allowed) {
          toast.success(`✓ Acceso permitido: ${result.client.name}`, {
            description: result.client.membershipEnd ? `Membresía válida hasta ${formatDate(result.client.membershipEnd)}` : '',
          });
          setLastResult('ALLOWED');
        } else {
          toast.error(`✗ Acceso denegado: ${result.client.name}`, {
            description: result.message,
          });
          setLastResult('DENIED');
        }
      } else {
        toast.error(result.message);
        setLastResult('DENIED');
      }
      
      setQrCode('');
      setRecentLogs(accessService.getRecentLogs(20));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyFingerprint = async () => {
    if (!fingerprintId.trim()) {
      toast.error('Ingresa un ID de huella');
      return;
    }

    setIsVerifying(true);
    setLastVerifiedClient(null);
    setLastResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = accessService.verifyAccessByFingerprint(fingerprintId);
      
      if (result.client) {
        setLastVerifiedClient(result.client);
        if (result.allowed) {
          toast.success(`✓ Acceso permitido: ${result.client.name}`, {
            description: result.client.membershipEnd ? `Membresía válida hasta ${formatDate(result.client.membershipEnd)}` : '',
          });
          setLastResult('ALLOWED');
        } else {
          toast.error(`✗ Acceso denegado: ${result.client.name}`, {
            description: result.message,
          });
          setLastResult('DENIED');
        }
      } else {
        toast.error(result.message);
        setLastResult('DENIED');
      }
      
      setFingerprintId('');
      setRecentLogs(accessService.getRecentLogs(20));
    } finally {
      setIsVerifying(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Acceso</h1>
        <p className="text-muted-foreground">
          Verifica el acceso mediante QR o Huella Digital
        </p>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="qr">
            <QrCode size={20} className="mr-2" />
            Código QR
          </TabsTrigger>
          <TabsTrigger value="fingerprint">
            <Fingerprint size={20} className="mr-2" />
            Huella Digital
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div className="space-y-6">
            <TabsContent value="qr" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <QrCode size={24} className="text-primary" weight="bold" />
                    </div>
                    <div>
                      <CardTitle>Verificar por QR</CardTitle>
                      <CardDescription>Escanea o ingresa el código</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="qr-code">Código QR</Label>
                    <Input
                      id="qr-code"
                      placeholder="QR-CLIENT-000123"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyQR()}
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyQR}
                    disabled={isVerifying}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <MagnifyingGlass size={20} className="mr-2 animate-pulse" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <QrCode size={20} className="mr-2" weight="bold" />
                        Verificar Acceso
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fingerprint" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Fingerprint size={24} className="text-primary" weight="bold" />
                    </div>
                    <div>
                      <CardTitle>Verificar por Huella</CardTitle>
                      <CardDescription>Ingresa el ID de huella (demo)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fingerprint-id">ID de Huella</Label>
                    <Input
                      id="fingerprint-id"
                      placeholder="FP-1234567890-abc"
                      value={fingerprintId}
                      onChange={(e) => setFingerprintId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyFingerprint()}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      En producción, este campo se llenaría automáticamente con el sensor biométrico
                    </p>
                  </div>

                  <Button 
                    onClick={handleVerifyFingerprint}
                    disabled={isVerifying}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <MagnifyingGlass size={20} className="mr-2 animate-pulse" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Fingerprint size={20} className="mr-2" weight="bold" />
                        Verificar Huella
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {lastVerifiedClient && lastResult && (
              <Card className={lastResult === 'ALLOWED' ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      {lastVerifiedClient.profilePhoto ? (
                        <AvatarImage src={lastVerifiedClient.profilePhoto} />
                      ) : (
                        <AvatarFallback className="text-lg">
                          {getInitials(lastVerifiedClient.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{lastVerifiedClient.name}</h3>
                          <p className="text-sm text-muted-foreground">{lastVerifiedClient.phone}</p>
                        </div>
                        {lastResult === 'ALLOWED' ? (
                          <CheckCircle size={32} className="text-green-600" weight="fill" />
                        ) : (
                          <XCircle size={32} className="text-red-600" weight="fill" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Estado:</span>
                          <Badge variant={lastVerifiedClient.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {lastVerifiedClient.status}
                          </Badge>
                        </div>
                        {lastVerifiedClient.membershipEnd && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Vence:</span>
                            <span className="text-sm font-medium">
                              {formatDate(lastVerifiedClient.membershipEnd)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`mt-4 p-3 rounded-lg text-center font-bold text-lg ${
                        lastResult === 'ALLOWED' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {lastResult === 'ALLOWED' ? '✓ ACCESO PERMITIDO' : '✗ ACCESO DENEGADO'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos Accesos</CardTitle>
              <CardDescription>Registro de verificaciones recientes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay registros de acceso aún
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {log.result === 'ALLOWED' ? (
                          <CheckCircle size={24} className="text-green-600" weight="fill" />
                        ) : (
                          <XCircle size={24} className="text-red-600" weight="fill" />
                        )}
                        <div>
                          <p className="font-medium">{log.clientName || 'Cliente desconocido'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(log.createdAt)}</span>
                            <span>•</span>
                            {log.method === 'QR' ? (
                              <span className="flex items-center gap-1">
                                <QrCode size={12} />
                                QR
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Fingerprint size={12} />
                                Huella
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Historial Completo</CardTitle>
          <CardDescription>Todos los registros de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay registros
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.clientName || 'Cliente desconocido'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.method === 'QR' ? (
                          <span className="flex items-center gap-1">
                            <QrCode size={14} />
                            QR
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Fingerprint size={14} />
                            Huella
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(log.createdAt)}</TableCell>
                    <TableCell>
                      {log.result === 'ALLOWED' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} weight="fill" />
                          <span className="font-medium">Permitido</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle size={20} weight="fill" />
                          <span className="font-medium">Denegado</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
