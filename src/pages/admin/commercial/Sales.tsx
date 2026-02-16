import { useState, useEffect } from 'react';
import {
    ShoppingCart,
    UserPlus,
    MagnifyingGlass,
    Plus,
    Minus,
    Trash,
    FileText,
    CreditCard,
    X
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import type { Producto, ClienteVenta, MetodoPago } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

interface CartItem {
    id: number;
    nombre: string;
    precio_venta: number;
    cantidad: number;
}

export function Sales() {
    const [products, setProducts] = useState<Producto[]>([]);
    const [clients, setClients] = useState<ClienteVenta[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<MetodoPago[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [saleType, setSaleType] = useState<'PAGADA' | 'COTIZACION'>('PAGADA');
    const [payments, setPayments] = useState<{ metodo_pago_id: number; monto: number }[]>([]);

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    const [newClient, setNewClient] = useState({
        nombre: '',
        nit: '',
        ciudad: 'Ciudad de Guatemala',
        telefono: '',
        correo: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [prods, cls, lookups] = await Promise.all([
                commercialService.getProducts(),
                commercialService.getSalesClients(),
                commercialService.getLookups()
            ]);
            setProducts(prods);
            setClients(cls);
            setPaymentMethods(lookups.metodos_pago);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (product: Producto) => {
        if (product.stock <= 0 && saleType === 'PAGADA') {
            toast.error('Producto sin stock');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prev, { id: product.id, nombre: product.nombre, precio_venta: product.precio_venta, cantidad: 1 }];
        });
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

    const handleCreateClient = async () => {
        try {
            const created = await commercialService.createSalesClient(newClient);
            setClients([...clients, created]);
            setSelectedClientId(created.id);
            setIsClientModalOpen(false);
            setNewClient({ nombre: '', nit: '', ciudad: 'Ciudad de Guatemala', telefono: '', correo: '' });
            toast.success('Cliente registrado');
        } catch (error) {
            toast.error('Error al registrar cliente');
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        if (saleType === 'PAGADA') {
            const paidTotal = payments.reduce((acc, p) => acc + (p.monto || 0), 0);
            if (Math.abs(paidTotal - subtotal) > 0.01) {
                toast.error('El monto pagado no coincide con el total');
                return;
            }
        }

        try {
            const payload = {
                cliente_venta_id: selectedClientId,
                estado: saleType,
                detalles: cart.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
                pagos: saleType === 'PAGADA' ? payments : []
            };

            await commercialService.createSale(payload);
            toast.success(saleType === 'PAGADA' ? 'Venta realizada con éxito' : 'Cotización guardada');

            setCart([]);
            setSelectedClientId(null);
            setPayments([]);
            setIsCheckoutModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al procesar la venta');
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-80px)] p-4 flex gap-4 overflow-hidden">
            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <Card className="flex-1 flex flex-col bg-accent/20 border-none shadow-none overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <Input
                                    className="pl-10 h-12 bg-background border-none shadow-sm text-lg"
                                    placeholder="Escribe el nombre del producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={saleType === 'PAGADA' ? 'default' : 'outline'}
                                    onClick={() => setSaleType('PAGADA')}
                                    className="gap-2 h-12"
                                >
                                    <ShoppingCart size={20} weight="fill" />
                                    Venta
                                </Button>
                                <Button
                                    variant={saleType === 'COTIZACION' ? 'default' : 'outline'}
                                    onClick={() => setSaleType('COTIZACION')}
                                    className="gap-2 h-12"
                                >
                                    <FileText size={20} weight="fill" />
                                    Cotizar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 pt-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0 && saleType === 'PAGADA'}
                                    className={cn(
                                        "group relative flex flex-col text-left p-4 rounded-xl border bg-background hover:border-primary hover:shadow-md transition-all",
                                        product.stock <= 0 && saleType === 'PAGADA' && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="mb-2">
                                        <Badge variant="outline" className="mb-1">{product.marca?.nombre || 'General'}</Badge>
                                        <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{product.nombre}</h3>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-lg font-black text-primary">Q{Number(product.precio_venta).toFixed(0)}</span>
                                        <Badge variant={product.stock > 5 ? 'secondary' : 'destructive'} className="text-[10px]">
                                            {product.stock} disp.
                                        </Badge>
                                    </div>
                                    {product.stock > 0 && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-primary text-white p-1 rounded-full">
                                                <Plus size={16} weight="bold" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Cart */}
            <Card className="w-[400px] flex flex-col shadow-xl border-none h-full overflow-hidden">
                <CardHeader className="border-b shrink-0">
                    <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tighter text-xl">
                        <ShoppingCart weight="fill" className="text-primary" />
                        Nueva Orden
                    </CardTitle>
                    <CardDescription>
                        {saleType === 'COTIZACION' ? 'MODO COTIZACIÓN' : 'MODO VENTA DIRECTA'}
                    </CardDescription>
                </CardHeader>

                <div className="p-4 border-b space-y-3 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Cliente</Label>
                            <Select
                                value={selectedClientId?.toString() || "publico"}
                                onValueChange={(v) => setSelectedClientId(v === "publico" ? null : parseInt(v))}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Consumidor Final" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="publico">Consumidor Final</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button size="icon" variant="outline" className="mt-5 h-10 w-10 shrink-0" onClick={() => setIsClientModalOpen(true)}>
                            <UserPlus size={20} />
                        </Button>
                    </div>
                </div>

                <CardContent className="flex-1 overflow-y-auto p-0 flex flex-col">
                    <div className="divide-y">
                        {cart.map(item => (
                            <div key={item.id} className="p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-sm font-medium flex-1 line-clamp-2 leading-snug">{item.nombre}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 bg-accent/50 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors"
                                        >
                                            <Minus size={14} weight="bold" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors"
                                        >
                                            <Plus size={14} weight="bold" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-sm">Q{(item.precio_venta * item.cantidad).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center min-h-[300px]">
                                <div className="bg-accent p-6 rounded-full mb-4">
                                    <ShoppingCart size={48} weight="thin" />
                                </div>
                                <p className="text-xl font-bold text-foreground">Carrito Vacío</p>
                                <p className="text-sm">Agrega productos para comenzar la orden</p>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex-col p-6 bg-primary/5 border-t shrink-0">
                    <div className="w-full space-y-2 mb-6 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>Q{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground border-b pb-2">
                            <span>Impuestos (Incluidos)</span>
                            <span>Q0.00</span>
                        </div>
                        <div className="flex justify-between text-3xl font-black pt-2">
                            <span>TOTAL</span>
                            <span className="text-primary tracking-tighter">Q{subtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-16 text-xl font-black gap-3 shadow-lg shadow-primary/20"
                        disabled={cart.length === 0}
                        onClick={() => {
                            if (saleType === 'PAGADA') {
                                setIsCheckoutModalOpen(true);
                                setPayments([{ metodo_pago_id: paymentMethods[0]?.id || 1, monto: subtotal }]);
                            } else {
                                handleCheckout();
                            }
                        }}
                    >
                        {saleType === 'PAGADA' ? (
                            <>
                                <CreditCard size={28} weight="bold" />
                                FINALIZAR VENTA
                            </>
                        ) : (
                            <>
                                <FileText size={28} weight="bold" />
                                GENERAR COTIZACIÓN
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* New Client Modal */}
            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                        <DialogDescription>Crea un cliente rápido para esta venta.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nombre Completo</Label>
                            <Input
                                value={newClient.nombre}
                                onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
                                placeholder="Juan Perez"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>NIT</Label>
                                <Input
                                    value={newClient.nit}
                                    onChange={(e) => setNewClient({ ...newClient, nit: e.target.value })}
                                    placeholder="123456-7"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={newClient.telefono}
                                    onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                                    placeholder="5555-5555"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClientModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateClient}>Registrar y Seleccionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Checkout Modal */}
            <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Métodos de Pago</DialogTitle>
                        <DialogDescription>Selecciona cómo desea pagar el cliente.</DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="p-4 bg-primary/5 rounded-lg text-center border border-primary/20">
                            <p className="text-sm text-primary font-bold uppercase mb-1">Total a cobrar</p>
                            <h1 className="text-4xl font-black">Q{subtotal.toFixed(2)}</h1>
                        </div>

                        <div className="space-y-4">
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex gap-4 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs">Método de Pago</Label>
                                        <Select
                                            value={p.metodo_pago_id.toString()}
                                            onValueChange={(val) => {
                                                const newPayments = [...payments];
                                                newPayments[idx].metodo_pago_id = parseInt(val);
                                                setPayments(newPayments);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods.map(m => (
                                                    <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-40 space-y-2">
                                        <Label className="text-xs">Monto</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">Q</span>
                                            <Input
                                                className="pl-7 font-bold"
                                                type="number"
                                                value={p.monto}
                                                onChange={(e) => {
                                                    const newPayments = [...payments];
                                                    newPayments[idx].monto = parseFloat(e.target.value) || 0;
                                                    setPayments(newPayments);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {payments.length > 1 && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive mb-0.5"
                                            onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                        >
                                            <X size={18} />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 border-dashed"
                                onClick={() => setPayments([...payments, { metodo_pago_id: paymentMethods[0]?.id || 1, monto: 0 }])}
                            >
                                <Plus size={16} /> Agregar otro método de pago
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <div className="text-sm font-medium">
                            Pagado: <span className={cn(
                                "font-bold",
                                Math.abs(payments.reduce((acc, p) => acc + p.monto, 0) - subtotal) < 0.01 ? "text-green-600" : "text-red-500"
                            )}>
                                Q{payments.reduce((acc, p) => acc + p.monto, 0).toFixed(2)}
                            </span>
                        </div>
                        <Button className="font-bold px-8 h-12" onClick={handleCheckout}>CONFIRMAR PAGO</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
