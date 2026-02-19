import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import type { MembershipPlan } from '@/types/models';
import { Check, Camera, Upload, X, Fingerprint, CreditCard } from '@phosphor-icons/react';
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
  const [notes, setNotes] = useState('');

  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [fingerprintId, setFingerprintId] = useState<string>('');
  const [fingerprintBase64, setFingerprintBase64] = useState<string>('');
  const [fingerprintRegisteredAt, setFingerprintRegisteredAt] = useState<string>('');

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'STRIPE'>('CASH');
  const [autoRenew, setAutoRenew] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const activePlans = plans.filter(p => p.published);
  const selectedPlan = activePlans.find(p => p.id === selectedPlanId);

  const endDate = selectedPlan ? calculateEndDate(startDate, selectedPlan.durationDays) : '';

  // Forzar pago con tarjeta si renovación automática está activa
  useEffect(() => {
    if (autoRenew && paymentMethod !== 'STRIPE') {
      setPaymentMethod('STRIPE');
    }
  }, [autoRenew, paymentMethod]);

  // Forzar pago con tarjeta si renovación automática está activa
  useEffect(() => {
    if (autoRenew && paymentMethod !== 'STRIPE') {
      setPaymentMethod('STRIPE');
    }
  }, [autoRenew]);

  // Forzar pago con tarjeta si renovación automática está activa
  useEffect(() => {
    if (autoRenew && paymentMethod !== 'STRIPE') {
      setPaymentMethod('STRIPE');
    }
  }, [autoRenew]);

  const handleReset = () => {
    setStep(1);
    setName('');
    setPhone('');
    setEmail('');
    setDpi('');
    setNotes('');
    setProfilePhoto('');
    setFingerprintId('');
    setFingerprintRegisteredAt('');
    setSelectedPlanId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setAutoRenew(false);
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
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

  const handleSimulateStripePayment = async () => {
    toast.success('Pago simulado exitoso');
    await handleFinish('STRIPE');
  };

  const handleFinish = async (finalPaymentMethod?: typeof paymentMethod) => {
    setIsSubmitting(true);

    try {
      const newClient = await clientsService.create({
        name,
        phone,
        email,
        dpi,
        notes,
        status: 'INACTIVE',
        profilePhoto,
        // fingerprint info is sent separately or if backend supported it
        // We will send it after creation
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
        const hasPaid = method !== 'STRIPE';

        try {
          const result = await membershipsService.assignMembership(
            newClient.id,
            selectedPlanId,
            method,
            selectedPlan.price
          );

          if (hasPaid) {
            cashService.createMovement({
              type: 'IN',
              amount: selectedPlan.price,
              category: 'Membresía',
              description: `Pago de membresía: ${selectedPlan.name} - ${newClient.name}`,
              reference: result.membership?.id?.toString() || '',
            });

            toast.success(`Cliente creado con membresía activa`);
          } else {
            toast.success(`Cliente creado. Membresía pendiente de pago.`);
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Error al asignar membresía');
        }
      } else {
        toast.success('Cliente creado sin membresía');
      }

      handleReset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al crear cliente');
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
                  Opcional: Selecciona un plan o déjalo vacío para asignar después
                </p>

                {activePlans.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No hay planes publicados disponibles
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {activePlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={cn(
                          'cursor-pointer transition-all',
                          selectedPlanId === plan.id
                            ? 'border-primary bg-primary/5'
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
                                <Badge variant="secondary">${plan.price}</Badge>
                                <Badge variant="outline">{plan.durationDays} días</Badge>
                              </div>
                            </div>
                            {selectedPlanId === plan.id && (
                              <Check size={24} className="text-primary" weight="bold" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No se seleccionó ningún plan. El cliente se creará sin membresía.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Plan seleccionado</p>
                            <p className="font-bold text-lg">{selectedPlan?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-bold text-2xl">${selectedPlan?.price}</p>
                          </div>
                        </div>
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
                          <SelectItem value="STRIPE">
                            Tarjeta de Crédito/Débito {autoRenew && '✓'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'STRIPE' && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard size={20} className="text-primary" />
                          <h4 className="font-semibold">Datos de Tarjeta</h4>
                        </div>

                        <div>
                          <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                          <Input
                            id="cardNumber"
                            value={cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                              const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                              setCardNumber(formatted);
                            }}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                        </div>

                        <div>
                          <Label htmlFor="cardHolder">Titular de la Tarjeta</Label>
                          <Input
                            id="cardHolder"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cardExpiry">Vencimiento</Label>
                            <Input
                              id="cardExpiry"
                              value={cardExpiry}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                setCardExpiry(value.slice(0, 5));
                              }}
                              placeholder="MM/AA"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cardCvv">CVV</Label>
                            <Input
                              id="cardCvv"
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardContent className="p-3">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              <strong>Modo DEMO:</strong> Los datos de tarjeta se guardan localmente solo para demostración.
                              En producción, se integraría con Stripe para procesamiento seguro.
                            </p>
                          </CardContent>
                        </Card>

                        <Button
                          onClick={handleSimulateStripePayment}
                          disabled={isSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                          className="w-full"
                        >
                          <CreditCard size={20} className="mr-2" />
                          Procesar Pago (Demo)
                        </Button>
                      </div>
                    )}

                    {autoRenew && (
                      <Card className="bg-primary/5 border-primary/20">
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
                disabled={isSubmitting || (selectedPlanId !== '' && paymentMethod === 'STRIPE')}
              >
                {isSubmitting ? 'Creando...' : 'Finalizar'}
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
