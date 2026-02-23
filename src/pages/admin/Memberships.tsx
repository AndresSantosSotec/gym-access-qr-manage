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
import { Skeleton } from '@/components/ui/skeleton';
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
import { DataTable, ColumnDef } from '@/components/DataTable';
import { membershipsService } from '@/services/memberships.service';
import { formatCurrency } from '@/utils/date';
import { Plus, Pencil, Trash, Eye, EyeSlash, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MembershipPlan } from '@/types/models';

export function Memberships() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    durationDays: '',
    description: '',
    features: [''],
    published: true,
  });

  // Cargar planes al iniciar
  const loadPlans = async () => {
    try {
      const data = await membershipsService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenNew = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      price: '',
      durationDays: '',
      description: '',
      features: [''],
      published: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      description: plan.description,
      features: plan.features.length > 0 ? plan.features : [''],
      published: plan.published,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.price || !formData.durationDays) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    try {
      const planData = {
        name: formData.name,
        slug: formData.slug,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        description: formData.description,
        features: formData.features.filter(f => f.trim() !== ''),
        published: formData.published,
      };

      if (editingPlan) {
        await membershipsService.updatePlan(editingPlan.id, planData);
        toast.success('Plan actualizado correctamente');
      } else {
        await membershipsService.createPlan(planData);
        toast.success('Plan creado correctamente');
      }

      await loadPlans();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar plan:', error);
      toast.error('Error al guardar el plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await membershipsService.deletePlan(id);
      await loadPlans();
      setDeletingPlanId(null);
      toast.success('Plan eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      toast.error('Error al eliminar el plan');
    }
  };

  const handleTogglePublished = async (id: string) => {
    try {
      await membershipsService.togglePublished(id);
      await loadPlans();
      toast.success('Estado de publicación actualizado');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar el estado de publicación');
    }
  };

  const columns: ColumnDef<MembershipPlan>[] = [
    {
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      header: 'Precio',
      cell: (plan) => formatCurrency(plan.price)
    },
    {
      header: 'Duración',
      cell: (plan) => `${plan.durationDays} días`
    },
    {
      header: 'Slug',
      cell: (plan) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{plan.slug}</code>
      )
    },
    {
      header: 'Publicado',
      cell: (plan) => (
        <Badge variant={plan.published ? 'default' : 'secondary'}>
          {plan.published ? 'Sí' : 'No'}
        </Badge>
      )
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (plan) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePublished(plan.id)}
            title={plan.published ? 'Ocultar' : 'Publicar'}
          >
            {plan.published ? (
              <EyeSlash size={18} />
            ) : (
              <Eye size={18} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(plan)}
          >
            <Pencil size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingPlanId(plan.id)}
          >
            <Trash size={18} className="text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de Membresía</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los planes disponibles para tus clientes
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus size={20} />
          Nuevo Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planes Activos</CardTitle>
          <CardDescription>Lista de todos los planes de membresía</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={plans}
            columns={columns}
            isLoading={loading}
            emptyMessage="No hay planes de membresía registrados"
          />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle>Planes Publicados en la Web</CardTitle>
          <CardDescription>Los planes publicados aparecen en /p/planes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-card p-4 rounded-lg border space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24 mt-2" />
                <Skeleton className="h-4 w-16 mt-1" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))
          ) : (
            plans.filter(p => p.published).map((plan) => (
              <div key={plan.id} className="bg-card p-4 rounded-lg border">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(plan.price)}</p>
                <p className="text-sm text-muted-foreground mt-1">{plan.durationDays} días</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-600" weight="fill" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Modifica los detalles del plan' : 'Crea un nuevo plan de membresía'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Plan Mensual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug * (para URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="mensual"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (Q) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (días) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción breve del plan"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Características</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus size={16} />
                </Button>
              </div>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Ej: Acceso completo al gimnasio"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Publicar en web pública</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <SpinnerGap size={18} className="animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                editingPlan ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlanId} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El plan será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPlanId && handleDelete(deletingPlanId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
