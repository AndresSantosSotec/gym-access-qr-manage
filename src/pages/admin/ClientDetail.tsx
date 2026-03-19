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
import { FingerprintCaptureModal } from '@/components/FingerprintCaptureModal';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { accessService } from '@/services/access.service';
import { economicProfileService } from '@/services/economic-profile.service';
import { api } from '@/services/api.service';
import { can } from '@/services/permissions';
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
  Check,
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
import { recurrenteService } from '@/services/recurrente.service';
import { RecurrenteCheckoutEmbed } from '@/components/RecurrenteCheckoutEmbed';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFingerprintDialogOpen, setIsFingerprintDialogOpen] = useState(false);
  const [isRemoveFingerprintOpen, setIsRemoveFingerprintOpen] = useState(false);
  const [isVerifyingFp, setIsVerifyingFp] = useState(false);
  const [fpVerifyResult, setFpVerifyResult] = useState<{
    match: boolean;
    similarity_pct: number;
    live_image: string | null;
    message: string;
  } | null>(null);
  const [storedFpData, setStoredFpData] = useState<{
    image_base64: string | null;
    quality: number | null;
    device_id: string | null;
  } | null>(null);
  const [isEconomicDialogOpen, setIsEconomicDialogOpen] = useState(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [editingEconomicItem, setEditingEconomicItem] = useState<EconomicProfileItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'RECURRENTE'>('CASH');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentType, setPaymentType] = useState<'single' | 'installments'>('single');
  const [numInstallments, setNumInstallments] = useState('3');
  const [initialPayment, setInitialPayment] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferDocument, setTransferDocument] = useState<string>('');
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
    nit: '',
    companyName: '',
    fiscalAddress: '',
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (client) {
      const loadRelatedData = async () => {
        try {
          // Access logs deshabilitados temporalmente (ROADMAP FUTURO)
          const clientPayments = await membershipsService.getPaymentsByClient(client.id);
          setPayments(clientPayments);
        } catch (e) {
          console.error(e);
        }
      };
      loadRelatedData();
    }
  }, [client]);

  // Cargar imagen de huella almacenada cuando el cliente tiene fingerprint registrado
  useEffect(() => {
    if (!client?.fingerprintId) {
      setStoredFpData(null);
      return;
    }
    api
      .get(`/fingerprint/${client.fingerprintId}`)
      .then((res) => {
        if (res.data?.success) {
          setStoredFpData({
            image_base64: res.data.image_base64 ?? null,
            quality: res.data.quality ?? null,
            device_id: res.data.device_id ?? null,
          });
        }
      })
      .catch(() => {
        // Server offline — no problem, just won't show stored image
      });
  }, [client?.fingerprintId]);

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
    const fetchClient = async () => {
      if (!id) return;
      try {
        const foundClient = await clientsService.getById(id);
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
          nit: foundClient.nit || '',
          companyName: foundClient.companyName || '',
          fiscalAddress: foundClient.fiscalAddress || '',
          notes: foundClient.notes || '',
          status: foundClient.status,
        });
        loadEconomicProfile(foundClient.id);
      } catch (error) {
        console.error('Error loading client:', error);
      }
    };
    fetchClient();
  }, [id, navigate]);

  const loadEconomicProfile = (clientId: string) => {
    const items = economicProfileService.getByClient(clientId);
    setEconomicItems(items);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('¿Eliminar este pago y los recibos/facturas asociados? Esta acción no se puede deshacer.')) return;
    setDeletingPaymentId(paymentId);
    try {
      await api.delete(`/payments/${paymentId}`);
      toast.success('Pago y recibos asociados eliminados');
      if (client) {
        const list = await membershipsService.getPaymentsByClient(client.id);
        setPayments(list);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo eliminar el pago');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('La imagen supera los 2MB, puede afectar el rendimiento');
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      if (client) {
        try {
          await clientsService.uploadPhoto(client.id, base64);
          setClient({ ...client, profilePhoto: base64 });
          toast.success('Foto actualizada');
        } catch (error) {
          console.error(error);
          toast.error('Error al subir la foto');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = async () => {
    if (!client) return;
    try {
      await api.delete(`/clients/${client.id}/photo`);
      setClient({ ...client, profilePhoto: undefined });
      setPhotoPreview(null);
      toast.success('Foto eliminada');
    } catch (error: any) {
      // Si el backend no tiene la ruta DELETE /photo, igualmente limpiamos la UI
      if (error?.response?.status === 404) {
        setClient({ ...client, profilePhoto: undefined });
        setPhotoPreview(null);
        toast.success('Foto eliminada');
      } else {
        console.error(error);
        toast.error('Error al eliminar la foto');
      }
    }
  };

  const handleWebcamCapture = async (base64Image: string) => {
    if (!client) return;
    setPhotoPreview(base64Image);
    setIsWebcamOpen(false);
    try {
      await clientsService.uploadPhoto(client.id, base64Image);
      setClient({ ...client, profilePhoto: base64Image });
      toast.success('Foto capturada y guardada');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar la foto capturada');
    }
  };

  const handleRegisterFingerprint = async (base64: string) => {
    if (!client) return;

    try {
      const result = await clientsService.registerFingerprint(client.id, base64);

      const fingerprintId = result.fingerprint_id || `FP-${client.id}-${Date.now()}`;
      const registeredAt = result.registered_at || new Date().toISOString();

      setStoredFpData(null); // clear old image; useEffect will re-fetch
      setFpVerifyResult(null);
      setClient({ ...client, fingerprintId, fingerprintRegisteredAt: registeredAt });
      setIsFingerprintDialogOpen(false);
      toast.success('Huella digital registrada exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar la huella digital');
    }
  };

  const handleRemoveFingerprint = async () => {
    if (!client) return;
    try {
      // Use the specific removeFingerprint method if available, fallback to update
      if (clientsService.removeFingerprint) {
        await clientsService.removeFingerprint(client.id);
      } else {
        await clientsService.update(client.id, {
          fingerprintId: undefined,
          fingerprintRegisteredAt: undefined,
        });
      }

      setClient({ ...client, fingerprintId: undefined, fingerprintRegisteredAt: undefined });
      setStoredFpData(null);
      setFpVerifyResult(null);
      setIsRemoveFingerprintOpen(false);
      toast.success('Huella eliminada');
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar la huella');
    }
  };

  const handleVerifyFingerprint = async () => {
    if (!client?.fingerprintId) return;
    setIsVerifyingFp(true);
    setFpVerifyResult(null);
    try {
      const res = await api.post('/fingerprint/verify-live', {
        fingerprint_id: client.fingerprintId,
      });
      setFpVerifyResult(res.data);
      if (res.data.match) {
        toast.success(`✅ Huella verificada — Similitud: ${res.data.similarity_pct}%`);
      } else {
        toast.error(`❌ No coincide la huella — Similitud: ${res.data.similarity_pct}%`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al verificar la huella. ¿Está el servidor del lector activo?');
    } finally {
      setIsVerifyingFp(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    if (!editForm.name || !editForm.phone) {
      toast.error('Nombre y teléfono son requeridos');
      return;
    }

    try {
      const updated = await clientsService.update(client.id, editForm);
      if (updated) {
        setClient(updated);
        setIsEditDialogOpen(false);
        toast.success('Cliente actualizado');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar cliente');
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

    if (paymentMethod === 'RECURRENTE') {
      try {
        setIsAssigning(true);
        const { checkout_url } = await recurrenteService.createCheckout(
          Number(client.id),
          parseInt(selectedPlanId, 10),
          `${window.location.origin}/p/pago-exitoso?client_id=${client.id}`,
          `${window.location.origin}/p/pago-fallido`,
        );
        if (!checkout_url) throw new Error('No se recibió URL de checkout de Recurrente.');

        setCheckoutUrl(checkout_url);
        setWaitingPayment(true);
        setIsAssigning(false);
      } catch (err: any) {
        setIsAssigning(false);
        toast.error(err?.response?.data?.message || err.message || 'Error al iniciar checkout en Recurrente');
      }
      return;
    }

    await finalizeAssignMembership(paymentMethod);
  };

  const finalizeAssignMembership = async (method: 'CASH' | 'CARD' | 'TRANSFER' | 'RECURRENTE') => {
    if (!client || !selectedPlanId) return;
    const amount = parseFloat(paymentAmount);
    if (paymentType === 'single' && (!amount || amount <= 0) && method !== 'RECURRENTE') {
      toast.error('Ingresa un monto válido');
      return;
    }

    setIsAssigning(true);
    const finalReference = paymentMethod === 'TRANSFER' && transferDate
      ? `${paymentReference} (Fecha: ${transferDate})`
      : (paymentReference || undefined);

    try {

      const result = await membershipsService.assignMembership(
        client.id,
        selectedPlanId,
        method === 'RECURRENTE' ? 'CARD' : method,
        paymentType === 'single' ? amount : 0,
        finalReference,
        paymentType,
        paymentType === 'installments' ? parseInt(numInstallments) : undefined,
        paymentType === 'installments' && initialPayment ? parseFloat(initialPayment) : undefined,
        undefined, // inscriptionFee
        paymentMethod === 'TRANSFER' && transferDocument ? transferDocument : undefined
      );

      const updatedClient = await clientsService.getById(client.id);
      setClient(updatedClient);
      setIsMembershipDialogOpen(false);
      setSelectedPlanId('');
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentType('single');
      setNumInstallments('3');
      setInitialPayment('');
      setCheckoutUrl(null);
      setWaitingPayment(false);
      setTransferDocument('');
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
              <CardTitle>Huella Digital</CardTitle>
              <CardDescription>Registro biométrico para control de acceso — DigitalPersona U.are.U® 4500</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                {/* Left: fingerprint image or icon + info */}
                <div className="flex items-center gap-4">
                  {storedFpData?.image_base64 ? (
                    <img
                      src={`data:image/png;base64,${storedFpData.image_base64}`}
                      alt="Huella registrada"
                      className="w-16 h-16 rounded-lg border-2 border-green-500 object-cover bg-gray-100"
                    />
                  ) : (
                    <Fingerprint
                      size={48}
                      weight="duotone"
                      className={client.fingerprintId ? 'text-green-600' : 'text-muted-foreground'}
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      {client.fingerprintId ? 'Huella Registrada' : 'Sin Huella'}
                    </p>
                    {client.fingerprintRegisteredAt && (
                      <p className="text-sm text-muted-foreground">
                        Registrada: {formatDateTime(client.fingerprintRegisteredAt)}
                      </p>
                    )}
                    {storedFpData?.quality && (
                      <p className="text-xs text-muted-foreground">
                        Calidad: {storedFpData.quality}% &nbsp;·&nbsp;
                        <span className={
                          storedFpData.device_id === 'simulator' || storedFpData.device_id === 'default'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }>
                          {storedFpData.device_id === 'default' ? 'simulador' : storedFpData.device_id}
                        </span>
                      </p>
                    )}
                    {client.fingerprintId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: {client.fingerprintId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {client.fingerprintId ? (
                    <>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1" size={14} weight="fill" />
                        Registrada
                      </Badge>
                      <Button
                        onClick={handleVerifyFingerprint}
                        disabled={isVerifyingFp}
                        variant="outline"
                        size="sm"
                      >
                        {isVerifyingFp ? (
                          <>
                            <span className="animate-spin mr-2">⌛</span>
                            Leyendo...
                          </>
                        ) : (
                          <>
                            <Fingerprint className="mr-1" size={14} weight="bold" />
                            Probar Huella
                          </>
                        )}
                      </Button>
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

              {/* Simulator-mode warning: registered without real image */}
              {client.fingerprintId && storedFpData && !storedFpData.image_base64 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 text-sm">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Registrada en modo simulador</p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-0.5">
                      El lector real ya está conectado. Elimine esta huella y vuelva a registrarla para obtener la imagen biométrica real.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                    onClick={() => setIsFingerprintDialogOpen(true)}
                  >
                    Re-registrar
                  </Button>
                </div>
              )}

              {/* Verify result panel */}
              {fpVerifyResult && (
                <div className={`p-4 rounded-lg border-2 ${
                  fpVerifyResult.match
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-400 bg-red-50 dark:bg-red-950/20'
                }`}>
                  <div className="flex items-start gap-4">
                    {fpVerifyResult.live_image && (
                      <img
                        src={`data:image/png;base64,${fpVerifyResult.live_image}`}
                        alt="Huella capturada"
                        className="w-24 h-24 rounded-md border object-cover bg-gray-100"
                      />
                    )}
                    <div className="flex-1">
                      <p className={`text-lg font-bold ${
                        fpVerifyResult.match ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {fpVerifyResult.match ? '✅ Huella Verificada' : '❌ No Coincide'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Similitud: <span className="font-semibold">{fpVerifyResult.similarity_pct}%</span>
                      </p>
                      {fpVerifyResult.message && (
                        <p className="text-xs text-muted-foreground mt-1">{fpVerifyResult.message}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setFpVerifyResult(null)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
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
                  {payments.map((payment: any) => {
                    const planName =
                      payment.membership?.plan?.name ??
                      membershipsService.getPlanByIdSync(payment.plan_id ?? payment.planId)?.name ??
                      'Plan desconocido';
                    const paidAt = payment.paid_at ?? payment.created_at ?? payment.createdAt;
                    const method = (payment.payment_method ?? payment.method ?? '').toUpperCase();
                    return (
                      <div key={payment.id} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{planName}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDateTime(paidAt)}
                            </p>
                            <Badge variant="outline" className="mt-2">
                              {method === 'CASH' ? 'Efectivo' : method === 'CARD' ? 'Tarjeta' : method === 'STRIPE' ? 'Stripe' : 'Transferencia'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold">{formatCurrency(Number(payment.amount ?? 0))}</p>
                            {can('ROLES_MANAGE') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeletePayment(payment.id)}
                                disabled={deletingPaymentId === payment.id}
                                title="Eliminar pago y recibos/facturas asociados"
                              >
                                <Trash size={18} />
                              </Button>
                            )}
                          </div>
                        </div>
                        {(payment.transaction_id ?? payment.reference) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Ref: {payment.transaction_id ?? payment.reference}
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
              <Label htmlFor="edit-dpi">DPI / Identificación</Label>
              <Input
                id="edit-dpi"
                value={editForm.dpi}
                onChange={(e) => setEditForm({ ...editForm, dpi: e.target.value })}
                placeholder="Ej: 1234567890101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nit">NIT</Label>
              <Input
                id="edit-nit"
                value={editForm.nit}
                onChange={(e) => setEditForm({ ...editForm, nit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Razón Social</Label>
              <Input
                id="edit-company-name"
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fiscal-address">Dirección Fiscal</Label>
              <Textarea
                id="edit-fiscal-address"
                value={editForm.fiscalAddress}
                onChange={(e) => setEditForm({ ...editForm, fiscalAddress: e.target.value })}
                rows={2}
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
                  <SelectItem value="CARD">Tarjeta (Local - No Recurrente)</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia Bancaria</SelectItem>
                  <SelectItem value="RECURRENTE">Tarjeta Crédito / En línea (Recurrente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'RECURRENTE' && checkoutUrl ? (
              <div className="border rounded-lg p-5 text-center bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mt-4">
                <CreditCard size={32} className="text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-2">Enlace de Pago Generado</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Abre la pasarela de Recurrente en una nueva pestaña para que el cliente ingrese su tarjeta.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => window.open(checkoutUrl, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    Abrir Pasarela de Pago
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutUrl);
                      toast.success('Enlace copiado al portapapeles');
                    }}
                  >
                    Copiar Enlace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toast.success('Una vez el cliente pague, la membresía se activará automáticamente');
                      finalizeAssignMembership('RECURRENTE');
                    }}
                  >
                    Ya completó el pago
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setWaitingPayment(false); setCheckoutUrl(null); }}
                    className="text-muted-foreground"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : paymentMethod === 'RECURRENTE' ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 mt-2">
                Haz clic en "Pagar con Tarjeta" para generar el enlace de pago seguro de Recurrente.
              </div>
            ) : null}

            {paymentMethod !== 'RECURRENTE' && paymentType === 'single' ? (
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
                  const cuotaMonto = plan.price;
                  const total = cuotaMonto * parseInt(numInstallments);
                  return (
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-1 mt-2">
                      <p className="text-sm font-semibold">Vista Previa del Plan</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Monto por cuota:</span>
                          <span className="font-bold text-blue-600">{formatCurrency(cuotaMonto)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cantidad de cuotas:</span>
                          <span className="font-bold">{numInstallments}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span>Total del plan:</span>
                          <span className="font-bold text-lg">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {paymentMethod === 'TRANSFER' && (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                <h4 className="font-semibold text-sm">Datos de Transferencia</h4>
                <div className="space-y-2">
                  <Label htmlFor="transferDate">Fecha de Boleta / Transferencia</Label>
                  <Input
                    type="date"
                    id="transferDate"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Número de Referencia / Boleta *</Label>
                  <Input
                    id="reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej. AB01239"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferDocument">Comprobante / Boleta (Opcional)</Label>
                  <Input
                    id="transferDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                        toast.error('Solo se permiten imágenes o PDF');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setTransferDocument(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  {transferDocument && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check size={12} /> Documento adjuntado
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentMethod !== 'TRANSFER' && paymentMethod !== 'RECURRENTE' && (
              <div className="space-y-2">
                <Label htmlFor="reference">Referencia (Opcional)</Label>
                <Input
                  id="reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Número de transacción o recibo"
                />
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsMembershipDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              {paymentMethod !== 'RECURRENTE' || !waitingPayment ? (
                <Button type="submit" disabled={isAssigning} className="flex-1">
                  {isAssigning ? 'Procesando...' : paymentMethod === 'RECURRENTE' ? 'Pagar con Tarjeta' : paymentType === 'single' ? 'Asignar y Pagar' : `Asignar con ${numInstallments} Cuotas`}
                </Button>
              ) : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <FingerprintCaptureModal
        open={isFingerprintDialogOpen}
        onClose={() => setIsFingerprintDialogOpen(false)}
        onCapture={handleRegisterFingerprint}
        clientName={client.name}
      />

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
