import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { accessService } from '@/services/access.service';
import { formatDateTime, formatCurrency } from '@/utils/date';
import {
  Users,
  UserMinus,
  CurrencyDollar,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';

export function Dashboard() {
  const clients = useMemo(() => clientsService.getAll(), []);
  const payments = useMemo(() => membershipsService.getAllPayments(), []);
  const recentLogs = useMemo(() => accessService.getRecentLogs(10), []);

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const expiredClients = clients.filter((c) => c.status === 'expired').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const metrics = [
    {
      title: 'Miembros Activos',
      value: activeClients,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Miembros Vencidos',
      value: expiredClients,
      icon: UserMinus,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(monthlyRevenue),
      icon: CurrencyDollar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visión general de tu gimnasio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={metric.color} size={20} weight="bold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay check-ins registrados aún</p>
              <p className="text-sm mt-2">
                Los accesos aparecerán aquí cuando los clientes ingresen
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {log.result === 'ALLOWED' ? (
                      <CheckCircle className="text-green-600" size={24} weight="fill" />
                    ) : (
                      <XCircle className="text-red-600" size={24} weight="fill" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {log.clientName || `Cliente ${log.clientId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.result === 'ALLOWED' ? 'default' : 'destructive'}>
                    {log.result === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">¿Necesitas ayuda?</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona clientes, asigna membresías y controla accesos
              </p>
            </div>
            <Link to="/admin/clients">
              <Badge className="cursor-pointer hover:bg-primary/90">
                Ver Clientes →
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
