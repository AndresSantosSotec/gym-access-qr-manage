import { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle,
    MagnifyingGlass,
    Eye,
    ArrowsClockwise,
    Plus,
    ArrowRight,
    CurrencyDollar,
    User
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import type { Venta } from '@/types/models';
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

export function SalesHistory() {
    const [sales, setSales] = useState<Venta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<Venta | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadSales();
    }, []);

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

    const filteredSales = sales.filter(s =>
        s.id.toString().includes(searchTerm) ||
        s.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <div className="h-40 flex items-center justify-center">
                            <ArrowsClockwise className="animate-spin text-primary mr-2" size={24} />
                            Cargando transacciones...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>No. Orden</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSales.map((sale) => (
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
                                {filteredSales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            No se encontraron transacciones
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
