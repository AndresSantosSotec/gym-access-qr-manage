import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    Plus,
    MagnifyingGlass,
    PencilSimple,
    Trash,
    Warning,
    CurrencyDollar,
    Tag
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import type { Producto } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const prods = await commercialService.getProducts();
            setProducts(prods);
        } catch (error) {
            toast.error('Error al cargar productos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await commercialService.deleteProduct(id);
            toast.success('Producto eliminado');
            loadData();
        } catch (error) {
            toast.error('Error al eliminar producto');
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                    <p className="text-muted-foreground">Gestión de catálogo y precios del gimnasio.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/admin/catalogos">
                        <Button variant="outline" className="gap-2">
                            <Tag size={18} />
                            Marcas y Presentaciones
                        </Button>
                    </Link>
                    <Button onClick={() => navigate('/admin/productos/nuevo')} className="gap-2">
                        <Plus size={20} />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Package size={24} weight="fill" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                                <h3 className="text-2xl font-bold">{products.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-full text-orange-600">
                                <Warning size={24} weight="fill" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Stock Bajo</p>
                                <h3 className="text-2xl font-bold">{products.filter(p => p.stock < 5).length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
                                <CurrencyDollar size={24} weight="fill" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Valor del Inventario</p>
                                <h3 className="text-2xl font-bold">
                                    Q{products.reduce((acc, p) => acc + (p.stock * p.precio_compra), 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Catálogo</h3>
                        <div className="relative w-64">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input
                                className="pl-9"
                                placeholder="Buscar productos..."
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
                                    <TableHead className="w-[80px]">Imagen</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Marca / Pres.</TableHead>
                                    <TableHead>Precio Venta</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-32 mb-1" />
                                            <Skeleton className="h-3 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Imagen</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Marca / Pres.</TableHead>
                                    <TableHead>Precio Venta</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/productos/editar/${product.id}`)}>
                                        <TableCell>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.nombre} className="h-10 w-10 rounded object-cover border" />
                                            ) : (
                                                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                                    <Package size={16} className="text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{product.nombre}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">{product.descripcion}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {product.marca && <Badge variant="outline">{product.marca.nombre}</Badge>}
                                                {product.presentacion && <Badge variant="secondary">{product.presentacion.nombre}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            Q{Number(product.precio_venta).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={product.stock < 5 ? 'bg-red-500' : 'bg-green-500'}>
                                                {product.stock} unidades
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/productos/editar/${product.id}`)}>
                                                    <PencilSimple size={18} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(product.id)}>
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron productos
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
