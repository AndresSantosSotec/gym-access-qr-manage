import { useState, useEffect } from 'react';
import {
    Warehouse,
    ArrowUp,
    ArrowDown,
    ArrowsLeftRight,
    MagnifyingGlass,
    Plus,
    ClockCounterClockwise,
    Package
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import type { Producto, MovimientoInventario } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function Inventory() {
    const [products, setProducts] = useState<Producto[]>([]);
    const [movements, setMovements] = useState<MovimientoInventario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'INGRESO' | 'EGRESO'>('ALL');

    const [adjustment, setAdjustment] = useState({
        producto_id: 0,
        tipo: 'INGRESO' as 'INGRESO' | 'EGRESO',
        cantidad: 1,
        motivo: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [prods, moves] = await Promise.all([
                commercialService.getProducts(),
                commercialService.getMovements()
            ]);
            setProducts(prods);
            setMovements(moves);
        } catch (error) {
            toast.error('Error al cargar datos de inventario');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdjustment = async () => {
        if (adjustment.producto_id === 0) {
            toast.error('Selecciona un producto');
            return;
        }
        if (!adjustment.motivo) {
            toast.error('Ingresa un motivo');
            return;
        }

        try {
            await commercialService.createMovement(adjustment);
            toast.success('Ajuste de inventario registrado');
            setIsModalOpen(false);
            setAdjustment({ producto_id: 0, tipo: 'INGRESO', cantidad: 1, motivo: '' });
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al realizar el ajuste');
        }
    };

    const filteredMovements = movements.filter(m =>
        filterType === 'ALL' || m.tipo === filterType
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-muted-foreground">Historial de movimientos y ajustes de stock.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <ArrowsLeftRight size={20} />
                    Ajuste Manual
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 mb-2">
                                <Warehouse size={28} weight="fill" />
                            </div>
                            <p className="text-sm text-muted-foreground">Total Stock</p>
                            <h3 className="text-2xl font-bold">
                                {products.reduce((acc, p) => acc + p.stock, 0)}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-600 mb-2">
                                <ArrowUp size={28} weight="fill" />
                            </div>
                            <p className="text-sm text-muted-foreground">Ingresos (30d)</p>
                            <h3 className="text-2xl font-bold">
                                {movements.filter(m => m.tipo === 'INGRESO').length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-600 mb-2">
                                <ArrowDown size={28} weight="fill" />
                            </div>
                            <p className="text-sm text-muted-foreground">Egresos (30d)</p>
                            <h3 className="text-2xl font-bold">
                                {movements.filter(m => m.tipo === 'EGRESO').length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 mb-2">
                                <ClockCounterClockwise size={28} weight="fill" />
                            </div>
                            <p className="text-sm text-muted-foreground">Último Mov.</p>
                            <h3 className="text-sm font-bold">
                                {movements.length > 0
                                    ? format(new Date(movements[0].created_at), 'dd MMM, HH:mm', { locale: es })
                                    : '--'}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Movimientos Recientes</CardTitle>
                            <CardDescription>Registro cronológico de entradas y salidas.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterType === 'ALL' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterType('ALL')}
                            >
                                Todos
                            </Button>
                            <Button
                                variant={filterType === 'INGRESO' ? 'default' : 'outline'}
                                size="sm"
                                className="text-green-600"
                                onClick={() => setFilterType('INGRESO')}
                            >
                                Ingresos
                            </Button>
                            <Button
                                variant={filterType === 'EGRESO' ? 'default' : 'outline'}
                                size="sm"
                                className="text-red-600"
                                onClick={() => setFilterType('EGRESO')}
                            >
                                Egresos
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cant.</TableHead>
                                    <TableHead>Motivo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cant.</TableHead>
                                    <TableHead>Motivo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMovements.map((move) => (
                                    <TableRow key={move.id}>
                                        <TableCell className="text-xs">
                                            {format(new Date(move.created_at), "dd/MM/yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={move.tipo === 'INGRESO' ? 'secondary' : 'destructive'} className="gap-1">
                                                {move.tipo === 'INGRESO' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                {move.tipo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {move.producto?.nombre || 'Producto no encontrado'}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {move.cantidad}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {move.motivo}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredMovements.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No hay movimientos registrados
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste Manual de Inventario</DialogTitle>
                        <DialogDescription>
                            Usa esta opción para correcciones manuales o ingresos de mercadería.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Producto</Label>
                            <Select onValueChange={(val) => setAdjustment({ ...adjustment, producto_id: parseInt(val) })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nombre} (Stock actual: {p.stock})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipo de Ajuste</Label>
                                <Select
                                    value={adjustment.tipo}
                                    onValueChange={(val: any) => setAdjustment({ ...adjustment, tipo: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INGRESO">Ingreso (+)</SelectItem>
                                        <SelectItem value="EGRESO">Egreso (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={adjustment.cantidad}
                                    onChange={(e) => setAdjustment({ ...adjustment, cantidad: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Motivo / Comentario</Label>
                            <Input
                                placeholder="Ej: Ingreso de mercadería Gatorade"
                                value={adjustment.motivo}
                                onChange={(e) => setAdjustment({ ...adjustment, motivo: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAdjustment}>Procesar Ajuste</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
