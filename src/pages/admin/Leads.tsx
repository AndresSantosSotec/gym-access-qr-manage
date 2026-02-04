import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { UserPlus, Phone, Envelope, CreditCard, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Lead } from '@/types/models';

export function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(leadsService.getAllLeads());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [filter, setFilter] = useState<Lead['status'] | 'all'>('all');

  const filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(l => l.status === filter);

  const handleUpdateStatus = (leadId: string, status: Lead['status']) => {
    leadsService.updateLead(leadId, { status });
    setLeads(leadsService.getAllLeads());
    toast.success('Estado actualizado');
  };

  const handleConvert = () => {
    if (!selectedLead) return;

    const clientId = leadsService.convertToClient(selectedLead.id);
    if (clientId) {
      setLeads(leadsService.getAllLeads());
      setIsConvertDialogOpen(false);
      toast.success('Lead convertido a cliente exitosamente');
      navigate(`/admin/clients/${clientId}`);
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    const variants = {
      new: 'default',
      contacted: 'secondary',
      converted: 'default',
    } as const;

    const labels = {
      new: 'Nuevo',
      contacted: 'Contactado',
      converted: 'Convertido',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const plans = membershipsService.getPlans();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Solicitudes de suscripción desde la web pública
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{leads.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nuevos</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {leads.filter(l => l.status === 'new').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Contactados</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {leads.filter(l => l.status === 'contacted').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Convertidos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {leads.filter(l => l.status === 'converted').length}
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
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Plan Interesado</TableHead>
                <TableHead>Método Preferido</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay leads para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {lead.planSlug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} />
                        {lead.preferredPaymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell className="text-right">
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
                        {lead.status !== 'converted' && (
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir Lead a Cliente</DialogTitle>
            <DialogDescription>
              Se creará un nuevo cliente con la información del lead
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
                <Input value={selectedLead.planSlug} disabled />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Después de convertir, serás redirigido a la página del cliente donde podrás asignarle la membresía.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvert} className="gap-2">
              Convertir a Cliente
              <ArrowRight size={16} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
