import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WebcamCaptureModal } from '@/components/WebcamCaptureModal';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { accessService } from '@/services/access.service';
import { economicProfileService } from '@/services/economic-profile.service';
import { formatDate, formatDateTime, formatCurrency, getDaysRemaining } from '@/utils/date';
import { toast } from 'sonner';
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  User,
  Phone,
  EnvelopeSimple,
  IdentificationCard,
  Calendar,
  CheckCircle,
  XCircle,
  Camera,
  Fingerprint,
  Trash,
  Plus,
  Wallet,
  TrendUp,
  TrendDown,
  Warning,
  PencilSimple,
} from '@phosphor-icons/react';
import type { Client, EconomicProfileItem, MembershipPlan } from '@/types/models';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFingerprintDialogOpen, setIsFingerprintDialogOpen] = useState(false);
  const [isRemoveFingerprintOpen, setIsRemoveFingerprintOpen] = useState(false);
  const [isEconomicDialogOpen, setIsEconomicDialogOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [editingEconomicItem, setEditingEconomicItem] = useState<EconomicProfileItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentType, setPaymentType] = useState<'single' | 'installments'>('single');
  const [numInstallments, setNumInstallments] = useState('3');
  const [initialPayment, setInitialPayment] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [economicItems, setEconomicItems] = useState<EconomicProfileItem[]>([]);
  const [economicForm, setEconomicForm] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    source: '',
    monthlyAmount: '',
    active: true,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    dpi: '',
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  const payments = client ? membershipsService.getPaymentsByClient(client.id) : [];
  const accessLogs = client ? accessService.getLogsByClient(client.id) : [];

  // Cargar planes de membresía
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
    if (id) {
      const foundClient = clientsService.getById(id);
      if (!foundClient) {
        toast.error('Cliente no encontrado');
        navigate('/admin/clients');
        return;
      }
      setClient(foundClient);
      setPhotoPreview(foundClient.profilePhoto || null);
      setEditForm({
        name: foundClient.name,
        phone: foundClient.phone,
        email: foundClient.email || '',
        dpi: foundClient.dpi || '',
        notes: foundClient.notes || '',
        status: foundClient.status,
      });
      loadEconomicProfile(foundClient.id);
    }
  }, [id, navigate]);

  const loadEconomicProfile = (clientId: string) => {
    const items = economicProfileService.getByClient(clientId);
    setEconomicItems(items);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('La imagen debe ser menor a 1MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      if (client) {
        clientsService.update(client.id, { profilePhoto: base64 });
        setClient({ ...client, profilePhoto: base64 });
        toast.success('Foto actualizada');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!client) return;
    clientsService.update(client.id, { profilePhoto: undefined });
    setClient({ ...client, profilePhoto: undefined });
    setPhotoPreview(null);
    toast.success('Foto eliminada');
  };

  const handleWebcamCapture = (base64Image: string) => {
    if (!client) return;
    setPhotoPreview(base64Image);
    clientsService.update(client.id, { profilePhoto: base64Image });
    setClient({ ...client, profilePhoto: base64Image });
    toast.success('Foto capturada y actualizada');
  };

  const handleRegisterFingerprint = () => {
    if (!client) return;
    const fingerprintId = `FP-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const registeredAt = new Date().toISOString();

    clientsService.update(client.id, {
      fingerprintId,
      fingerprintRegisteredAt: registeredAt,
    });

    setClient({ ...client, fingerprintId, fingerprintRegisteredAt: registeredAt });
    setIsFingerprintDialogOpen(false);
    toast.success('Huella digital registrada (demo)');
  };

  const handleRemoveFingerprint = () => {
    if (!client) return;
    clientsService.update(client.id, {
      fingerprintId: undefined,
      fingerprintRegisteredAt: undefined,
    });
    setClient({ ...client, fingerprintId: undefined, fingerprintRegisteredAt: undefined });
    setIsRemoveFingerprintOpen(false);
    toast.success('Huella eliminada');
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    if (!editForm.name || !editForm.phone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    const updated = clientsService.update(client.id, editForm);
    if (updated) {
      setClient(updated);
      setIsEditDialogOpen(false);
      toast.success('Cliente actualizado');
    }
  };

  const handleGenerateQR = () => {
    if (!client) return;
    const qrUrl = `${window.location.origin}/qr/${client.id}`;
    window.open(qrUrl, '_blank');
    toast.success('QR generado - Se abrió en nueva pestaña');
  };

  const handleAssignMembership = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client || !selectedPlanId) {
      toast.error('Selecciona un plan');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (paymentType === 'single' && (!amount || amount <= 0)) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setIsAssigning(true);
    try {
      const result = await membershipsService.assignMembership(
        client.id,
        selectedPlanId,
        paymentMethod,
        paymentType === 'single' ? amount : 0,
        paymentReference || undefined,
        paymentType,
        paymentType === 'installments' ? parseInt(numInstallments) : undefined,
        paymentType === 'installments' && initialPayment ? parseFloat(initialPayment) : undefined,
      );

      const updatedClient = clientsService.getById(client.id);
      setClient(updatedClient);
      setIsMembershipDialogOpen(false);
      setSelectedPlanId('');
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentType('single');
      setNumInstallments('3');
      setInitialPayment('');
      toast.success(result.message || 'Membresía asignada exitosamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al asignar membresía');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveEconomicItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const amount = parseFloat(economicForm.monthlyAmount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!economicForm.category) {
      toast.error('La categoría es requerida');
      return;
    }

    if (editingEconomicItem) {
      economicProfileService.update(editingEconomicItem.id, {
        ...economicForm,
        monthlyAmount: amount,
      });
      toast.success('Registro actualizado');
    } else {
      economicProfileService.create({
        clientId: client.id,
        ...economicForm,
        monthlyAmount: amount,
      });
      toast.success('Registro agregado');
    }

    loadEconomicProfile(client.id);
    setIsEconomicDialogOpen(false);
    setEditingEconomicItem(null);
    setEconomicForm({
      type: 'INCOME',
      category: '',
      source: '',
      monthlyAmount: '',
      active: true,
    });
  };

  const handleDeleteEconomicItem = (itemId: string) => {
    economicProfileService.delete(itemId);
    if (client) loadEconomicProfile(client.id);
    toast.success('Registro eliminado');
  };

  const openEditEconomicDialog = (item: EconomicProfileItem) => {
    setEditingEconomicItem(item);
    setEconomicForm({
      type: item.type,
      category: item.category,
      source: item.source || '',
      monthlyAmount: item.monthlyAmount.toString(),
      active: item.active,
    });
    setIsEconomicDialogOpen(true);
  };

  const openNewEconomicDialog = () => {
    setEditingEconomicItem(null);
    setEconomicForm({
      type: 'INCOME',
      category: '',
      source: '',
      monthlyAmount: '',
      active: true,
    });
    setIsEconomicDialogOpen(true);
  };

  if (!client) {
    return null;
  }

  const daysRemaining = client.membershipEnd ? getDaysRemaining(client.membershipEnd) : null;
  const capacity = economicProfileService.calculateCapacity(client.id);
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasWarnings = !client.profilePhoto || !client.fingerprintId || client.status !== 'ACTIVE';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={client.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold ring-2 ring-border">
                  {getInitials(client.name)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-muted-foreground mt-1">ID: {client.id}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
            <PencilSimple className="mr-2" size={20} />
            Editar
          </Button>
          <Button onClick={handleGenerateQR} variant="outline">
            <QrCode className="mr-2" size={20} />
            Ver QR
          </Button>
          <Button onClick={() => setIsMembershipDialogOpen(true)}>
            <CreditCard className="mr-2" size={20} weight="bold" />
            Asignar Membresía
          </Button>
        </div>
      </div>

      {hasWarnings && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Warning className="text-yellow-600" size={24} weight="bold" />
              <CardTitle className="text-yellow-900">Acciones Recomendadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-900">
              {!client.profilePhoto && <p>• Este cliente no tiene foto de perfil</p>}
              {!client.fingerprintId && <p>• Este cliente no tiene huella digital registrada</p>}
              {client.status !== 'ACTIVE' && <p>• Este cliente no tiene membresía activa</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={client.status === 'ACTIVE' ? 'default' : 'destructive'}
              className="text-base px-4 py-1"
            >
              {client.status === 'ACTIVE' ? 'Activo' : client.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha Fin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {client.membershipEnd ? formatDate(client.membershipEnd) : 'Sin membresía'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Días Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-bold ${daysRemaining && daysRemaining < 7 ? 'text-destructive' : ''}`}>
              {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido') : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="identity">Identidad</TabsTrigger>
          <TabsTrigger value="economic">Perfil Económico</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="access">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="font-semibold">{client.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-semibold">{client.phone}</p>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <EnvelopeSimple className="text-muted-foreground" size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold">{client.email}</p>
                    </div>
                  </div>
                )}

                {client.dpi && (
                  <div className="flex items-center gap-3">
                    <IdentificationCard className="text-muted-foreground" size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground">DPI</p>
                      <p className="font-semibold">{client.dpi}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground">Miembro desde</p>
                    <p className="font-semibold">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
              </div>

              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Notas</p>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>Puedes subir una foto o tomarla con la cámara</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={client.name}
                    className="w-32 h-32 rounded-xl object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl font-bold text-primary">
                    {getInitials(client.name)}
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                          <Camera size={20} weight="bold" />
                          {photoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                        </div>
                      </Label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <Button onClick={() => setIsWebcamOpen(true)} variant="secondary">
                      <Camera size={20} weight="bold" className="mr-2" />
                      Abrir Cámara
                    </Button>
                  </div>
                  {photoPreview && (
                    <Button onClick={handleRemovePhoto} variant="destructive" size="sm">
                      <Trash className="mr-2" size={16} />
                      Eliminar Foto
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos: JPG, PNG, WEBP • Max: 1MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Huella Digital (Demo)</CardTitle>
              <CardDescription>Registro biométrico para control de acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <Fingerprint
                    size={48}
                    weight="duotone"
                    className={client.fingerprintId ? 'text-green-600' : 'text-muted-foreground'}
                  />
                  <div>
                    <p className="font-semibold">
                      {client.fingerprintId ? 'Huella Registrada' : 'Sin Huella'}
                    </p>
                    {client.fingerprintRegisteredAt && (
                      <p className="text-sm text-muted-foreground">
                        Registrada: {formatDateTime(client.fingerprintRegisteredAt)}
                      </p>
                    )}
                    {client.fingerprintId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {client.fingerprintId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {client.fingerprintId ? (
                    <>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1" size={14} weight="fill" />
                        Registrada
                      </Badge>
                      <Button onClick={() => setIsRemoveFingerprintOpen(true)} variant="destructive" size="sm">
                        Eliminar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary">
                        <XCircle className="mr-1" size={14} weight="fill" />
                        No registrada
                      </Badge>
                      <Button onClick={() => setIsFingerprintDialogOpen(true)} size="sm">
                        Registrar Huella
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economic" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perfil Económico</CardTitle>
                  <CardDescription>Ingresos y egresos mensuales del cliente</CardDescription>
                </div>
                <Button onClick={openNewEconomicDialog} size="sm">
                  <Plus className="mr-2" size={16} weight="bold" />
                  Agregar Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendUp className="text-green-600" size={20} weight="bold" />
                      <CardTitle className="text-sm text-green-900">Ingresos Totales</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(capacity.totalIncome)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">mensual</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendDown className="text-red-600" size={20} weight="bold" />
                      <CardTitle className="text-sm text-red-900">Egresos Totales</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(capacity.totalExpense)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">mensual</p>
                  </CardContent>
                </Card>

                <Card className={`border-blue-200 ${capacity.capacity < 0 ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className={capacity.capacity < 0 ? 'text-yellow-600' : 'text-blue-600'} size={20} weight="bold" />
                      <CardTitle className={`text-sm ${capacity.capacity < 0 ? 'text-yellow-900' : 'text-blue-900'}`}>
                        Capacidad Mensual
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${capacity.capacity < 0 ? 'text-yellow-700' : 'text-blue-700'}`}>
                      {formatCurrency(capacity.capacity)}
                    </p>
                    <p className={`text-xs mt-1 ${capacity.capacity < 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {capacity.capacity < 0 ? 'déficit' : 'disponible'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {economicItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                  <p className="font-semibold">No hay registros económicos</p>
                  <p className="text-sm mt-2">Agrega ingresos y egresos para calcular capacidad económica</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {economicItems.map(item => (
                    <div key={item.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.type === 'INCOME' ? (
                            <TrendUp className="text-green-600" size={24} weight="bold" />
                          ) : (
                            <TrendDown className="text-red-600" size={24} weight="bold" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{item.category}</p>
                              <Badge variant={item.active ? 'default' : 'secondary'} className="text-xs">
                                {item.active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            {item.source && (
                              <p className="text-sm text-muted-foreground">{item.source}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`text-lg font-bold ${item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.monthlyAmount)}
                          </p>
                          <div className="flex gap-1">
                            <Button onClick={() => openEditEconomicDialog(item)} variant="ghost" size="sm">
                              <PencilSimple size={16} />
                            </Button>
                            <Button onClick={() => handleDeleteEconomicItem(item.id)} variant="ghost" size="sm">
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const plan = membershipsService.getPlanByIdSync(payment.planId);
                    return (
                      <div key={payment.id} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{plan?.name || 'Plan desconocido'}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDateTime(payment.createdAt)}
                            </p>
                            <Badge variant="outline" className="mt-2">
                              {payment.method === 'CASH' ? 'Efectivo' : payment.method === 'CARD' ? 'Tarjeta' : payment.method === 'STRIPE' ? 'Stripe' : 'Transferencia'}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        </div>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay check-ins registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.result === 'ALLOWED' ? (
                          <CheckCircle className="text-green-600" size={24} weight="fill" />
                        ) : (
                          <XCircle className="text-red-600" size={24} weight="fill" />
                        )}
                        <div>
                          <p className="font-semibold">{formatDateTime(log.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant={log.result === 'ALLOWED' ? 'default' : 'destructive'}>
                        {log.result === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Actualiza los datos del cliente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono *</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as any })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar Membresía</DialogTitle>
            <DialogDescription>Selecciona un plan, tipo de pago y registra la transacción</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignMembership} className="space-y-4">
            <div className="space-y-2">
              <Label>Plan de Membresía</Label>
              <Select value={selectedPlanId} onValueChange={(v) => {
                setSelectedPlanId(v);
                const plan = plans.find(p => p.id === v);
                if (plan && paymentType === 'single') setPaymentAmount(plan.price.toString());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)} ({plan.durationDays} días)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Type Toggle */}
            <div className="space-y-2">
              <Label>Tipo de Pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentType === 'single' ? 'default' : 'outline'}
                  onClick={() => {
                    setPaymentType('single');
                    const plan = plans.find(p => p.id === selectedPlanId);
                    if (plan) setPaymentAmount(plan.price.toString());
                  }}
                  className="w-full"
                >
                  Pago Único
                </Button>
                <Button
                  type="button"
                  variant={paymentType === 'installments' ? 'default' : 'outline'}
                  onClick={() => {
                    setPaymentType('installments');
                    setPaymentAmount('0');
                  }}
                  className="w-full"
                >
                  Cuotas / Plan de Pago
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === 'single' ? (
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Pagado (Q)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Número de Cuotas</Label>
                  <Select value={numInstallments} onValueChange={setNumInstallments}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 9, 12].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} cuotas</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial-payment">Enganche / Pago Inicial (Opcional)</Label>
                  <Input
                    id="initial-payment"
                    type="number"
                    step="0.01"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {/* Installment Preview */}
                {selectedPlanId && (() => {
                  const plan = plans.find(p => p.id === selectedPlanId);
                  if (!plan) return null;
                  const enganche = parseFloat(initialPayment) || 0;
                  const remaining = plan.price - enganche;
                  const cuotaMonto = remaining / parseInt(numInstallments);
                  return (
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                      <p className="text-sm font-semibold">Vista Previa del Plan</p>
                      <div className="text-xs space-y-0.5">
                        <p>Total: <span className="font-bold">{formatCurrency(plan.price)}</span></p>
                        {enganche > 0 && <p>Enganche: <span className="font-bold text-green-600">{formatCurrency(enganche)}</span></p>}
                        <p>Saldo a fraccionar: <span className="font-bold">{formatCurrency(Math.max(0, remaining))}</span></p>
                        <p>{numInstallments} cuotas de: <span className="font-bold text-blue-600">{formatCurrency(Math.max(0, cuotaMonto))}</span></p>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (Opcional)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Número de transacción o recibo"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsMembershipDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isAssigning} className="flex-1">
                {isAssigning ? 'Procesando...' : paymentType === 'single' ? 'Asignar y Pagar' : `Asignar con ${numInstallments} Cuotas`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFingerprintDialogOpen} onOpenChange={setIsFingerprintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Huella Digital (Demo)</DialogTitle>
            <DialogDescription>
              Simulación de registro biométrico. En producción se conectaría con un lector de huellas real.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <Fingerprint className="mx-auto mb-4 text-primary animate-pulse" size={96} weight="duotone" />
            <p className="text-lg font-semibold">Coloca el dedo en el lector</p>
            <p className="text-sm text-muted-foreground mt-2">(Modo demostración)</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsFingerprintDialogOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleRegisterFingerprint} className="flex-1">
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRemoveFingerprintOpen} onOpenChange={setIsRemoveFingerprintOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar huella digital?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el registro biométrico del cliente. Deberá registrarla nuevamente si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFingerprint}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEconomicDialogOpen} onOpenChange={setIsEconomicDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEconomicItem ? 'Editar Registro' : 'Nuevo Registro Económico'}</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del {economicForm.type === 'INCOME' ? 'ingreso' : 'egreso'} mensual
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEconomicItem} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={economicForm.type} onValueChange={(v) => setEconomicForm({ ...economicForm, type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Input
                id="category"
                value={economicForm.category}
                onChange={(e) => setEconomicForm({ ...economicForm, category: e.target.value })}
                placeholder="Ej: Salario, Renta, Alimentos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Fuente/Nota</Label>
              <Input
                id="source"
                value={economicForm.source}
                onChange={(e) => setEconomicForm({ ...economicForm, source: e.target.value })}
                placeholder="Detalles adicionales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">Monto Mensual *</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={economicForm.monthlyAmount}
                onChange={(e) => setEconomicForm({ ...economicForm, monthlyAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={economicForm.active}
                onChange={(e) => setEconomicForm({ ...economicForm, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">Activo (considerar en cálculos)</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEconomicDialogOpen(false);
                  setEditingEconomicItem(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingEconomicItem ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <WebcamCaptureModal
        open={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
      />
    </div>
  );
}
