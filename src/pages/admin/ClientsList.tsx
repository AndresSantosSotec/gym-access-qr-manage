import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientCreateWizardModal } from '@/components/ClientCreateWizardModal';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { formatShortDate, getDaysRemaining } from '@/utils/date';
import { MagnifyingGlass, UserPlus, Eye, UsersThree } from '@phosphor-icons/react';
import type { Client, MembershipPlan } from '@/types/models';

export function ClientsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
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

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const data = await clientsService.getAll({ search: searchQuery });
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleWizardSuccess = async () => {
    const data = await clientsService.getAll();
    setClients(data);
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

  const columns: ColumnDef<Client>[] = [
    {
      header: 'Foto',
      cell: (client) => (
        client.profilePhoto ? (
          <img
            src={client.profilePhoto}
            alt={client.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
            {getInitials(client.name)}
          </div>
        )
      )
    },
    {
      header: 'Nombre',
      accessorKey: 'name',
      className: 'font-medium'
    },
    {
      header: 'Teléfono',
      accessorKey: 'phone',
      className: 'text-muted-foreground'
    },
    {
      header: 'Estado',
      cell: (client) => getStatusBadge(client)
    },
    {
      header: 'Fecha Fin',
      cell: (client) => (
        <span className="text-muted-foreground">
          {client.membershipEnd ? formatShortDate(client.membershipEnd) : 'Sin membresía'}
        </span>
      )
    },
    {
      header: 'Acción',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (client) => (
        <Link to={`/admin/clients/${client.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="mr-2" size={16} />
            Ver
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la base de datos de miembros
          </p>
        </div>

        <Button size="lg" onClick={() => setIsWizardOpen(true)}>
          <UserPlus className="mr-2" size={20} weight="bold" />
          Nuevo Cliente
        </Button>
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
          <DataTable
            data={clients}
            columns={columns}
            emptyMessage={searchQuery ? 'No se encontraron clientes para tu búsqueda' : 'No hay clientes registrados'}
          />
        </CardContent>
      </Card>

      <ClientCreateWizardModal
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
        plans={plans}
      />
    </div>
  );
}
