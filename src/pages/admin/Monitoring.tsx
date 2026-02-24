import { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  ArrowsClockwise,
  Warning,
  Bug,
  Info,
  CaretDown,
  CaretUp,
  Copy,
  MagnifyingGlass,
  Trash,
} from '@phosphor-icons/react';
import { api } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LogStats {
  exists: boolean;
  size_bytes: number;
  size_human: string;
  modified_at: string | null;
  error_count: number;
  warning_count: number;
}

interface LogsResponse {
  entries: string[];
  total_lines: number;
  level: string;
  path?: string;
  message?: string;
}

function levelColor(line: string): string {
  if (line.includes('.ERROR:') || line.includes('.ERROR]')) return 'text-red-600 dark:text-red-400';
  if (line.includes('.WARNING:') || line.includes('.WARNING]')) return 'text-amber-600 dark:text-amber-400';
  if (line.includes('.INFO:') || line.includes('.INFO]')) return 'text-blue-600 dark:text-blue-400';
  if (line.includes('.DEBUG:') || line.includes('.DEBUG]')) return 'text-muted-foreground';
  return 'text-foreground';
}

function levelIcon(line: string) {
  if (line.includes('.ERROR:') || line.includes('.ERROR]')) return <Bug className="text-red-500 shrink-0" size={14} />;
  if (line.includes('.WARNING:') || line.includes('.WARNING]')) return <Warning className="text-amber-500 shrink-0" size={14} />;
  if (line.includes('.INFO:') || line.includes('.INFO]')) return <Info className="text-blue-500 shrink-0" size={14} />;
  return <Terminal className="text-muted-foreground shrink-0" size={14} />;
}

export function Monitoring() {
  const [entries, setEntries] = useState<string[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [lines, setLines] = useState(500);
  const [level, setLevel] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<LogStats>('/monitor/stats');
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.status === 403 ? 'No tienes permiso para ver el monitor.' : 'Error al cargar estadísticas.');
      setStats(null);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await api.get<LogsResponse>('/monitor/logs', {
        params: { lines, level: level === 'all' ? undefined : level },
      });
      setEntries(data.entries || []);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.status === 403 ? 'No tienes permiso para ver los logs.' : 'Error al cargar logs.');
      setEntries([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [lines, level]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchLogs()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchLogs();
  }, [lines, level]);

  const refresh = () => {
    fetchStats();
    fetchLogs();
    toast.success('Logs actualizados');
  };

  const filteredEntries = search.trim()
    ? entries.filter((line) => line.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const copyAll = () => {
    const text = filteredEntries.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Logs copiados al portapapeles');
  };

  const copyLine = (line: string) => {
    navigator.clipboard.writeText(line);
    toast.success('Línea copiada');
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      await api.delete('/monitor/logs');
      toast.success('Log de Laravel limpiado correctamente');
      setClearDialogOpen(false);
      fetchStats();
      fetchLogs();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Error al limpiar los logs');
    } finally {
      setClearing(false);
    }
  };

  if (loading && !stats && entries.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (error && !stats && entries.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Solo usuarios con rol Administrador pueden acceder al Monitor de logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal size={28} weight="duotone" />
            Monitor del sistema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Logs detallados de Laravel para verificar errores y depuración. Solo visible para administradores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loadingLogs}>
            <ArrowsClockwise size={18} className={loadingLogs ? 'animate-spin' : ''} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={loadingLogs || (stats && !stats.exists)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash size={18} />
            Limpiar logs
          </Button>
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar log de Laravel?</AlertDialogTitle>
            <AlertDialogDescription>
              Se vaciará por completo el archivo <code className="text-xs bg-muted px-1 rounded">laravel.log</code>.
              Esta acción no se puede deshacer. Los nuevos eventos seguirán escribiendo en el mismo archivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleClearLogs(); }}
              disabled={clearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearing ? 'Limpiando…' : 'Limpiar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen del log</CardTitle>
            <CardDescription>Archivo laravel.log</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Tamaño:</span>
              <Badge variant="secondary">{stats.size_human}</Badge>
            </div>
            {stats.modified_at && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Última modificación:</span>
                <span className="text-sm">{new Date(stats.modified_at).toLocaleString()}</span>
              </div>
            )}
            {stats.error_count > 0 && (
              <div className="flex items-center gap-2">
                <Bug size={16} className="text-red-500" />
                <Badge variant="destructive">{stats.error_count} errores</Badge>
              </div>
            )}
            {stats.warning_count > 0 && (
              <div className="flex items-center gap-2">
                <Warning size={16} className="text-amber-500" />
                <Badge variant="outline" className="text-amber-600 border-amber-500">
                  {stats.warning_count} advertencias
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex items-center justify-between w-full text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <CardTitle className="text-base flex items-center gap-2">
              {expanded ? <CaretDown size={20} /> : <CaretUp size={20} />}
              Logs ({filteredEntries.length} líneas)
            </CardTitle>
          </button>
          {expanded && (
            <CardDescription className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={String(lines)} onValueChange={(v) => setLines(Number(v))}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 líneas</SelectItem>
                    <SelectItem value="250">250 líneas</SelectItem>
                    <SelectItem value="500">500 líneas</SelectItem>
                    <SelectItem value="1000">1000 líneas</SelectItem>
                    <SelectItem value="2000">2000 líneas</SelectItem>
                    <SelectItem value="5000">5000 líneas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="error">Solo ERROR</SelectItem>
                    <SelectItem value="warning">Solo WARNING</SelectItem>
                    <SelectItem value="info">Solo INFO</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-[200px]">
                  <MagnifyingGlass
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    placeholder="Buscar en logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={copyAll}>
                  <Copy size={16} />
                  Copiar todo
                </Button>
              </div>
            </CardDescription>
          )}
        </CardHeader>
        {expanded && (
          <CardContent>
            {loadingLogs ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Cargando logs…</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {entries.length === 0 ? 'No hay líneas en el log o no se pudo leer.' : 'Ninguna línea coincide con la búsqueda.'}
              </div>
            ) : (
              <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto max-h-[70vh] overflow-y-auto font-mono">
                {filteredEntries.map((line, i) => (
                  <div
                    key={i}
                    className={cn('flex gap-2 py-0.5 hover:bg-muted/50 px-2 -mx-2 rounded group', levelColor(line))}
                  >
                    <span className="text-muted-foreground shrink-0 select-none w-6">{i + 1}</span>
                    {levelIcon(line)}
                    <span className="break-all flex-1">{line}</span>
                    <button
                      type="button"
                      onClick={() => copyLine(line)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted shrink-0"
                      aria-label="Copiar línea"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </pre>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
