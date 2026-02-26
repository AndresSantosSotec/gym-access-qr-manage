import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { WebcamCaptureModal } from './WebcamCaptureModal';
import { FingerprintCaptureModal } from './FingerprintCaptureModal';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { paymentsService } from '@/services/payments.service';
import { cashService } from '@/services/cash.service';
import { recurrenteService } from '@/services/recurrente.service';
import { recurrenteProductosService } from '@/services/recurrente-productos.service';
import { registrationProductsService } from '@/services/registration-products.service';
import { RecurrenteCheckoutEmbed } from './RecurrenteCheckoutEmbed';
import { PasoSeleccionProductos, type ProductoPagoItem } from '@/components/memberships/PasoSeleccionProductos';
import type { MembershipPlan } from '@/types/models';
import { Check, Camera, Upload, X, Fingerprint, CreditCard, MagnifyingGlass, ArrowSquareOut } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClientCreateWizardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plans: MembershipPlan[];
}

type Step = 1 | 2 | 3 | 4;

export function ClientCreateWizardModal({ open, onClose, onSuccess, plans }: ClientCreateWizardModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dpi, setDpi] = useState('');
  const [nit, setNit] = useState('');
  const [notes, setNotes] = useState('');

  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [fingerprintId, setFingerprintId] = useState<string>('');
  const [fingerprintBase64, setFingerprintBase64] = useState<string>('');
  const [fingerprintRegisteredAt, setFingerprintRegisteredAt] = useState<string>('');

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // 'RECURRENTE' = pago con tarjeta via Recurrente checkout
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'RECURRENTE'>('CASH');
  const [autoRenew, setAutoRenew] = useState(false);
  // Estado del flujo de pago Recurrente
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [checkoutClientId, setCheckoutClientId] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferDocument, setTransferDocument] = useState<string>('');

  const [planSearch, setPlanSearch] = useState('');

  // Productos de inscripción: del módulo Registration Products (/admin/registration-products)
  const [productosPago, setProductosPago] = useState<ProductoPagoItem[]>([]);
  const [selectedProductoIds, setSelectedProductoIds] = useState<number[]>([]);
  const inscriptionFee = productosPago
    .filter((p) => selectedProductoIds.includes(p.id))
    .reduce((s, p) => s + p.monto_quetzales, 0);

  const activePlans = plans.filter(p => p.published);
  const filteredPlans = activePlans.filter(p =>
    !planSearch || p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(planSearch.toLowerCase())
  );
  const selectedPlan = activePlans.find(p => p.id === selectedPlanId);

  const endDate = selectedPlan ? calculateEndDate(startDate, selectedPlan.durationDays) : '';

  // Forzar pago con Recurrente si renovación automática está activa
  useEffect(() => {
    if (autoRenew && paymentMethod !== 'RECURRENTE') {
      setPaymentMethod('RECURRENTE');
    }
  }, [autoRenew]);

  // Cargar productos de inscripción (Registration Products + Recurrente Productos) al abrir el modal
  useEffect(() => {
    if (open) {
      loadProductosPago();
    }
  }, [open]);

  const loadProductosPago = async () => {
    try {
      const [regProducts, recurProducts] = await Promise.all([
        registrationProductsService.getPublic(),
        recurrenteProductosService.getProductos({ activo: true }).catch(() => []),
      ]);
      const items: ProductoPagoItem[] = [
        ...regProducts
          .filter((p) => p.price >= 0)
          .map((p) => ({
            id: p.id,
            nombre: p.name,
            monto_centavos: Math.round(p.price * 100),
            monto_quetzales: p.price,
            tipo: 'inscripcion' as const,
          })),
        ...recurProducts.map((p) => ({
          id: p.id + 100000, // offset para no colisionar con registration ids
          nombre: p.nombre,
          monto_centavos: p.monto_centavos,
          monto_quetzales: p.monto_quetzales,
          tipo: p.tipo,
        })),
      ];
      setProductosPago(items);
    } catch (error) {
      console.error('Error loading productos de pago:', error);
    }
  };

  const toggleProducto = (id: number) => {
    setSelectedProductoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Para checkout: separar IDs de registration (1-99999) vs recurrente (100000+)
  const selectedRegistrationProductIds = selectedProductoIds.filter((id) => id < 100000);
  const selectedRecurrenteProductoIds = selectedProductoIds.filter((id) => id >= 100000).map((id) => id - 100000);

  const handleReset = () => {
    setStep(1);
    setName('');
    setPhone('');
    setEmail('');
    setDpi('');
    setNit('');
    setNotes('');
    setProfilePhoto('');
    setFingerprintId('');
    setFingerprintRegisteredAt('');
    setSelectedPlanId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setAutoRenew(false);
    setCheckoutUrl(null);
    setWaitingPayment(false);
    setCheckoutClientId(null);
    setPaymentReference('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferDocument('');
    setPlanSearch('');
    setSelectedProductoIds([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !phone.trim()) {
        toast.error('Nombre y teléfono son obligatorios');
        return;
      }
    }

    if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.warning('La imagen es mayor a 1MB, puede afectar el rendimiento');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleWebcamCapture = (base64: string) => {
    setProfilePhoto(base64);
    setIsWebcamOpen(false);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
  };

  const handleRegisterFingerprint = (base64: string) => {
    const fpId = `FP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setFingerprintId(fpId);
    setFingerprintBase64(base64);
    setFingerprintRegisteredAt(new Date().toISOString());
    setIsFingerprintModalOpen(false);
    toast.success('Huella capturada temporalmente');
  };

  const handleRemoveFingerprint = () => {
    setFingerprintId('');
    setFingerprintRegisteredAt('');
    toast.info('Huella eliminada');
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Solo se permiten imágenes o PDF');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('El archivo es mayor a 2MB, puede afectar el rendimiento');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTransferDocument(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * RECURRENTE — Embedded Checkout.
   * 1. Crea el cliente en BD.
   * 2. Obtiene checkout_url del backend.
   * 3. Carga el iframe incrustado de Recurrente dentro del modal.
   * El webhook de Recurrente activará la membresía automáticamente.
   */
  const handleOpenRecurrenteCheckout = async () => {
    if (!selectedPlanId || !selectedPlan) {
      toast.error('Selecciona un plan primero');
      return;
    }
    if (!name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Crear el cliente en el backend
      const newClient = await clientsService.create({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        dpi: dpi.trim() || null,
        nit: nit.trim() || null,
        notes: notes.trim() || null,
        profilePhoto,
      });

      setCheckoutClientId(Number(newClient.id));

      // 2. Obtener URL de checkout de Recurrente (plan + productos seleccionados)
      const successUrl = `${window.location.origin}/p/pago-exitoso?client_id=${newClient.id}`;
      const cancelUrl = `${window.location.origin}/p/pago-fallido`;
      const checkoutResponse = await recurrenteProductosService.createCheckoutProductos(
        Number(newClient.id),
        {
          planId: parseInt(selectedPlanId, 10),
          registrationProductIds: selectedRegistrationProductIds.length > 0 ? selectedRegistrationProductIds : undefined,
          productoIds: selectedRecurrenteProductoIds.length > 0 ? selectedRecurrenteProductoIds : undefined,
          successUrl,
          cancelUrl,
        }
      );

      console.log('[DEBUG] Recurrente checkout response completo:', checkoutResponse);

      const { checkout_url } = checkoutResponse;

      if (!checkout_url) {
        throw new Error('No se recibió URL de checkout de Recurrente. Verifica que el plan tenga recurrente_product_id asignado.');
      }

      setCheckoutUrl(checkout_url);
      setWaitingPayment(true);

      toast.info('💳 Ingresa los datos de la tarjeta en el formulario de abajo.');

    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message
        ?? (err as Error)?.message
        ?? 'No se pudo iniciar el checkout con Recurrente';
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  /** Cancelar / volver atrás desde el embedded checkout */
  const handleCancelEmbeddedCheckout = () => {
    setWaitingPayment(false);
    setCheckoutUrl(null);
    setCheckoutClientId(null);
    toast.info('Pago cancelado. Puedes intentar de nuevo.');
  };

  const handleFinish = async (finalPaymentMethod?: typeof paymentMethod) => {
    // Validate required fields
    if (!name || !name.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      return;
    }

    setIsSubmitting(true);

    try {
      const newClient = await clientsService.create({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        dpi: dpi.trim() || null,
        nit: nit.trim() || null,
        notes: notes.trim() || null,
        profilePhoto,
        // NOTE: status is set automatically by backend to 'active'
        // DO NOT send status field to avoid validation errors
      });

      if (fingerprintBase64) {
        try {
          await clientsService.registerFingerprint(newClient.id, fingerprintBase64);
          toast.success('Huella registrada en el servidor');
        } catch (fpError) {
          console.error('Error registering fingerprint', fpError);
          toast.error('Cliente creado pero falló el registro de huella');
        }
      }

      if (selectedPlanId && selectedPlan) {
        const method = finalPaymentMethod || paymentMethod;
        // Recurrente handles payment externally — treat as pending, webhook will confirm
        const hasPaid = method !== 'RECURRENTE';

        try {
          const totalAmountPaid = selectedPlan.price + inscriptionFee;
          console.log('[Wizard] Assigning membership:', {
            clientId: newClient.id,
            planId: selectedPlanId,
            method,
            totalAmountPaid,
            inscriptionFee,
          });

          const finalReference = method === 'TRANSFER' && transferDate
            ? `${paymentReference} (Fecha: ${transferDate})`
            : (paymentReference || undefined);

          const result = await membershipsService.assignMembership(
            newClient.id,
            selectedPlanId,
            method === 'RECURRENTE' ? 'CARD' : method,  // backend accepts CARD not RECURRENTE
            totalAmountPaid,
            finalReference, // reference
            'single', // paymentType
            1, // numInstallments
            undefined, // initialPayment
            inscriptionFee > 0 ? inscriptionFee : undefined, // inscriptionFee
            method === 'TRANSFER' && transferDocument ? transferDocument : undefined
          );

          console.log('[Wizard] Membership assigned successfully:', result);

          if (hasPaid) {
            try {
              cashService.createMovement({
                type: 'IN',
                amount: totalAmountPaid,
                category: 'Membresía',
                description: `Pago de membresía: ${selectedPlan.name} - ${newClient.name}`,
                reference: result.membership?.id?.toString() || '',
              });
            } catch (cashErr) {
              console.warn('[Wizard] Cash movement failed (non-critical):', cashErr);
            }

            toast.success(`Cliente creado con membresía "${selectedPlan.name}" activa`);
          } else {
            toast.success(`Cliente creado. Membresía pendiente de pago.`);
          }
        } catch (err: any) {
          console.error('[Wizard] Error assigning membership:', err.response?.data || err);
          const errorDetail = err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(', ')
            : err.response?.data?.message || 'Error desconocido al asignar membresía';
          toast.error(`Error al asignar membresía: ${errorDetail}`);
        }
      } else {
        toast.success('Cliente creado sin membresía');
      }

      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al crear cliente';
      const errors = error.response?.data?.errors;
      console.error("Backend validation error:", errors || errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nuevo Cliente</DialogTitle>
            <DialogDescription className="sr-only">Formulario para registrar un nuevo cliente</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s ? <Check size={20} weight="bold" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-2',
                      step > s ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Paso 1: Datos Básicos</h3>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 5512345678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej: juan@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dpi">DPI</Label>
                    <Input
                      id="dpi"
                      value={dpi}
                      onChange={(e) => setDpi(e.target.value)}
                      placeholder="Ej: 1234567890101"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nit">NIT <span className="text-muted-foreground text-xs">(Facturación)</span></Label>
                    <Input
                      id="nit"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      placeholder="Ej: 123456-7"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas internas sobre el cliente"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Paso 2: Identidad</h3>

                <Tabs defaultValue="photo" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="photo">
                      <Camera size={16} className="mr-2" />
                      Foto de Perfil
                    </TabsTrigger>
                    <TabsTrigger value="fingerprint">
                      <Fingerprint size={16} className="mr-2" />
                      Huella Digital
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="photo" className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Puedes subir una foto o tomarla con la cámara
                    </p>

                    {profilePhoto ? (
                      <div className="space-y-3">
                        <div className="relative w-40 h-40 mx-auto">
                          <img
                            src={profilePhoto}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg border-2 border-border"
                          />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                          >
                            <Upload size={16} className="mr-2" />
                            Cambiar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsWebcamOpen(true)}
                          >
                            <Camera size={16} className="mr-2" />
                            Cámara
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemovePhoto}
                          >
                            <X size={16} className="mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          <Upload size={20} className="mr-2" />
                          Subir Foto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsWebcamOpen(true)}
                        >
                          <Camera size={20} className="mr-2" />
                          Abrir Cámara
                        </Button>
                      </div>
                    )}

                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </TabsContent>

                  <TabsContent value="fingerprint" className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Simula el registro de huella digital
                    </p>

                    {fingerprintId ? (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Fingerprint size={24} className="text-green-600" weight="fill" />
                              </div>
                              <div>
                                <p className="font-medium">Huella Registrada</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(fingerprintRegisteredAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveFingerprint}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsFingerprintModalOpen(true)}
                        className="w-full"
                      >
                        <Fingerprint size={20} className="mr-2" />
                        Capturar Huella
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <FingerprintCaptureModal
              open={isFingerprintModalOpen}
              onClose={() => setIsFingerprintModalOpen(false)}
              onCapture={handleRegisterFingerprint}
              clientName={name || 'Nuevo Cliente'}
            />

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Paso 3: Plan de Membresía</h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona un plan de membresía para el cliente
                </p>

                {activePlans.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No hay planes publicados disponibles
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Buscar plan por nombre..."
                          value={planSearch}
                          onChange={(e) => setPlanSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {selectedPlanId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPlanId('')}
                          className="shrink-0"
                        >
                          <X size={14} className="mr-1" />
                          Quitar plan
                        </Button>
                      )}
                    </div>

                    {!selectedPlanId && (
                      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ No has seleccionado un plan. El cliente se creará <strong>sin membresía activa</strong>.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {filteredPlans.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No se encontraron planes para "{planSearch}"
                        </p>
                      ) : (
                        filteredPlans.map((plan) => (
                          <Card
                            key={plan.id}
                            className={cn(
                              'cursor-pointer transition-all',
                              selectedPlanId === plan.id
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'hover:border-primary/50'
                            )}
                            onClick={() => setSelectedPlanId(plan.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold">{plan.name}</h4>
                                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="secondary">Q{plan.price}</Badge>
                                    <Badge variant="outline">{plan.durationDays} días</Badge>
                                  </div>
                                </div>
                                {selectedPlanId === plan.id && (
                                  <Check size={24} className="text-primary" weight="bold" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-right">
                      {activePlans.length} plan{activePlans.length !== 1 ? 'es' : ''} disponible{activePlans.length !== 1 ? 's' : ''}
                    </p>
                  </>
                )}

                {selectedPlanId && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <Label htmlFor="startDate">Fecha de Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Fecha de Fin (Automática)</Label>
                      <Input value={endDate} disabled />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoRenew" className="cursor-pointer">Renovación Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          El plan se renovará automáticamente al vencer
                        </p>
                        {autoRenew && (
                          <p className="text-xs text-primary font-medium mt-1">
                            💳 Requiere pago con tarjeta
                          </p>
                        )}
                      </div>
                      <Switch
                        id="autoRenew"
                        checked={autoRenew}
                        onCheckedChange={setAutoRenew}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Paso 4: Pago</h3>

                {!selectedPlanId ? (
                  <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="p-6 text-center">
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium">⚠️ No se seleccionó ningún plan</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">El cliente se creará sin membresía activa.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setStep(3)}
                      >
                        Volver a seleccionar plan
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Plan seleccionado</p>
                            <p className="font-bold text-lg">{selectedPlan?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Valor del Plan</p>
                            <p className="font-semibold text-xl">Q{selectedPlan?.price}</p>
                          </div>
                        </div>

                        <PasoSeleccionProductos
                          productos={productosPago}
                          productosSeleccionados={selectedProductoIds}
                          onToggle={toggleProducto}
                          totalProductos={productosPago.length}
                          planPrice={selectedPlan?.price ?? 0}
                        />
                      </CardContent>
                    </Card>

                    <div>
                      <Label>Método de Pago</Label>
                      {autoRenew && (
                        <Card className="mb-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardContent className="p-3">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              ℹ️ <strong>Renovación automática activada:</strong> Solo se permite pago con tarjeta para procesar cargos recurrentes.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      <Select
                        value={paymentMethod}
                        onValueChange={(v: any) => setPaymentMethod(v)}
                        disabled={autoRenew}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH" disabled={autoRenew}>
                            Efectivo {autoRenew && '(No disponible con renovación automática)'}
                          </SelectItem>
                          <SelectItem value="TRANSFER" disabled={autoRenew}>
                            Transferencia {autoRenew && '(No disponible con renovación automática)'}
                          </SelectItem>
                          <SelectItem value="RECURRENTE">
                            Tarjeta de Crédito/Débito {autoRenew && '✓'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'RECURRENTE' && (
                      <div className="space-y-3">

                        {!waitingPayment ? (
                          // ── Estado inicial: botón para iniciar el checkout ──
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard size={20} className="text-primary" />
                              <h4 className="font-semibold">Pago con Tarjeta (Recurrente)</h4>
                            </div>
                            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-3">
                              <CardContent className="p-3">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                  <strong>Pago seguro:</strong> Al hacer clic se creará el cliente y se generará un enlace de pago que se abrirá en una nueva pestaña.
                                </p>
                              </CardContent>
                            </Card>
                            {!email.trim() && (
                              <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 mb-3">
                                <CardContent className="p-3">
                                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                    ⚠️ <strong>Requerido:</strong> Ingresa el correo del cliente en el paso anterior para poder usar pago con tarjeta.
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                            <Button
                              id="open-recurrente-checkout-btn"
                              onClick={handleOpenRecurrenteCheckout}
                              disabled={isSubmitting || !email.trim()}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard size={18} className="mr-2" />
                              {isSubmitting ? 'Generando enlace de pago...' : 'Generar Enlace de Pago'}
                            </Button>
                          </div>
                        ) : (
                          // ── Estado activo: Redirigir a Recurrente ──
                          <div className="border rounded-lg p-5 text-center bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-2">Enlace de Pago Generado</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                              Abre la pasarela de pago de Recurrente. Cuando el cliente haya completado el pago, haz clic en "Confirmar y Activar Membresía".
                            </p>
                            <div className="flex flex-col gap-3">
                              <Button
                                type="button"
                                onClick={() => window.open(checkoutUrl!, '_blank')}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                              >
                                <CreditCard size={18} className="mr-2" />
                                Abrir Pasarela de Pago
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isSubmitting}
                                onClick={async () => {
                                  // Assign membership to the already-created client
                                  if (checkoutClientId && selectedPlanId && selectedPlan) {
                                    setIsSubmitting(true);
                                    try {
                                      await membershipsService.assignMembership(
                                        String(checkoutClientId),
                                        selectedPlanId,
                                        'CARD',
                                        selectedPlan.price + inscriptionFee,
                                        `recurrente:${checkoutUrl}`,
                                        'single',
                                        1,
                                        undefined,
                                        inscriptionFee > 0 ? inscriptionFee : undefined,
                                        undefined
                                      );
                                      toast.success(`✅ Membresía "${selectedPlan.name}" activada`);
                                    } catch (err: any) {
                                      toast.error(err?.response?.data?.message || 'Error al asignar membresía');
                                    } finally {
                                      setIsSubmitting(false);
                                    }
                                  }
                                  setWaitingPayment(false);
                                  onSuccess();
                                  handleClose();
                                }}
                              >
                                {isSubmitting ? 'Activando membresía...' : '✅ Confirmar y Activar Membresía'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEmbeddedCheckout}
                                className="text-muted-foreground mt-2"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {autoRenew && (
                      <Card className="bg-primary/5 border-primary/20 mt-3">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check size={16} className="text-primary" weight="bold" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Renovación Automática Activada</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Este plan se renovará automáticamente el <strong>{endDate}</strong> usando el método de pago seleccionado.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {paymentMethod === 'TRANSFER' && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/20 mt-4">
                        <h4 className="font-semibold text-sm">Datos de Transferencia</h4>
                        <div className="space-y-2">
                          <Label htmlFor="transferDate">Fecha de Boleta / Transferencia</Label>
                          <Input
                            id="transferDate"
                            type="date"
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
                            placeholder="Ej. 120491823"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transferDocument">Comprobante / Boleta (Opcional)</Label>
                          <Input
                            id="transferDocument"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleDocumentUpload}
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
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="reference">Referencia (Opcional)</Label>
                        <Input
                          id="reference"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Número de transacción o recibo"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
            >
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={() => handleFinish()}
                disabled={isSubmitting || (selectedPlanId !== '' && paymentMethod === 'RECURRENTE')}
              >
                {isSubmitting
                  ? 'Creando...'
                  : selectedPlanId
                    ? `Procesar Pago Q ${((selectedPlan?.price ?? 0) + inscriptionFee).toFixed(2)}`
                    : 'Finalizar'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <WebcamCaptureModal
        open={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
      />
    </>
  );
}

function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + durationDays);
  return start.toISOString().split('T')[0];
}
