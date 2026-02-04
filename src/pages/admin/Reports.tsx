import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartBar, TrendUp, Users, Money, Calendar } from '@phosphor-icons/react';

export function Reports() {
  const mockData = {
    totalRevenue: 45650,
    monthlyGrowth: 12.5,
    activeMembers: 234,
    retention: 87.3,
    avgMonthlyRevenue: [3200, 3800, 4100, 3900, 4500, 4800],
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Dashboard avanzado de métricas y estadísticas
        </p>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <ChartBar size={24} className="text-purple-600 mt-1" weight="fill" />
            <div>
              <CardTitle className="text-purple-900">Funcionalidad Planificada</CardTitle>
              <CardDescription className="text-purple-700">
                Dashboard de analytics con datos en tiempo real (actualmente mostrando datos demo)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Ingresos Totales</CardDescription>
              <Money size={20} className="text-green-600" weight="fill" />
            </div>
            <CardTitle className="text-3xl text-green-600">
              Q{mockData.totalRevenue.toLocaleString()}
            </CardTitle>
            <Badge variant="default" className="w-fit mt-2">
              <TrendUp size={14} weight="fill" /> +{mockData.monthlyGrowth}%
            </Badge>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Miembros Activos</CardDescription>
              <Users size={20} className="text-blue-600" weight="fill" />
            </div>
            <CardTitle className="text-3xl text-blue-600">
              {mockData.activeMembers}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">234 activos / 267 total</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Tasa de Retención</CardDescription>
              <TrendUp size={20} className="text-purple-600" weight="fill" />
            </div>
            <CardTitle className="text-3xl text-purple-600">
              {mockData.retention}%
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Últimos 6 meses</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Promedio Mensual</CardDescription>
              <Calendar size={20} className="text-orange-600" weight="fill" />
            </div>
            <CardTitle className="text-3xl text-orange-600">
              Q{Math.round(mockData.totalRevenue / 6).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Últimos 6 meses</p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Últimos 6 meses (datos demo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-2">
              {mockData.avgMonthlyRevenue.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${(value / 5000) * 100}%` }}
                  />
                  <span className="text-xs mt-2 text-muted-foreground">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'][idx]}
                  </span>
                  <span className="text-xs font-medium">Q{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas Clave (KPIs)</CardTitle>
            <CardDescription>Indicadores de rendimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Nuevos Miembros (mes)', value: '28', trend: '+12%', color: 'green' },
              { label: 'Cancelaciones (mes)', value: '7', trend: '-3%', color: 'red' },
              { label: 'Asistencia Promedio Diaria', value: '156', trend: '+8%', color: 'blue' },
              { label: 'Renovaciones Pendientes', value: '34', trend: '', color: 'yellow' },
              { label: 'Valor Promedio por Cliente', value: 'Q195', trend: '+5%', color: 'purple' },
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">{metric.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{metric.value}</span>
                  {metric.trend && (
                    <Badge variant={metric.trend.startsWith('+') ? 'default' : 'destructive'}>
                      {metric.trend}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Funcionalidades Futuras</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• Gráficos interactivos con Recharts o D3</li>
            <li>• Exportación a PDF/Excel de reportes</li>
            <li>• Filtros por rango de fechas personalizados</li>
            <li>• Comparativas año vs año, mes vs mes</li>
            <li>• Reportes de asistencia por horarios</li>
            <li>• Análisis de productos/servicios más vendidos</li>
            <li>• Predicciones y tendencias con ML</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
