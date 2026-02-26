import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { recurrenteProductosService } from '@/services/recurrente-productos.service';
import type {
  ProductoRecurrente,
  ProductoRecurrenteTipo,
  CreateProductoRecurrentePayload,
} from '@/services/recurrente-productos.service';
import { Plus, Trash, SpinnerGap } from '@phosphor-icons/react';
import { toast } from 'sonner';

const TIPO_OPTIONS: { value: ProductoRecurrenteTipo; label: string }[] = [
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'curso', label: 'Curso específico' },
  { value: 'otro', label: 'Otro' },
];

export function ProductosRecurrente() {
  const [productos, setProductos] = useState<ProductoRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateProductoRecurrentePayload & { id?: number }>({
    nombre: '',
    descripcion: '',
    monto: 0,
    tipo: 'inscripcion',
    activo: true,
  });

  const loadProductos = async () => {
    setLoading(true);
    try {
      const data = await recurrenteProductosService.getProductos();
      setProductos(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const handleOpenNew = () => {
    setForm({
      nombre: '',
      descripcion: '',
      monto: 0,
      tipo: 'inscripcion',
      activo: true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (form.monto < 0) {
      toast.error('El monto debe ser mayor o igual a 0');
      return;
    }
    setSaving(true);
    try {
      await recurrenteProductosService.createProducto({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion?.trim() || undefined,
        monto: Number(form.monto),
        tipo: form.tipo,
        activo: form.activo,
      });
      toast.success('Producto creado en Recurrente');
      await loadProductos();
      setIsDialogOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al crear producto';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await recurrenteProductosService.deleteProducto(id);
      toast.success('Producto eliminado');
      await loadProductos();
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Productos de Pago</h2>
          <p className="text-sm text-muted-foreground">
            Productos de pago único en Recurrente (inscripción, mensualidad, cursos). Se usan en el Paso 4 del registro de clientes.
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus size={20} />
          Nuevo Producto de Inscripción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Productos sincronizados con Recurrente (pago único)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerGap size={32} className="animate-spin text-muted-foreground" />
            </div>
          ) : productos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay productos. Crea uno con el botón &quot;Nuevo Producto de Inscripción&quot;.
            </p>
          ) : (
            <ul className="divide-y">
              {productos.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.descripcion || '—'} · Q {p.monto_quetzales.toFixed(2)} ·{' '}
                      <Badge variant="outline">{p.tipo}</Badge>
                      {!p.activo && (
                        <Badge variant="secondary" className="ml-1">Inactivo</Badge>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingId(p.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash size={18} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Producto de Inscripción</DialogTitle>
            <DialogDescription>
              Crea un producto de pago único en Recurrente. Aparecerá en el Paso 4 del registro de clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Inscripción General"
              />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion ?? ''}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Opcional"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="monto">Monto (GTQ) *</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                step={0.01}
                value={form.monto || ''}
                onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
                placeholder="500.00"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v: ProductoRecurrenteTipo) => setForm({ ...form, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="activo"
                checked={form.activo ?? true}
                onCheckedChange={(c) => setForm({ ...form, activo: c })}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <SpinnerGap size={18} className="animate-spin mr-2" />
                  Crear en Recurrente...
                </>
              ) : (
                'Crear en Recurrente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará en Recurrente y se desactivará localmente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId != null && handleDelete(deletingId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
