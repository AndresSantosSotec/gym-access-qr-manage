import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { clientsService } from '@/services/clients.service';
import { formatDateTime } from '@/utils/date';
import { Fingerprint, Eye, CheckCircle, XCircle } from '@phosphor-icons/react';

export function Fingerprints() {
  const clients = useMemo(() => clientsService.getAll(), []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const withFingerprint = clients.filter(c => c.fingerprintId).length;
  const withoutFingerprint = clients.length - withFingerprint;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Huellas Digitales</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de registros biométricos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} weight="fill" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Con Huella Registrada
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withFingerprint}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-600" size={24} weight="fill" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sin Huella
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withoutFingerprint}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Fingerprint className="mx-auto mb-4 text-muted-foreground/50" size={48} />
              <p className="font-semibold">No hay clientes registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Foto</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Huella</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Fecha Registro</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {client.profilePhoto ? (
                          <img
                            src={client.profilePhoto}
                            alt={client.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                            {getInitials(client.name)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {client.fingerprintId ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="mr-1" size={14} weight="fill" />
                            Registrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="mr-1" size={14} weight="fill" />
                            Sin huella
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {client.fingerprintRegisteredAt ? formatDateTime(client.fingerprintRegisteredAt) : '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2" size={16} />
                            Ver Cliente
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
