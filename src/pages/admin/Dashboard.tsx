import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { can } from '@/services/permissions';
import type { PermissionKey } from '@/types/models';

export function Dashboard() {
  const { auth } = useAuth();
  const userName = auth?.user?.name || 'Usuario';

  const [clients, setClients] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, paymentsData, logsData] = await Promise.all([
          clientsService.getAll(),
          membershipsService.getAllPayments(),
          accessService.getRecentLogs(10)
        ]);
        setClients(clientsData || []);
        setPayments(paymentsData || []);
        setRecentLogs(logsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Define the raw metrics config
  const rawMetrics = useMemo(() => [
    {
      title: 'Miembros Activos',
      value: (clients || []).filter((c) => c.status === 'ACTIVE').length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      permission: 'CLIENTS_VIEW' as PermissionKey,
    },
    {
      title: 'Miembros Inactivos',
      value: (clients || []).filter((c) => c.status === 'INACTIVE' || c.status === 'SUSPENDED').length,
      icon: UserMinus,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      permission: 'CLIENTS_VIEW' as PermissionKey,
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(
        Array.isArray(payments) ? payments
          .filter((p) => {
            try {
              const paymentDate = new Date(p.createdAt);
              const currentMonth = new Date().getMonth();
              const currentYear = new Date().getFullYear();
              return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            } catch (e) { return false; }
          })
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
          : 0
      ),
      icon: CurrencyDollar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      permission: 'PAYMENTS_VIEW' as PermissionKey,
    },
  ], [clients, payments]);

  const [visibleMetrics, setVisibleMetrics] = useState<any[]>([]);

  // Filter metrics based on permissions
  useEffect(() => {
    const filterMetrics = async () => {
      const filtered = await Promise.all(rawMetrics.map(async (m) => {
        if (!m.permission) return m;
        return (await can(m.permission)) ? m : null;
      }));
      setVisibleMetrics(filtered.filter(Boolean));
    };
    filterMetrics();
  }, [rawMetrics]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido de nuevo, <span className="text-primary">{userName}</span>! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Aquí tienes el resumen de hoy en <span className="font-semibold text-foreground">GymFlow</span>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {visibleMetrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-md transition-shadow border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
