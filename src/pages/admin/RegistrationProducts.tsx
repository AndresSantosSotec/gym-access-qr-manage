import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash,
  Eye,
  EyeSlash,
  Receipt,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/date';
import {
  registrationProductsService,
  type RegistrationProduct,
  type CreateRegistrationProductPayload,
} from '@/services/registration-products.service';

export function RegistrationProducts() {
  const [products, setProducts] = useState<RegistrationProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RegistrationProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateRegistrationProductPayload>({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    published: true,
    max_uses: undefined,
    phone_requirement: 'none',
    address_requirement: 'none',
    billing_info_requirement: 'none',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await registrationProductsService.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('Error al cargar productos de inscripción');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      image_url: '',
      published: true,
      max_uses: undefined,
      phone_requirement: 'none',
      address_requirement: 'none',
      billing_info_requirement: 'none',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: RegistrationProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      published: product.published,
      max_uses: product.max_uses,
      phone_requirement: product.phone_requirement,
      address_requirement: product.address_requirement,
      billing_info_requirement: product.billing_info_requirement,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0) {
      toast.error('El nombre y precio son requeridos');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduct) {
        await registrationProductsService.update(editingProduct.id, formData);
        toast.success('Producto actualizado correctamente');
      } else {
        await registrationProductsService.create(formData);
        toast.success('Producto creado correctamente');
      }

      await loadProducts();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al guardar el producto');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: RegistrationProduct) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    try {
      await registrationProductsService.delete(product.id);
      toast.success('Producto eliminado correctamente');
      await loadProducts();
    } catch (error) {
      toast.error('Error al eliminar el producto');
      console.error(error);
    }
  };

  const stats = {
    total: products.length,
    published: products.filter(p => p.published).length,
    available: products.filter(p => p.available).length,
    totalUses: products.reduce((sum, p) => sum + p.uses_count, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inscripciones</h1>
          <p className="text-muted-foreground">
            Gestiona productos de inscripción, matrículas y pagos únicos
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus size={20} weight="bold" />
          Nueva Inscripción
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Productos</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Publicados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Disponibles</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.available}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Usos</CardDescription>
            <CardTitle className="text-3xl">{stats.totalUses}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Productos de Inscripción</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Recurrente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay productos de inscripción. Crea uno para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatCurrency(product.price)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {product.published ? (
                            <Badge variant="default" className="gap-1">
                              <Eye size={14} />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <EyeSlash size={14} />
                              Borrador
                            </Badge>
                          )}
                          {product.available ? (
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                              <CheckCircle size={14} weight="fill" />
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                              <XCircle size={14} weight="fill" />
                              Agotado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {product.uses_count}
                          {product.max_uses && ` / ${product.max_uses}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.synced_with_recurrente ? (
                          <Badge variant="outline" className="gap-1 text-green-600">
                            <CheckCircle size={14} weight="fill" />
                            Sincronizado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-orange-600">
                            <XCircle size={14} />
                            No sincronizado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Crear Producto de Inscripción'}
            </DialogTitle>
            <DialogDescription>
              Los productos de inscripción son pagos únicos (no recurrentes) como matrículas,
              evaluaciones físicas, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Inscripción Anual 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del producto..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (Q) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses">Límite de Usos (opcional)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_req">Requisito de Teléfono</Label>
              <Select
                value={formData.phone_requirement}
                onValueChange={(value: any) => setFormData({ ...formData, phone_requirement: value })}
              >
                <SelectTrigger id="phone_req">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  <SelectItem value="optional">Opcional</SelectItem>
                  <SelectItem value="required">Requerido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="published">Publicar producto</Label>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
