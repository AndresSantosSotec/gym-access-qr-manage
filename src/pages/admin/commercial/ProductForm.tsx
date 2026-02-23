import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Tag,
    Plus,
    Check,
    X,
    FloppyDisk,
    Image as ImageIcon
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import { SingleImageUploader } from '@/components/SingleImageUploader';
import type { Producto, Marca, Presentacion } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface MarcaWithCount extends Marca {
    productos_count?: number;
}

interface PresentacionWithCount extends Presentacion {
    productos_count?: number;
}

export function ProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [marcas, setMarcas] = useState<MarcaWithCount[]>([]);
    const [presentaciones, setPresentaciones] = useState<PresentacionWithCount[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio_compra: 0,
        precio_venta: 0,
        stock: 0,
        marca_id: undefined as number | undefined,
        presentacion_id: undefined as number | undefined,
        image_url: '' as string | undefined,
    });

    // Inline add states
    const [isAddingMarca, setIsAddingMarca] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isAddingPresentacion, setIsAddingPresentacion] = useState(false);
    const [newPresentacionNombre, setNewPresentacionNombre] = useState('');

    const newMarcaRef = useRef<HTMLInputElement>(null);
    const newPresentacionRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (isAddingMarca && newMarcaRef.current) {
            newMarcaRef.current.focus();
        }
    }, [isAddingMarca]);

    useEffect(() => {
        if (isAddingPresentacion && newPresentacionRef.current) {
            newPresentacionRef.current.focus();
        }
    }, [isAddingPresentacion]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [marcasData, presentacionesData] = await Promise.all([
                commercialService.getMarcas(),
                commercialService.getPresentaciones()
            ]);
            setMarcas(marcasData);
            setPresentaciones(presentacionesData);

            // If editing, load product data
            if (id) {
                const products = await commercialService.getProducts();
                const product = products.find(p => p.id === parseInt(id));
                if (product) {
                    setFormData({
                        nombre: product.nombre,
                        descripcion: product.descripcion || '',
                        precio_compra: product.precio_compra,
                        precio_venta: product.precio_venta,
                        stock: product.stock,
                        marca_id: product.marca_id,
                        presentacion_id: product.presentacion_id,
                        image_url: product.image_url,
                    });
                }
            }
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.nombre.trim()) {
            toast.error('El nombre del producto es requerido');
            return;
        }

        try {
            setIsSaving(true);
            if (isEditing && id) {
                await commercialService.updateProduct(parseInt(id), formData);
                toast.success('Producto actualizado exitosamente');
            } else {
                await commercialService.createProduct(formData);
                toast.success('Producto creado exitosamente');
            }
            navigate('/admin/productos');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar producto');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Marcas handlers ---
    const handleAddMarca = async () => {
        if (!newMarcaNombre.trim()) {
            toast.error('Ingresa un nombre para la marca');
            return;
        }
        try {
            const newMarca = await commercialService.createMarca({ nombre: newMarcaNombre.trim() });
            toast.success('Marca creada');
            setMarcas([...marcas, { ...newMarca, productos_count: 0 }]);
            setFormData({ ...formData, marca_id: newMarca.id });
            setNewMarcaNombre('');
            setIsAddingMarca(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear marca');
        }
    };

    // --- Presentaciones handlers ---
    const handleAddPresentacion = async () => {
        if (!newPresentacionNombre.trim()) {
            toast.error('Ingresa un nombre para la presentación');
            return;
        }
        try {
            const newPres = await commercialService.createPresentacion({ nombre: newPresentacionNombre.trim() });
            toast.success('Presentación creada');
            setPresentaciones([...presentaciones, { ...newPres, productos_count: 0 }]);
            setFormData({ ...formData, presentacion_id: newPres.id });
            setNewPresentacionNombre('');
            setIsAddingPresentacion(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear presentación');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void, cancelAction: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        } else if (e.key === 'Escape') {
            cancelAction();
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="grid gap-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                                <Separator />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/productos')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditing ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al catálogo'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package size={20} className="text-primary" />
                                Información del Producto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nombre">Nombre del Producto *</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Gatorade Blue Bolt 600ml"
                                    className="text-lg"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Textarea
                                    id="descripcion"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Descripción opcional del producto..."
                                    rows={3}
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="precio_compra">Precio Compra (Q)</Label>
                                    <Input
                                        id="precio_compra"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.precio_compra}
                                        onChange={(e) => setFormData({ ...formData, precio_compra: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="precio_venta">Precio Venta (Q)</Label>
                                    <Input
                                        id="precio_venta"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stock Inicial</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        disabled={isEditing}
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    />
                                    {isEditing && (
                                        <p className="text-xs text-muted-foreground">El stock se gestiona desde inventario</p>
                                    )}
                                </div>
                            </div>

                            {formData.precio_compra > 0 && formData.precio_venta > 0 && (
                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        <span className="font-semibold">Margen de ganancia:</span>{' '}
                                        Q{(formData.precio_venta - formData.precio_compra).toFixed(2)}{' '}
                                        ({((formData.precio_venta - formData.precio_compra) / formData.precio_compra * 100).toFixed(1)}%)
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action buttons for mobile */}
                    <div className="lg:hidden flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/productos')}>
                            Cancelar
                        </Button>
                        <Button className="flex-1 gap-2" onClick={handleSave} disabled={isSaving}>
                            <FloppyDisk size={18} />
                            {isSaving ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </div>
                </div>

                {/* Sidebar - Marcas & Presentaciones */}
                <div className="space-y-6">
                    {/* Image Upload */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ImageIcon size={20} className="text-primary" />
                                Imagen del Producto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SingleImageUploader
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                                uploadUrl="/productos/upload-image"
                                label="Foto Principal"
                            />
                        </CardContent>
                    </Card>

                    {/* Marca Selection */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Tag size={18} className="text-primary" />
                                Marca
                            </CardTitle>
                            <CardDescription>Selecciona o crea una marca</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!isAddingMarca ? (
                                <>
                                    <Select
                                        value={formData.marca_id?.toString()}
                                        onValueChange={(val) => setFormData({ ...formData, marca_id: parseInt(val) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar marca..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {marcas.map(m => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1"
                                        onClick={() => setIsAddingMarca(true)}
                                    >
                                        <Plus size={16} />
                                        Agregar Nueva Marca
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        ref={newMarcaRef}
                                        placeholder="Nombre de la marca..."
                                        value={newMarcaNombre}
                                        onChange={(e) => setNewMarcaNombre(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleAddMarca, () => setIsAddingMarca(false))}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 gap-1" onClick={handleAddMarca}>
                                            <Check size={16} />
                                            Crear
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsAddingMarca(false)}>
                                            <X size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Quick list of existing brands */}
                            {marcas.length > 0 && !isAddingMarca && (
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-2">Marcas disponibles:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {marcas.slice(0, 8).map(m => (
                                            <Badge
                                                key={m.id}
                                                variant={formData.marca_id === m.id ? 'default' : 'outline'}
                                                className="cursor-pointer text-xs"
                                                onClick={() => setFormData({ ...formData, marca_id: m.id })}
                                            >
                                                {m.nombre}
                                            </Badge>
                                        ))}
                                        {marcas.length > 8 && (
                                            <Badge variant="secondary" className="text-xs">+{marcas.length - 8} más</Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Presentacion Selection */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package size={18} className="text-primary" />
                                Presentación
                            </CardTitle>
                            <CardDescription>Tamaño o tipo de empaque</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!isAddingPresentacion ? (
                                <>
                                    <Select
                                        value={formData.presentacion_id?.toString()}
                                        onValueChange={(val) => setFormData({ ...formData, presentacion_id: parseInt(val) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar presentación..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {presentaciones.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1"
                                        onClick={() => setIsAddingPresentacion(true)}
                                    >
                                        <Plus size={16} />
                                        Agregar Nueva Presentación
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        ref={newPresentacionRef}
                                        placeholder="Ej: 600ml, 1 Litro, Caja 12 und..."
                                        value={newPresentacionNombre}
                                        onChange={(e) => setNewPresentacionNombre(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, handleAddPresentacion, () => setIsAddingPresentacion(false))}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 gap-1" onClick={handleAddPresentacion}>
                                            <Check size={16} />
                                            Crear
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsAddingPresentacion(false)}>
                                            <X size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Quick list of existing presentaciones */}
                            {presentaciones.length > 0 && !isAddingPresentacion && (
                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground mb-2">Presentaciones disponibles:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {presentaciones.slice(0, 8).map(p => (
                                            <Badge
                                                key={p.id}
                                                variant={formData.presentacion_id === p.id ? 'default' : 'secondary'}
                                                className="cursor-pointer text-xs"
                                                onClick={() => setFormData({ ...formData, presentacion_id: p.id })}
                                            >
                                                {p.nombre}
                                            </Badge>
                                        ))}
                                        {presentaciones.length > 8 && (
                                            <Badge variant="outline" className="text-xs">+{presentaciones.length - 8} más</Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action buttons for desktop */}
                    <div className="hidden lg:flex flex-col gap-3">
                        <Button className="w-full gap-2" onClick={handleSave} disabled={isSaving}>
                            <FloppyDisk size={18} />
                            {isSaving ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/admin/productos')}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
