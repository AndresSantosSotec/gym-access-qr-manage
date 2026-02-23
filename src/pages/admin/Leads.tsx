import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, ColumnDef } from '@/components/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { leadsService } from '@/services/leads.service';
import { membershipsService } from '@/services/memberships.service';
import { formatDate } from '@/utils/date';
import { UserPlus, Phone, Envelope, CreditCard, ArrowRight, ArrowsClockwise, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Lead, MembershipPlan } from '@/types/models';

export function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<{ total: number; by_status: Record<string, number>; conversion_rate: number }>({
    total: 0, by_status: {}, conversion_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const [leadsData, statsData] = await Promise.all([
        leadsService.getAllLeads({
          status: filter === 'all' ? undefined : filter,
        }),
        leadsService.getStatistics(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Error al cargar leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filter]);

  const filteredLeads = leads;

  const handleUpdateStatus = async (leadId: string, status: Lead['status']) => {
    const result = await leadsService.updateLead(leadId, { status });
    if (result) {
      toast.success('Estado actualizado');
      loadLeads();
    } else {
      toast.error('Error al actualizar estado');
    }
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    setIsConverting(true);

    try {
      const result = await leadsService.convertToClient(selectedLead.id);
      if (result) {
        setIsConvertDialogOpen(false);
        toast.success('Lead convertido a cliente exitosamente');
        loadLeads();
        navigate(`/admin/clients`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al convertir lead');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este lead?')) return;
    const deleted = await leadsService.deleteLead(leadId);
    if (deleted) {
      toast.success('Lead eliminado');
      loadLeads();
    } else {
      toast.error('Error al eliminar lead');
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      contacted: 'secondary',
      interested: 'outline',
      not_interested: 'destructive',
      converted: 'default',
    };

    const labels: Record<string, string> = {
      new: 'Nuevo',
      contacted: 'Contactado',
      interested: 'Interesado',
      not_interested: 'No Interesado',
      converted: 'Convertido',
    };

    return (
      <Badge variant={variants[status] || 'outline'}
        className={status === 'converted' ? 'bg-green-600' : status === 'new' ? 'bg-blue-600' : ''}
      >
        {labels[status] || status}
      </Badge>
    );
  };

  const columns: ColumnDef<Lead>[] = [
    {
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      header: 'Contacto',
      cell: (lead) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} />
            {lead.phone}
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Envelope size={14} />
              {lead.email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Plan Interesado',
      cell: (lead) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {lead.planSlug || '-'}
        </code>
      )
    },
    {
      header: 'Método Preferido',
      cell: (lead) => {
        const methodLabels: Record<string, string> = {
          cash: 'Efectivo',
          card: 'Tarjeta',
          transfer: 'Transferencia',
        };
        return (
          <div className="flex items-center gap-2">
            <CreditCard size={16} />
            {methodLabels[lead.preferredPaymentMethod] || lead.preferredPaymentMethod}
          </div>
        );
      }
    },
    {
      header: 'Fuente',
      cell: (lead) => (
        <Badge variant="outline" className="text-xs">
          {lead.source === 'website' ? 'Web' : lead.source === 'admin' ? 'Admin' : lead.source || '-'}
        </Badge>
      )
    },
    {
      header: 'Estado',
      cell: (lead) => getStatusBadge(lead.status)
    },
    {
      header: 'Fecha',
      cell: (lead) => formatDate(lead.createdAt)
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (lead) => (
        <div className="flex items-center justify-end gap-2">
          {lead.status === 'new' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(lead.id, 'contacted')}
            >
              Marcar Contactado
            </Button>
          )}
          {lead.status === 'contacted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(lead.id, 'interested')}
            >
              Interesado
            </Button>
          )}
          {lead.status !== 'converted' && lead.status !== 'not_interested' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedLead(lead);
                setIsConvertDialogOpen(true);
              }}
              className="gap-2"
            >
              <UserPlus size={16} />
              Convertir
            </Button>
          )}
          {lead.status !== 'converted' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(lead.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await membershipsService.getPlans();
        setPlans(data);
      } catch (error) {
        console.error('Error al cargar planes:', error);
      }
    };
    loadPlans();
  }, []);



  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Solicitudes de suscripción desde la web pública
          </p>
        </div>
        <Button variant="outline" onClick={loadLeads} className="gap-2">
          <ArrowsClockwise size={16} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nuevos</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {stats.by_status?.new || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Contactados</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {stats.by_status?.contacted || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Convertidos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.by_status?.converted || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tasa Conversión</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {stats.conversion_rate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Leads</CardTitle>
              <CardDescription>Gestiona las solicitudes de membresía</CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="interested">Interesados</SelectItem>
                <SelectItem value="not_interested">No Interesados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredLeads}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No hay leads para mostrar"
          />
        </CardContent>
      </Card>

      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir Lead a Cliente</DialogTitle>
            <DialogDescription>
              Se creará un nuevo cliente con la información del lead en la base de datos
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={selectedLead.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={selectedLead.phone} disabled />
              </div>
              {selectedLead.email && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedLead.email} disabled />
                </div>
              )}
              <div className="space-y-2">
                <Label>Plan de Interés</Label>
                <Input value={selectedLead.planSlug || 'Sin plan'} disabled />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Se creará un nuevo cliente en el sistema. Después podrás asignarle la membresía correspondiente.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvert} disabled={isConverting} className="gap-2">
              {isConverting ? (
                <ArrowsClockwise size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              Convertir a Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
