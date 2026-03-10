import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientCreateWizardModal, DRAFTS_KEY } from '@/components/ClientCreateWizardModal';
import type { ClientDraft } from '@/components/ClientCreateWizardModal';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { formatShortDate, getDaysRemaining } from '@/utils/date';
import { MagnifyingGlass, UserPlus, Eye, DotsThree, PencilSimple, Trash, Funnel, FloppyDisk, ArrowCounterClockwise, X } from '@phosphor-icons/react';
import type { Client, MembershipPlan } from '@/types/models';
import { toast } from 'sonner';

import { ClientEditModal } from '@/components/ClientEditModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

function ClientAvatar({ client, getInitials }: { client: Client; getInitials: (name: string) => string }) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !client.profilePhoto || imgError;
  if (showPlaceholder) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
        {getInitials(client.name)}
      </div>
    );
  }
  return (
    <img
      src={client.profilePhoto}
      alt={client.name}
      className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
      onError={() => setImgError(true)}
    />
  );
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50];

export function ClientsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [initialDraftSlot, setInitialDraftSlot] = useState<number | undefined>();
  const [drafts, setDrafts] = useState<(ClientDraft | null)[]>([null, null, null]);

  const readDrafts = () => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (!raw) return [null, null, null] as (ClientDraft | null)[];
      const parsed: (ClientDraft | null)[] = JSON.parse(raw);
      while (parsed.length < 3) parsed.push(null);
      return parsed.slice(0, 3);
    } catch {
      return [null, null, null] as (ClientDraft | null)[];
    }
  };

  // Refresh draft list whenever wizard closes (drafts may have changed)
  const refreshDrafts = () => setDrafts(readDrafts());

  const openNewClient = () => {
    setInitialDraftSlot(undefined);
    setIsWizardOpen(true);
    refreshDrafts();
  };

  const openDraft = (slot: number) => {
    setInitialDraftSlot(slot);
    setIsWizardOpen(true);
  };

  const deleteDraftFromList = (slot: number) => {
    const current = readDrafts();
    current[slot - 1] = null;
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(current));
    setDrafts([...current]);
  };

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [membershipFilter, setMembershipFilter] = useState<string>('');

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const prevFiltersRef = useRef({ searchQuery: '', statusFilter: '', membershipFilter: '' });

  const fetchClients = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    const pageToUse = pageOverride ?? page;
    try {
      const res = await clientsService.getPaginated({
        search: searchQuery || undefined,
        page: pageToUse,
        per_page: perPage,
        status: statusFilter || undefined,
        active_membership: membershipFilter === 'active' ? true : undefined,
        expired_membership: membershipFilter === 'expired' ? true : undefined
      });
      setClients(res.data);
      setTotalItems(res.meta.total);
      setLastPage(res.meta.last_page);
    } catch (error) {
      console.error('Error fetching clients', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, perPage, statusFilter, membershipFilter]);

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
    const filtersChanged =
      prevFiltersRef.current.searchQuery !== searchQuery ||
      prevFiltersRef.current.statusFilter !== statusFilter ||
      prevFiltersRef.current.membershipFilter !== membershipFilter;
    const pageToUse = filtersChanged ? 1 : page;
    if (filtersChanged) setPage(1);
    prevFiltersRef.current = { searchQuery, statusFilter, membershipFilter };

    const timeoutId = setTimeout(() => {
      fetchClients(pageToUse);
    }, searchQuery ? 350 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, membershipFilter, page, perPage, fetchClients]);

  useEffect(() => {
    refreshDrafts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWizardSuccess = () => {
    fetchClients();
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      const success = await clientsService.delete(deletingClient.id);
      if (success) {
        toast.success('Cliente eliminado');
        fetchClients();
      } else {
        toast.error('Error al eliminar cliente');
      }
    } catch {
      toast.error('Error al eliminar cliente');
    } finally {
      setIsDeleting(false);
      setDeletingClient(null);
    }
  };

  const getStatusBadge = (client: Client) => {
    if (client.status === 'ACTIVE') {
      if (!client.membershipEnd) {
        return <Badge variant="secondary">Sin membresía</Badge>;
      }
      const daysRemaining = getDaysRemaining(client.membershipEnd);
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
        <ClientAvatar client={client} getInitials={getInitials} />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <DotsThree size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/admin/clients/${client.id}`} className="flex items-center cursor-pointer w-full">
                <Eye className="mr-2" size={16} /> Ver Detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingClient(client)} className="cursor-pointer">
              <PencilSimple className="mr-2" size={16} /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeletingClient(client)} className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
              <Trash className="mr-2" size={16} /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

        <Button size="lg" onClick={openNewClient}>
          <UserPlus className="mr-2" size={20} weight="bold" />
          Nuevo Cliente
        </Button>
      </div>

      {/* ─── Draft Panel ────────────────────────────────────────── */}
      {drafts.some(Boolean) && (
        <Card className="border-dashed border-amber-400 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2">
              <FloppyDisk size={18} className="text-amber-600" weight="fill" />
              <CardTitle className="text-sm text-amber-800 dark:text-amber-300">
                Borradores pendientes
              </CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">
                {drafts.filter(Boolean).length} / 3
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {drafts.map((draft, idx) => {
                const slot = idx + 1;
                if (!draft) return (
                  <div key={slot} className="flex items-center justify-center rounded-lg border border-dashed border-amber-200 bg-white/40 dark:bg-white/5 h-16 text-xs text-muted-foreground">
                    Slot {slot} vacío
                  </div>
                );
                return (
                  <div
                    key={slot}
                    className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-white dark:bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{draft.name || `Borrador ${slot}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {draft.phone && <span className="mr-2">{draft.phone}</span>}
                          {new Date(draft.savedAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDraftFromList(slot)}
                        className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar borrador"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 w-full border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
                      onClick={() => openDraft(slot)}
                    >
                      <ArrowCounterClockwise size={14} className="mr-1" />
                      Retomar
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Funnel size={16} /> Filtros
              </span>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={membershipFilter || 'all'} onValueChange={(v) => setMembershipFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Membresía" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Con membresía activa</SelectItem>
                  <SelectItem value="expired">Vencida / Sin membresía</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clients}
            columns={columns}
            isLoading={loading}
            emptyMessage={searchQuery ? 'No se encontraron clientes para tu búsqueda' : 'No hay clientes registrados'}
            showPaginationTop
            currentPage={page}
            totalPages={lastPage}
            totalItems={totalItems}
            pageSize={perPage}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      <ClientCreateWizardModal
        open={isWizardOpen}
        onClose={() => { setIsWizardOpen(false); refreshDrafts(); }}
        onSuccess={() => { handleWizardSuccess(); refreshDrafts(); }}
        plans={plans}
        initialDraftSlot={initialDraftSlot}
      />

      <ClientEditModal
        client={editingClient}
        open={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSuccess={handleWizardSuccess}
      />

      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
