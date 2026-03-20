import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Funnel, MagnifyingGlass, XCircle } from '@phosphor-icons/react';
import { accessService } from '@/services/access.service';
import type { AccessLogRecord } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function Checkins() {
  const today = new Date().toISOString().slice(0, 10);
  const [logs, setLogs] = useState<AccessLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'allowed' | 'denied'>('all');
  const [method, setMethod] = useState<'all' | 'qr' | 'fingerprint'>('all');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [page, status, method, dateFrom, dateTo]);

  const loadLogs = async (options?: {
    search?: string;
    status?: 'allowed' | 'denied';
    verification_method?: 'qr' | 'fingerprint';
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }) => {
    const normalizedSearch = search.trim() || undefined;
    const normalizedDateFrom = dateFrom || undefined;
    const normalizedDateTo = dateTo || undefined;

    try {
      setIsLoading(true);
      const response = await accessService.getLogs({
        search: options?.search ?? normalizedSearch,
        status: options?.status ?? (status === 'all' ? undefined : status),
        verification_method: options?.verification_method ?? (method === 'all' ? undefined : method),
        date_from: options?.date_from ?? normalizedDateFrom,
        date_to: options?.date_to ?? normalizedDateTo,
        page: options?.page ?? page,
        per_page: options?.per_page ?? 15,
      });

      setLogs(response.data);
      setLastPage(response.last_page || 1);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('Error al cargar los check-ins');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadLogs({ page: 1, search: search.trim() || undefined });
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setMethod('all');
    setDateFrom(today);
    setDateTo(today);
    setPage(1);
    loadLogs({
      search: undefined,
      status: undefined,
      verification_method: undefined,
      date_from: today,
      date_to: today,
      page: 1,
      per_page: 15,
    });
  };

  const stats = useMemo(() => ({
    allowed: logs.filter((log) => log.status === 'allowed').length,
    denied: logs.filter((log) => log.status === 'denied').length,
  }), [logs]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-ins</h1>
        <p className="text-muted-foreground mt-1">
          Consulta ingresos al gimnasio por fecha, estado y método de verificación.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Registros</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardDescription>Permitidos</CardDescription>
            <CardTitle className="text-3xl text-green-700">{stats.allowed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardDescription>Denegados</CardDescription>
            <CardTitle className="text-3xl text-red-700">{stats.denied}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refina la búsqueda para ver el historial exacto de check-ins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar por cliente, correo, DPI o teléfono"
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} className="gap-2">
                <Funnel size={16} />
                Buscar
              </Button>
            </div>

            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />

            <div className="flex gap-2">
              <Select value={status} onValueChange={(value: 'all' | 'allowed' | 'denied') => { setStatus(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="allowed">Permitido</SelectItem>
                  <SelectItem value="denied">Denegado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={method} onValueChange={(value: 'all' | 'qr' | 'fingerprint') => { setMethod(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="qr">QR</SelectItem>
                  <SelectItem value="fingerprint">Huella</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearFilters}>Limpiar filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial De Check-ins</CardTitle>
          <CardDescription>Mostrando registros ordenados del más reciente al más antiguo.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.access_time), 'dd MMM yyyy, HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.client?.full_name || [log.client?.first_name, log.client?.last_name].filter(Boolean).join(' ') || `Cliente #${log.client_id}`}</p>
                          <p className="text-xs text-muted-foreground">{log.client?.email || log.client?.phone || log.client?.dni || 'Sin dato adicional'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.verification_method === 'fingerprint' ? 'Huella' : 'QR'}</Badge>
                      </TableCell>
                      <TableCell className="uppercase text-xs">{log.access_type}</TableCell>
                      <TableCell>
                        <Badge className={log.status === 'allowed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                          <span className="inline-flex items-center gap-1">
                            {log.status === 'allowed' ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
                            {log.status === 'allowed' ? 'Permitido' : 'Denegado'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))}

                  {!logs.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay check-ins que coincidan con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Página {page} de {lastPage}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                    Anterior
                  </Button>
                  <Button variant="outline" onClick={() => setPage((current) => Math.min(lastPage, current + 1))} disabled={page >= lastPage}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}