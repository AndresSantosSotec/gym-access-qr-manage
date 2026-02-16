import { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  ArrowsLeftRight,
  Package,
  CurrencyDollar,
  ArrowsClockwise as Rotation,
  CalendarBlank,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  Download,
  TrendUp,
  TrendDown,
  Warning,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  CaretDown,
  Funnel,
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import { api } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileXls, FilePdf } from '@phosphor-icons/react';

// ──────────────────────────────────────────────
// Download Utility
// ──────────────────────────────────────────────
async function downloadReport(endpoint: string, params: Record<string, any> = {}) {
  try {
    const response = await api.client.get(endpoint, {
      params,
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'reporte';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n;]*?)\1(;|$)/);
      if (match?.[2]) filename = match[2];
    } else {
      // Fallback: infer from endpoint
      const ext = endpoint.endsWith('/excel') ? '.xlsx' : '.pdf';
      filename = endpoint.split('/').slice(-2, -1)[0] + ext;
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Reporte descargado exitosamente');
  } catch (e) {
    toast.error('Error al descargar el reporte');
    console.error(e);
  }
}

function DownloadButtons({
  basePath,
  params = {},
}: {
  basePath: string;
  params?: Record<string, any>;
}) {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleDownload = async (format: 'excel' | 'pdf') => {
    const setLoading = format === 'excel' ? setLoadingExcel : setLoadingPdf;
    setLoading(true);
    await downloadReport(`/reports/${basePath}/${format}`, params);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleDownload('excel')}
        disabled={loadingExcel}
        className="gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
      >
        {loadingExcel ? <ArrowsClockwise size={14} className="animate-spin" /> : <FileXls size={16} weight="fill" />}
        Excel
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleDownload('pdf')}
        disabled={loadingPdf}
        className="gap-1.5 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        {loadingPdf ? <ArrowsClockwise size={14} className="animate-spin" /> : <FilePdf size={16} weight="fill" />}
        PDF
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 1: Inventario Disponible
// ──────────────────────────────────────────────
function TabInventarioDisponible() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteInventarioDisponible();
      setData(result);
    } catch (e) {
      toast.error('Error al cargar inventario disponible');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.productos) return [];
    return data.productos.filter((p: any) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.marca.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total Productos" value={data?.totales?.total_productos} icon={<Package size={20} weight="fill" />} color="blue" />
        <SummaryCard label="Total Unidades" value={data?.totales?.total_items?.toLocaleString()} icon={<Warehouse size={20} weight="fill" />} color="indigo" />
        <SummaryCard label="Valor (Costo)" value={`Q${data?.totales?.valor_total_costo?.toLocaleString()}`} icon={<CurrencyDollar size={20} weight="fill" />} color="amber" />
        <SummaryCard label="Valor (Venta)" value={`Q${data?.totales?.valor_total_venta?.toLocaleString()}`} icon={<TrendUp size={20} weight="fill" />} color="green" />
        <SummaryCard label="Sin Stock" value={data?.totales?.productos_sin_stock} icon={<XCircle size={20} weight="fill" />} color="red" />
        <SummaryCard label="Stock Bajo" value={data?.totales?.productos_stock_bajo} icon={<Warning size={20} weight="fill" />} color="orange" />
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Detalle de Inventario</CardTitle>
              <CardDescription>Fecha de consulta: {data?.fecha_consulta}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <DownloadButtons basePath="inventario-disponible" />
              <SearchInput value={search} onChange={setSearch} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead className="text-right">Valor Costo</TableHead>
                  <TableHead className="text-right">Valor Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell><Badge variant="outline">{p.marca}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        p.stock === 0 ? 'bg-red-500' : p.stock < 5 ? 'bg-amber-500' : 'bg-green-500'
                      )}>
                        {p.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">Q{Number(p.precio_compra).toFixed(2)}</TableCell>
                    <TableCell className="text-right">Q{Number(p.precio_venta).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">Q{Number(p.valor_costo).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">Q{Number(p.valor_venta).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={7} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 2: Movimientos de Inventario
// ──────────────────────────────────────────────
function TabMovimientosInventario() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteMovimientos(fechaInicio, fechaFin);
      setData(result);
    } catch (e) {
      toast.error('Error al cargar movimientos');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.movimientos) return [];
    return data.movimientos.filter((m: any) =>
      filterType === 'ALL' || m.tipo === filterType
    );
  }, [data, filterType]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total Movimientos" value={data?.resumen?.total_movimientos} icon={<ArrowsLeftRight size={20} weight="fill" />} color="blue" />
        <SummaryCard label="Ingresos" value={data?.resumen?.count_ingresos} icon={<ArrowUp size={20} weight="fill" />} color="green" />
        <SummaryCard label="Egresos" value={data?.resumen?.count_egresos} icon={<ArrowDown size={20} weight="fill" />} color="red" />
        <SummaryCard label="Uds. Ingresadas" value={data?.resumen?.total_ingresos?.toLocaleString()} icon={<TrendUp size={20} weight="fill" />} color="emerald" />
        <SummaryCard label="Uds. Egresadas" value={data?.resumen?.total_egresos?.toLocaleString()} icon={<TrendDown size={20} weight="fill" />} color="rose" />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Detalle de Movimientos</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">a</span>
              <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-40" />
              <Button size="sm" onClick={loadData} className="gap-1">
                <Funnel size={14} /> Filtrar
              </Button>
              <div className="flex gap-1 ml-2">
                {(['ALL', 'INGRESO', 'EGRESO'] as const).map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filterType === type ? 'default' : 'outline'}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "text-xs",
                      type === 'INGRESO' && filterType === type && 'bg-green-600',
                      type === 'EGRESO' && filterType === type && 'bg-red-600'
                    )}
                  >
                    {type === 'ALL' ? 'Todos' : type === 'INGRESO' ? 'Ingresos' : 'Egresos'}
                  </Button>
                ))}
              </div>
              <DownloadButtons basePath="movimientos-inventario" params={{ fecha_inicio: fechaInicio, fecha_fin: fechaFin }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{m.fecha}</TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1", m.tipo === 'INGRESO' ? 'bg-green-500' : 'bg-red-500')}>
                        {m.tipo === 'INGRESO' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{m.producto}</TableCell>
                    <TableCell className="text-center font-bold">{m.cantidad}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.motivo}</TableCell>
                    <TableCell className="text-xs">{m.referencia_id ? `#${m.referencia_id}` : '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={6} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 3: Catálogo de Productos y Servicios
// ──────────────────────────────────────────────
function TabCatalogoProductos() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  useEffect(() => {
    loadData();
  }, [soloActivos]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteCatalogo(soloActivos);
      setData(result);
    } catch (e) {
      toast.error('Error al cargar catálogo');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.productos) return [];
    return data.productos.filter((p: any) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.marca.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Productos" value={data?.resumen?.total_productos} icon={<Package size={20} weight="fill" />} color="blue" />
        <SummaryCard label="Activos" value={data?.resumen?.activos} icon={<CheckCircle size={20} weight="fill" />} color="green" />
        <SummaryCard label="Inactivos" value={data?.resumen?.inactivos} icon={<XCircle size={20} weight="fill" />} color="red" />
        <SummaryCard label="Margen Promedio" value={`${data?.resumen?.margen_promedio ?? 0}%`} icon={<TrendUp size={20} weight="fill" />} color="purple" />
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Catálogo Completo</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={soloActivos ? 'default' : 'outline'}
                onClick={() => setSoloActivos(!soloActivos)}
              >
                {soloActivos ? 'Solo Activos' : 'Todos'}
              </Button>
              <DownloadButtons basePath="catalogo-productos" />
              <SearchInput value={search} onChange={setSearch} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead className="text-center">Margen %</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell><Badge variant="outline">{p.marca}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{p.presentacion}</Badge></TableCell>
                    <TableCell className="text-right">Q{Number(p.precio_compra).toFixed(2)}</TableCell>
                    <TableCell className="text-right">Q{Number(p.precio_venta).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        p.margen >= 30 ? 'border-green-500 text-green-600' : p.margen >= 15 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'
                      )}>
                        {p.margen}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">{p.stock}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={p.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-red-500'}>
                        {p.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={8} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 4: Reporte de Valoración
// ──────────────────────────────────────────────
function TabValoracionInventario() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteValoracion(fechaInicio, fechaFin);
      setData(result);
    } catch (e) {
      toast.error('Error al cargar valoración');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;

  const totales = data?.totales ?? {};

  return (
    <div className="space-y-6">
      {/* Big Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Valor del Inventario (Costo)</p>
            <h2 className="text-3xl font-black text-blue-700">Q{Number(totales.valor_inventario_total ?? 0).toLocaleString()}</h2>
            <p className="text-xs text-muted-foreground mt-1">Capital invertido en stock actual</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Utilidad Bruta del Período</p>
            <h2 className="text-3xl font-black text-green-700">Q{Number(totales.utilidad_bruta_total ?? 0).toLocaleString()}</h2>
            <p className="text-xs text-muted-foreground mt-1">Ingreso {data?.fecha_inicio} - {data?.fecha_fin}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Margen Bruto Promedio</p>
            <h2 className="text-3xl font-black text-purple-700">{Number(totales.margen_bruto_promedio ?? 0).toFixed(1)}%</h2>
            <p className="text-xs text-muted-foreground mt-1">Rentabilidad promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Valor Venta Potencial" value={`Q${Number(totales.valor_venta_potencial_total ?? 0).toLocaleString()}`} icon={<TrendUp size={20} weight="fill" />} color="cyan" />
        <SummaryCard label="Utilidad Potencial" value={`Q${Number(totales.utilidad_potencial ?? 0).toLocaleString()}`} icon={<CurrencyDollar size={20} weight="fill" />} color="teal" />
        <SummaryCard label="Ingreso Ventas" value={`Q${Number(totales.ingreso_ventas_total ?? 0).toLocaleString()}`} icon={<ArrowUp size={20} weight="fill" />} color="green" />
        <SummaryCard label="Costo Ventas" value={`Q${Number(totales.costo_ventas_total ?? 0).toLocaleString()}`} icon={<ArrowDown size={20} weight="fill" />} color="red" />
      </div>

      {/* Date filter */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Valoración por Producto</CardTitle>
            <div className="flex items-center gap-2">
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">a</span>
              <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-40" />
              <Button size="sm" onClick={loadData} className="gap-1"><Funnel size={14} /> Filtrar</Button>
              <DownloadButtons basePath="valoracion-inventario" params={{ fecha_inicio: fechaInicio, fecha_fin: fechaFin }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Valor Inv.</TableHead>
                  <TableHead className="text-center">Vendido</TableHead>
                  <TableHead className="text-right">Ingreso Vta.</TableHead>
                  <TableHead className="text-right">Costo Vta.</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-center">Margen %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.productos ?? []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-center">{p.stock}</TableCell>
                    <TableCell className="text-right">Q{Number(p.valor_inventario).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-bold">{p.cantidad_vendida}</TableCell>
                    <TableCell className="text-right text-green-600">Q{Number(p.ingreso_ventas).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">Q{Number(p.costo_ventas).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={p.utilidad_bruta >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Q{Number(p.utilidad_bruta).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        p.margen_porcentaje >= 30 ? 'border-green-500 text-green-600' :
                          p.margen_porcentaje >= 10 ? 'border-amber-500 text-amber-600' :
                            'border-red-500 text-red-600'
                      )}>
                        {p.margen_porcentaje}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.productos ?? []).length === 0 && <EmptyRow colSpan={8} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 5: Reporte de Rotación
// ──────────────────────────────────────────────
function TabRotacionInventario() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteRotacion(fechaInicio, fechaFin);
      setData(result);
    } catch (e) {
      toast.error('Error al cargar rotación');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;

  const resumen = data?.resumen ?? {};
  const clasificacionColors: Record<string, string> = {
    'A': 'bg-green-500',
    'B': 'bg-amber-500',
    'C': 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      {/* ABC Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Alta Rotación (A)" value={resumen.productos_alta_rotacion} icon={<TrendUp size={20} weight="fill" />} color="green" />
        <SummaryCard label="Media Rotación (B)" value={resumen.productos_media_rotacion} icon={<ArrowsLeftRight size={20} weight="fill" />} color="amber" />
        <SummaryCard label="Baja Rotación (C)" value={resumen.productos_baja_rotacion} icon={<TrendDown size={20} weight="fill" />} color="red" />
        <SummaryCard label="Sin Movimiento" value={resumen.productos_sin_movimiento} icon={<Warning size={20} weight="fill" />} color="gray" />
      </div>

      {/* Top 5 Products */}
      {resumen.top_5_productos && resumen.top_5_productos.length > 0 && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg">🏆 Top 5 Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {resumen.top_5_productos.map((p: any, idx: number) => (
                <div key={p.id} className="bg-background rounded-xl p-4 border flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm",
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-muted-foreground'
                  )}>
                    {idx + 1}
                  </div>
                  <p className="font-bold text-sm line-clamp-2">{p.nombre}</p>
                  <p className="text-2xl font-black text-primary">{p.cantidad_vendida}</p>
                  <p className="text-xs text-muted-foreground">unidades vendidas</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Análisis de Rotación</CardTitle>
              <CardDescription>Período: {resumen.periodo_meses} meses</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">a</span>
              <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-40" />
              <Button size="sm" onClick={loadData} className="gap-1"><Funnel size={14} /> Filtrar</Button>
              <DownloadButtons basePath="rotacion-inventario" params={{ fecha_inicio: fechaInicio, fecha_fin: fechaFin }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Clasificación</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Vendido</TableHead>
                  <TableHead className="text-center">Vta./Mes</TableHead>
                  <TableHead className="text-center">Índ. Rotación</TableHead>
                  <TableHead className="text-center">Días Inv.</TableHead>
                  <TableHead className="text-right">Ingreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.productos ?? []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("w-7 justify-center", clasificacionColors[p.clasificacion])}>
                        {p.clasificacion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{p.stock_actual}</TableCell>
                    <TableCell className="text-center font-bold">{p.cantidad_vendida}</TableCell>
                    <TableCell className="text-center">{p.ventas_mensuales_promedio}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        p.indice_rotacion >= 3 ? 'border-green-500 text-green-600' :
                          p.indice_rotacion >= 1 ? 'border-amber-500 text-amber-600' :
                            'border-red-500 text-red-600'
                      )}>
                        {p.indice_rotacion}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        p.dias_inventario > 180 ? 'text-red-600' : p.dias_inventario > 60 ? 'text-amber-600' : 'text-green-600'
                      )}>
                        {p.dias_inventario >= 999 ? '∞' : `${p.dias_inventario}d`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">Q{Number(p.ingreso_total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {(data?.productos ?? []).length === 0 && <EmptyRow colSpan={8} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tab 6: Reporte Semestral Guatemala (Decreto 10-2012)
// ──────────────────────────────────────────────
function TabReporteSemestral() {
  const currentYear = new Date().getFullYear();
  const currentSemestre = new Date().getMonth() <= 5 ? 1 : 2;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anio, setAnio] = useState(currentYear);
  const [semestre, setSemestre] = useState(currentSemestre);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await commercialService.getReporteSemestral(anio, semestre);
      setData(result);
    } catch (e) {
      toast.error('Error al cargar reporte semestral');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;

  const totales = data?.totales ?? {};

  return (
    <div className="space-y-6">
      {/* Legal notice */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CalendarBlank size={24} className="text-blue-600 mt-0.5" weight="fill" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300">Reporte Semestral de Inventarios — Guatemala</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                <strong>Base Legal:</strong> {data?.base_legal}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                Período: <strong>{data?.periodo}</strong> • Fecha de corte: <strong>{data?.fecha_corte}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={anio.toString()} onValueChange={(v) => setAnio(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={semestre.toString()} onValueChange={(v) => setSemestre(parseInt(v))}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1er Semestre (Ene-Jun)</SelectItem>
            <SelectItem value="2">2do Semestre (Jul-Dic)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadData} className="gap-1">
          <ArrowsClockwise size={16} /> Generar Reporte
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Productos" value={totales.total_productos} icon={<Package size={20} weight="fill" />} color="blue" />
        <SummaryCard label="Total Unidades" value={totales.total_unidades?.toLocaleString()} icon={<Warehouse size={20} weight="fill" />} color="indigo" />
        <SummaryCard label="Valor Inventario" value={`Q${Number(totales.valor_inventario_total ?? 0).toLocaleString()}`} icon={<CurrencyDollar size={20} weight="fill" />} color="emerald" />
        <SummaryCard label="Ingresos Sem." value={totales.total_ingresos_semestre?.toLocaleString()} icon={<ArrowUp size={20} weight="fill" />} color="green" />
        <SummaryCard label="Egresos Sem." value={totales.total_egresos_semestre?.toLocaleString()} icon={<ArrowDown size={20} weight="fill" />} color="red" />
        <SummaryCard label="Ventas Sem." value={`Q${Number(totales.total_ventas_semestre ?? 0).toLocaleString()}`} icon={<TrendUp size={20} weight="fill" />} color="amber" />
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Inventario Físico Semestral</CardTitle>
              <CardDescription>Detalle de productos para el período fiscal</CardDescription>
            </div>
            <DownloadButtons basePath="reporte-semestral" params={{ anio, semestre }} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>No.</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="text-right">P. Compra</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Valor Inv.</TableHead>
                  <TableHead className="text-center">Ingresos</TableHead>
                  <TableHead className="text-center">Egresos</TableHead>
                  <TableHead className="text-center">Vendido</TableHead>
                  <TableHead className="text-right">Ventas Q</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.productos ?? []).map((p: any, idx: number) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell><Badge variant="outline">{p.marca}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{p.presentacion}</Badge></TableCell>
                    <TableCell className="text-right">Q{Number(p.precio_compra).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-bold">{p.stock_actual}</TableCell>
                    <TableCell className="text-right font-semibold">Q{Number(p.valor_inventario).toFixed(2)}</TableCell>
                    <TableCell className="text-center text-green-600">{p.ingresos_semestre}</TableCell>
                    <TableCell className="text-center text-red-600">{p.egresos_semestre}</TableCell>
                    <TableCell className="text-center">{p.unidades_vendidas}</TableCell>
                    <TableCell className="text-right font-bold text-primary">Q{Number(p.valor_ventas).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {(data?.productos ?? []).length === 0 && <EmptyRow colSpan={11} />}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ──────────────────────────────────────────────
// Shared Components
// ──────────────────────────────────────────────
function SummaryCard({ label, value, icon, color }: { label: string; value: any; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    green: 'bg-green-500/10 text-green-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    red: 'bg-red-500/10 text-red-600',
    rose: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-600',
    orange: 'bg-orange-500/10 text-orange-600',
    purple: 'bg-purple-500/10 text-purple-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
    teal: 'bg-teal-500/10 text-teal-600',
    gray: 'bg-gray-500/10 text-gray-600',
  };

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="pt-5 pb-4 px-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", colorMap[color] ?? colorMap.blue)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className="text-xl font-black leading-tight">{value ?? '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-64">
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      <Input
        className="pl-9 bg-accent/20 border-none"
        placeholder="Buscar..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3">
      <ArrowsClockwise className="animate-spin text-primary" size={32} />
      <p className="text-muted-foreground text-sm">Cargando reporte...</p>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
        No se encontraron datos para mostrar
      </TableCell>
    </TableRow>
  );
}

// ──────────────────────────────────────────────
// Main Reports Page
// ──────────────────────────────────────────────
export function Reports() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes Contables</h1>
        <p className="text-muted-foreground mt-1">
          Reportes de inventario, productos y análisis financiero
        </p>
      </div>

      <Tabs defaultValue="inventario-disponible" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1.5 bg-muted/80">
            <TabsTrigger value="inventario-disponible" className="gap-1.5 text-xs sm:text-sm">
              <Warehouse size={16} weight="fill" /> Inventario Disponible
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="gap-1.5 text-xs sm:text-sm">
              <ArrowsLeftRight size={16} weight="fill" /> Movimientos
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="gap-1.5 text-xs sm:text-sm">
              <Package size={16} weight="fill" /> Catálogo
            </TabsTrigger>
            <TabsTrigger value="valoracion" className="gap-1.5 text-xs sm:text-sm">
              <CurrencyDollar size={16} weight="fill" /> Valoración
            </TabsTrigger>
            <TabsTrigger value="rotacion" className="gap-1.5 text-xs sm:text-sm">
              <Rotation size={16} weight="fill" /> Rotación
            </TabsTrigger>
            <TabsTrigger value="semestral" className="gap-1.5 text-xs sm:text-sm">
              <CalendarBlank size={16} weight="fill" /> Semestral GT
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inventario-disponible" className="mt-4">
          <TabInventarioDisponible />
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4">
          <TabMovimientosInventario />
        </TabsContent>

        <TabsContent value="catalogo" className="mt-4">
          <TabCatalogoProductos />
        </TabsContent>

        <TabsContent value="valoracion" className="mt-4">
          <TabValoracionInventario />
        </TabsContent>

        <TabsContent value="rotacion" className="mt-4">
          <TabRotacionInventario />
        </TabsContent>

        <TabsContent value="semestral" className="mt-4">
          <TabReporteSemestral />
        </TabsContent>
      </Tabs>
    </div>
  );
}
