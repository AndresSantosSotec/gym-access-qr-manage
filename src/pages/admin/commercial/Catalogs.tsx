import { useState, useEffect, useRef } from 'react';
import {
    Tag,
    Plus,
    PencilSimple,
    Trash,
    Package,
    Check,
    X,
    CaretRight
} from '@phosphor-icons/react';
import { commercialService } from '@/services/commercial.service';
import type { Marca, Presentacion } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface MarcaWithCount extends Marca {
    productos_count: number;
}

interface PresentacionWithCount extends Presentacion {
    productos_count: number;
}

export function Catalogs() {
    const [marcas, setMarcas] = useState<MarcaWithCount[]>([]);
    const [presentaciones, setPresentaciones] = useState<PresentacionWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Inline editing states
    const [editingMarcaId, setEditingMarcaId] = useState<number | null>(null);
    const [editingMarcaNombre, setEditingMarcaNombre] = useState('');
    const [editingPresentacionId, setEditingPresentacionId] = useState<number | null>(null);
    const [editingPresentacionNombre, setEditingPresentacionNombre] = useState('');

    // New item states
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [newPresentacionNombre, setNewPresentacionNombre] = useState('');
    const [isAddingMarca, setIsAddingMarca] = useState(false);
    const [isAddingPresentacion, setIsAddingPresentacion] = useState(false);

    const newMarcaRef = useRef<HTMLInputElement>(null);
    const newPresentacionRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

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
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Marcas handlers ---
    const handleAddMarca = async () => {
        if (!newMarcaNombre.trim()) {
            toast.error('Ingresa un nombre para la marca');
            return;
        }
        try {
            await commercialService.createMarca({ nombre: newMarcaNombre.trim() });
            toast.success('Marca creada');
            setNewMarcaNombre('');
            setIsAddingMarca(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear marca');
        }
    };

    const handleEditMarca = (marca: MarcaWithCount) => {
        setEditingMarcaId(marca.id);
        setEditingMarcaNombre(marca.nombre);
    };

    const handleSaveMarca = async () => {
        if (!editingMarcaNombre.trim() || !editingMarcaId) return;
        try {
            await commercialService.updateMarca(editingMarcaId, { nombre: editingMarcaNombre.trim() });
            toast.success('Marca actualizada');
            setEditingMarcaId(null);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar marca');
        }
    };

    const handleDeleteMarca = async (id: number) => {
        if (!confirm('¿Eliminar esta marca?')) return;
        try {
            await commercialService.deleteMarca(id);
            toast.success('Marca eliminada');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar marca');
        }
    };

    // --- Presentaciones handlers ---
    const handleAddPresentacion = async () => {
        if (!newPresentacionNombre.trim()) {
            toast.error('Ingresa un nombre para la presentación');
            return;
        }
        try {
            await commercialService.createPresentacion({ nombre: newPresentacionNombre.trim() });
            toast.success('Presentación creada');
            setNewPresentacionNombre('');
            setIsAddingPresentacion(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear presentación');
        }
    };

    const handleEditPresentacion = (pres: PresentacionWithCount) => {
        setEditingPresentacionId(pres.id);
        setEditingPresentacionNombre(pres.nombre);
    };

    const handleSavePresentacion = async () => {
        if (!editingPresentacionNombre.trim() || !editingPresentacionId) return;
        try {
            await commercialService.updatePresentacion(editingPresentacionId, { nombre: editingPresentacionNombre.trim() });
            toast.success('Presentación actualizada');
            setEditingPresentacionId(null);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar presentación');
        }
    };

    const handleDeletePresentacion = async (id: number) => {
        if (!confirm('¿Eliminar esta presentación?')) return;
        try {
            await commercialService.deletePresentacion(id);
            toast.success('Presentación eliminada');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar presentación');
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
            <div className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catálogos</h1>
                    <p className="text-muted-foreground">Gestiona marcas y presentaciones de productos de forma rápida.</p>
                </div>
                <Link to="/admin/productos">
                    <Button variant="outline" className="gap-2">
                        <Package size={18} />
                        Ir a Productos
                        <CaretRight size={16} />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Marcas Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag size={20} className="text-primary" />
                                    Marcas
                                </CardTitle>
                                <CardDescription>{marcas.length} marcas registradas</CardDescription>
                            </div>
                            {!isAddingMarca && (
                                <Button size="sm" onClick={() => setIsAddingMarca(true)} className="gap-1">
                                    <Plus size={16} />
                                    Agregar
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* Add new marca inline */}
                        {isAddingMarca && (
                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                <Input
                                    ref={newMarcaRef}
                                    placeholder="Nombre de la marca..."
                                    value={newMarcaNombre}
                                    onChange={(e) => setNewMarcaNombre(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleAddMarca, () => setIsAddingMarca(false))}
                                    className="h-8"
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleAddMarca}>
                                    <Check size={18} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsAddingMarca(false)}>
                                    <X size={18} />
                                </Button>
                            </div>
                        )}

                        {/* Marcas list */}
                        {marcas.length === 0 && !isAddingMarca ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay marcas. ¡Agrega una!
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {marcas.map((marca) => (
                                    <div
                                        key={marca.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group transition-colors"
                                    >
                                        {editingMarcaId === marca.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    value={editingMarcaNombre}
                                                    onChange={(e) => setEditingMarcaNombre(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, handleSaveMarca, () => setEditingMarcaId(null))}
                                                    className="h-8"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveMarca}>
                                                    <Check size={18} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingMarcaId(null)}>
                                                    <X size={18} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{marca.nombre}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {marca.productos_count} productos
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditMarca(marca)}>
                                                        <PencilSimple size={16} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-destructive"
                                                        onClick={() => handleDeleteMarca(marca.id)}
                                                        disabled={marca.productos_count > 0}
                                                    >
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Presentaciones Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package size={20} className="text-primary" />
                                    Presentaciones
                                </CardTitle>
                                <CardDescription>{presentaciones.length} presentaciones registradas</CardDescription>
                            </div>
                            {!isAddingPresentacion && (
                                <Button size="sm" onClick={() => setIsAddingPresentacion(true)} className="gap-1">
                                    <Plus size={16} />
                                    Agregar
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* Add new presentacion inline */}
                        {isAddingPresentacion && (
                            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                <Input
                                    ref={newPresentacionRef}
                                    placeholder="Nombre de la presentación..."
                                    value={newPresentacionNombre}
                                    onChange={(e) => setNewPresentacionNombre(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, handleAddPresentacion, () => setIsAddingPresentacion(false))}
                                    className="h-8"
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleAddPresentacion}>
                                    <Check size={18} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsAddingPresentacion(false)}>
                                    <X size={18} />
                                </Button>
                            </div>
                        )}

                        {/* Presentaciones list */}
                        {presentaciones.length === 0 && !isAddingPresentacion ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay presentaciones. ¡Agrega una!
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {presentaciones.map((pres) => (
                                    <div
                                        key={pres.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group transition-colors"
                                    >
                                        {editingPresentacionId === pres.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    value={editingPresentacionNombre}
                                                    onChange={(e) => setEditingPresentacionNombre(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, handleSavePresentacion, () => setEditingPresentacionId(null))}
                                                    className="h-8"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSavePresentacion}>
                                                    <Check size={18} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingPresentacionId(null)}>
                                                    <X size={18} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{pres.nombre}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {pres.productos_count} productos
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditPresentacion(pres)}>
                                                        <PencilSimple size={16} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-destructive"
                                                        onClick={() => handleDeletePresentacion(pres.id)}
                                                        disabled={pres.productos_count > 0}
                                                    >
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
