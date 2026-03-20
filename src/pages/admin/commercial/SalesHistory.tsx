import { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle,
    CalendarBlank,
    MagnifyingGlass,
    Eye,
    ArrowsClockwise,
    Plus,
    ArrowRight,
    CurrencyDollar,
    DownloadSimple,
    User,
    Printer,
    Receipt,
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import { receiptsService } from '@/services/receipts.service';
import type { SalesCashCutSummary, Venta } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function SalesHistory() {
    const today = new Date().toISOString().slice(0, 10);
    const [sales, setSales] = useState<Venta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Venta | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [cashCutFrom, setCashCutFrom] = useState(today);
    const [cashCutTo, setCashCutTo] = useState(today);
    const [cashCut, setCashCut] = useState<SalesCashCutSummary | null>(null);
    const [cashCutLoading, setCashCutLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingExcel, setDownloadingExcel] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadSales();
    }, []);

    useEffect(() => {
        loadCashCut();
    }, [cashCutFrom, cashCutTo]);

    const loadSales = async () => {
        try {
            setIsLoading(true);
            const data = await commercialService.getSales();
            setSales(data);
        } catch (error) {
            toast.error('Error al cargar historial de ventas');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCashCut = async () => {
        try {
            setCashCutLoading(true);
            const data = await commercialService.getSalesCashCut({
                from: cashCutFrom,
                to: cashCutTo,
            });
            setCashCut(data);
        } catch (error) {
            toast.error('Error al cargar el corte de caja');
            setCashCut(null);
        } finally {
            setCashCutLoading(false);
        }
    };

    const handleShowDetails = async (sale: Venta) => {
        try {
            const fullSale = await commercialService.getSale(sale.id);
            setSelectedSale(fullSale);
            setIsDetailsOpen(true);
        } catch (error) {
            toast.error('Error al cargar detalles');
        }
    };

    const handleConvertQuote = async (sale: Venta) => {
        if (!confirm(`¿Deseas facturar la cotización #${sale.id} por Q${Number(sale.total).toFixed(2)}?`)) return;

        try {
            const lookups = await commercialService.getLookups();
            const defaultPaymentMethodId = lookups.metodos_pago[0]?.id || 1;

            await commercialService.updateSale(sale.id, {
                estado: 'PAGADA',
                pagos: [{ metodo_pago_id: defaultPaymentMethodId, monto: sale.total }]
            });

            toast.success('Venta realizada con éxito');
            loadSales();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al procesar conversión');
        }
    };

    /** Preview receipt and open print dialog */
    const handlePrintReceipt = async (receiptId: number) => {
        try {
            setPreviewLoading(true);
            const html = await receiptsService.previewReceipt(receiptId);
            setPreviewHtml(html);
            setPreviewOpen(true);
        } catch {
            toast.error('Error al cargar el recibo');
        } finally {
            setPreviewLoading(false);
        }
    };

    /** Preview 80mm ticket and open print dialog */
    const handlePrintTicket = async (receiptId: number) => {
        try {
            setPreviewLoading(true);
            const html = await receiptsService.previewTicket(receiptId);
            setPreviewHtml(html);
            setPreviewOpen(true);
        } catch {
            toast.error('Error al cargar el ticket');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePrintWindow = () => {
        const win = window.open('', '', 'width=900,height=700');
        if (win) {
            win.document.write(previewHtml);
            win.document.close();
            setTimeout(() => win.print(), 300);
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    };

    const handleDownloadCashCutPdf = async () => {
        try {
            setDownloadingPdf(true);
            const blob = await commercialService.downloadSalesCashCutPdf({ from: cashCutFrom, to: cashCutTo });
            downloadBlob(blob, `corte-caja-ventas-${cashCutFrom}${cashCutFrom !== cashCutTo ? `_a_${cashCutTo}` : ''}.pdf`);
            toast.success('Reporte PDF descargado');
        } catch (error) {
            toast.error('Error al descargar PDF del corte de caja');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleDownloadCashCutExcel = async () => {
        try {
            setDownloadingExcel(true);
            const blob = await commercialService.downloadSalesCashCutExcel({ from: cashCutFrom, to: cashCutTo });
            downloadBlob(blob, `corte-caja-ventas-${cashCutFrom}${cashCutFrom !== cashCutTo ? `_a_${cashCutTo}` : ''}.xlsx`);
            toast.success('Reporte Excel descargado');
        } catch (error) {
            toast.error('Error al descargar Excel del corte de caja');
        } finally {
            setDownloadingExcel(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.id.toString().includes(searchTerm) ||
        s.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredSales.length;
    const lastPage = Math.max(1, Math.ceil(totalItems / perPage));
    const currentPage = Math.min(page, lastPage);
    const paginatedSales = filteredSales.slice((currentPage - 1) * perPage, currentPage * perPage);

    const stats = {
        totalSales: sales.filter(s => s.estado === 'PAGADA').reduce((acc, s) => acc + Number(s.total), 0),
        countSales: sales.filter(s => s.estado === 'PAGADA').length,
        countQuotes: sales.filter(s => s.estado === 'COTIZACION').length,
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ventas y Cotizaciones</h1>
                    <p className="text-muted-foreground">Administra el historial de transacciones comerciales.</p>
                </div>
                <Button onClick={() => navigate('/admin/ventas/pos')} className="gap-2 h-11 bg-primary hover:bg-primary/90">
                    <Plus size={20} weight="bold" />
                    Nueva Venta / POS
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary uppercase tracking-wider">Ventas Totales</p>
                                <h3 className="text-3xl font-black">Q{stats.totalSales.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <CurrencyDollar size={28} weight="fill" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-green-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Ordenes Pagadas</p>
                                <h3 className="text-3xl font-black">{stats.countSales}</h3>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-full text-green-600">
                                <CheckCircle size={28} weight="fill" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-amber-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Cotizaciones</p>
                                <h3 className="text-3xl font-black">{stats.countQuotes}</h3>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-full text-amber-600">
                                <FileText size={28} weight="fill" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Corte De Caja Comercial</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Consulta ventas pagadas por rango de fechas para cierre diario o semanal.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex items-center gap-2">
                                <CalendarBlank size={18} className="text-muted-foreground" />
                                <Input type="date" value={cashCutFrom} onChange={(e) => setCashCutFrom(e.target.value)} className="w-[160px]" />
                            </div>
                            <Input type="date" value={cashCutTo} onChange={(e) => setCashCutTo(e.target.value)} className="w-[160px]" />
                            <Button variant="outline" onClick={handleDownloadCashCutPdf} disabled={cashCutLoading || downloadingPdf} className="gap-2">
                                <DownloadSimple size={16} />
                                PDF
                            </Button>
                            <Button variant="outline" onClick={handleDownloadCashCutExcel} disabled={cashCutLoading || downloadingExcel} className="gap-2">
                                <DownloadSimple size={16} />
                                Excel
                            </Button>
                            <Button variant="outline" onClick={loadCashCut} disabled={cashCutLoading} className="gap-2">
                                <ArrowsClockwise size={16} className={cashCutLoading ? 'animate-spin' : ''} />
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-primary/10 shadow-none bg-primary/5">
                            <CardContent className="pt-6">
                                <p className="text-sm uppercase tracking-wider text-primary font-medium">Total Facturado</p>
                                <h3 className="text-3xl font-black mt-2">Q{Number(cashCut?.total_revenue || 0).toFixed(2)}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border border-green-500/10 shadow-none bg-green-500/5">
                            <CardContent className="pt-6">
                                <p className="text-sm uppercase tracking-wider text-green-700 font-medium">Ventas Pagadas</p>
                                <h3 className="text-3xl font-black mt-2">{cashCut?.count || 0}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border border-amber-500/10 shadow-none bg-amber-500/5">
                            <CardContent className="pt-6">
                                <p className="text-sm uppercase tracking-wider text-amber-700 font-medium">Productos Vendidos</p>
                                <h3 className="text-3xl font-black mt-2">{cashCut?.total_items || 0}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    {cashCutLoading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-base">Totales Por Método De Pago</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {cashCut?.by_method?.length ? cashCut.by_method.map((item) => (
                                        <div key={item.method} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                            <span className="font-medium">{item.method}</span>
                                            <span className="font-black text-primary">Q{Number(item.amount).toFixed(2)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-muted-foreground">No hay ventas pagadas en el rango seleccionado.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {cashCut?.top_products?.length ? cashCut.top_products.map((item) => (
                                        <div key={item.product_id} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-4">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.quantity} unidades</p>
                                            </div>
                                            <span className="font-black">Q{Number(item.amount).toFixed(2)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-muted-foreground">Aún no hay productos vendidos en el rango seleccionado.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {!cashCutLoading && !!cashCut?.daily_totals?.length && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resumen Diario</h3>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {cashCut.daily_totals.map((day) => (
                                    <div key={day.date} className="rounded-xl border bg-accent/20 p-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{format(new Date(`${day.date}T00:00:00`), 'dd MMM yyyy', { locale: es })}</p>
                                        <p className="text-2xl font-black mt-2">Q{Number(day.amount).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{day.count} ventas pagadas</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Transacciones Recientes</CardTitle>
                        <div className="relative w-72">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input
                                className="pl-9 bg-accent/20 border-none"
                                placeholder="Buscar por ID o Cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Orden</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Recibo</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>No. Orden</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Recibo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedSales.map((sale) => (
                                    <TableRow key={sale.id} className="group transition-colors">
                                        <TableCell className="font-mono font-bold"># {String(sale.id).padStart(5, '0')}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-muted-foreground" />
                                                <span className="font-medium">{sale.cliente?.nombre || 'Consumidor Final'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-primary">
                                            Q{Number(sale.total).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-full px-3",
                                                sale.estado === 'PAGADA' && "bg-green-500 hover:bg-green-600",
                                                sale.estado === 'PENDIENTE' && "bg-amber-500 hover:bg-amber-600",
                                                sale.estado === 'COTIZACION' && "bg-blue-500 hover:bg-blue-600"
                                            )}>
                                                {sale.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {sale.receipt ? (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        title="Ver / Imprimir Recibo A4"
                                                        onClick={() => handlePrintReceipt(sale.receipt!.id)}
                                                    >
                                                        <Receipt size={16} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        title="Imprimir Ticket 80mm"
                                                        onClick={() => handlePrintTicket(sale.receipt!.id)}
                                                    >
                                                        <Printer size={16} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="gap-2 h-8"
                                                    onClick={() => handleShowDetails(sale)}
                                                >
                                                    <Eye size={16} />
                                                    Ver
                                                </Button>
                                                {sale.estado === 'COTIZACION' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                                                        onClick={() => handleConvertQuote(sale)}
                                                    >
                                                        <ArrowRight size={16} weight="bold" />
                                                        Facturar
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ))}
                                {paginatedSales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            No se encontraron transacciones
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t mt-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Filas por página</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[95px]">
                                    <SelectValue placeholder="Filas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">
                                {totalItems === 0
                                    ? '0 resultados'
                                    : `Mostrando ${(currentPage - 1) * perPage + 1} a ${Math.min(currentPage * perPage, totalItems)} de ${totalItems} resultados`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Página {currentPage} de {lastPage}</span>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                                ‹
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={currentPage >= lastPage} onClick={() => setPage((value) => Math.min(lastPage, value + 1))}>
                                ›
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Vista Previa del Comprobante</DialogTitle>
                        <DialogDescription>Revisa el comprobante antes de imprimir.</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 mb-4">
                        <Button onClick={handlePrintWindow} disabled={previewLoading}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cerrar</Button>
                    </div>
                    {previewLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Cargando comprobante...</div>
                    ) : (
                        <div
                            className="border rounded-lg p-4 bg-white"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                            Orden # {selectedSale && String(selectedSale.id).padStart(5, '0')}
                        </DialogTitle>
                        <DialogDescription>
                            Detalles de la transacción y desglose de productos.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSale && (
                        <div className="mt-4 space-y-6">
                            <div className="grid grid-cols-2 gap-8 text-sm border-b pb-6">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground font-semibold uppercase text-[10px]">Información del Cliente</p>
                                    <p className="font-bold text-lg">{selectedSale.cliente?.nombre || 'Consumidor Final'}</p>
                                    <p className="text-muted-foreground">{selectedSale.cliente?.telefono || 'Sin teléfono'}</p>
                                    <p className="text-muted-foreground">{selectedSale.cliente?.nit || 'CF'}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-muted-foreground font-semibold uppercase text-[10px]">Fecha de Emisión</p>
                                    <p className="font-bold">{format(new Date(selectedSale.created_at), 'PPPP', { locale: es })}</p>
                                    <p className="text-muted-foreground">{format(new Date(selectedSale.created_at), 'HH:mm')}</p>
                                    <Badge className={cn(
                                        "mt-2",
                                        selectedSale.estado === 'PAGADA' ? "bg-green-500" : "bg-blue-500"
                                    )}>
                                        {selectedSale.estado}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-muted-foreground font-semibold uppercase text-[10px] tracking-widest">Resumen de Orden</p>
                                <div className="bg-accent/20 rounded-xl overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-accent/30">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead>Precio U.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSale.detalles?.map((detalle) => (
                                                <TableRow key={detalle.id} className="border-accent/10">
                                                    <TableCell className="font-medium">{detalle.producto?.nombre}</TableCell>
                                                    <TableCell className="text-center font-bold">{detalle.cantidad}</TableCell>
                                                    <TableCell>Q{Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-black">Q{Number(detalle.subtotal).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>Q{Number(selectedSale.total).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Descuento</span>
                                        <span>Q0.00</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black pt-2 border-t border-primary/20">
                                        <span>TOTAL</span>
                                        <span className="text-primary tracking-tighter uppercase">Q{Number(selectedSale.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedSale.pagos && selectedSale.pagos.length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="text-muted-foreground font-semibold uppercase text-[10px] mb-2">Historial de Pagos</p>
                                    <div className="flex gap-4 flex-wrap">
                                        {selectedSale.pagos.map(p => (
                                            <div key={p.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    <CheckCircle weight="bold" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-green-700">{p.metodo_pago?.nombre}</p>
                                                    <p className="text-lg font-black text-green-900">Q{Number(p.monto).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
