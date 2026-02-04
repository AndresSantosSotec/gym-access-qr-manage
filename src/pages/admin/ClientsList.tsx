import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { clientsService } from '@/services/clients.service';
import { formatShortDate, getDaysRemaining } from '@/utils/date';
import { toast } from 'sonner';
import { MagnifyingGlass, UserPlus, Eye, UsersThree } from '@phosphor-icons/react';
import type { Client } from '@/types/models';

export function ClientsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState(() => clientsService.getAll());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    dpi: '',
    notes: '',
  });

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clientsService.search(searchQuery);
  }, [searchQuery, clients]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newClient.name || !newClient.phone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    const client = clientsService.create({
      ...newClient,
      status: 'INACTIVE',
    });

    setClients(clientsService.getAll());
    setIsDialogOpen(false);
    setNewClient({ name: '', phone: '', email: '', dpi: '', notes: '' });
    toast.success(`Cliente ${client.name} creado exitosamente`);
  };

  const getStatusBadge = (client: Client) => {
    if (client.status === 'ACTIVE') {
      const daysRemaining = client.membershipEnd ? getDaysRemaining(client.membershipEnd) : 0;
      if (daysRemaining < 0) {
        return <Badge variant="destructive">Vencido</Badge>;
      }
      if (daysRemaining <= 7) {
        return <Badge className="bg-yellow-500">Por vencer</Badge>;
      }
      return <Badge className="bg-green-600">Activo</Badge>;
    }
    if (client.status === 'SUSPENDED') {
      return <Badge variant="destructive">Suspendido</Badge>;
    }
    return <Badge variant="secondary">Inactivo</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la base de datos de miembros
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="mr-2" size={20} weight="bold" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo miembro
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="+502 5555-1234"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpi">DPI</Label>
                <Input
                  id="dpi"
                  value={newClient.dpi}
                  onChange={(e) => setNewClient({ ...newClient, dpi: e.target.value })}
                  placeholder="1234 56789 0101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Crear Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersThree className="mx-auto mb-4 text-muted-foreground/50" size={48} />
              <p className="font-semibold">No se encontraron clientes</p>
              <p className="text-sm mt-2">
                {searchQuery ? 'Intenta con otro término de búsqueda' : 'Crea tu primer cliente para comenzar'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Foto</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Fecha Fin</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4">
                        {client.profilePhoto ? (
                          <img
                            src={client.profilePhoto}
                            alt={client.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                            {getInitials(client.name)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium">{client.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{client.phone}</td>
                      <td className="py-4 px-4">{getStatusBadge(client)}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {client.membershipEnd ? formatShortDate(client.membershipEnd) : 'Sin membresía'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-2" size={16} />
                            Ver
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
