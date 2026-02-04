import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WebcamCaptureModal } from './WebcamCaptureModal';
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
  const [fingerprintId, setFingerprintId] = useState<string>('');
  const [fingerprintRegisteredAt, setFingerprintRegisteredAt] = useState<string>('');

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'STRIPE'>('CASH');

  const activePlans = plans.filter(p => p.published);
  const selectedPlan = activePlans.find(p => p.id === selectedPlanId);
  
  const endDate = selectedPlan ? calculateEndDate(startDate, selectedPlan.durationDays) : '';

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

  const handleRegisterFingerprint = () => {
    const fpId = `FP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setFingerprintId(fpId);
    setFingerprintRegisteredAt(new Date().toISOString());
    toast.success('Huella registrada (demo)');
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
      const newClient = clientsService.create({
        name,
        phone,
        email,
        dpi,
        notes,
        status: 'INACTIVE',
        profilePhoto,
        fingerprintId,
        fingerprintRegisteredAt,
      });

      if (selectedPlanId && selectedPlan) {
        const method = finalPaymentMethod || paymentMethod;
        const hasPaid = method !== 'STRIPE';

        const membership = membershipsService.createMembership({
          clientId: newClient.id,
          planId: selectedPlanId,
          startDate,
          endDate,
          status: hasPaid ? 'ACTIVE' : 'PENDING',
        });

        const payment = paymentsService.createPayment({
          clientId: newClient.id,
          planId: selectedPlanId,
          membershipId: membership.id,
          amount: selectedPlan.price,
          method,
          status: hasPaid ? 'PAID' : 'PENDING',
        });

        if (hasPaid) {
          clientsService.update(newClient.id, {
            status: 'ACTIVE',
            membershipEnd: endDate,
          });

          cashService.createMovement({
            type: 'IN',
            amount: selectedPlan.price,
            category: 'Membresía',
            description: `Pago de membresía: ${selectedPlan.name} - ${newClient.name}`,
            reference: payment.id,
          });

          toast.success(`Cliente creado con membresía activa`);
        } else {
          toast.success(`Cliente creado. Membresía pendiente de pago.`);
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

                <div>
                  <Label>Foto de Perfil</Label>
                  <p className="text-sm text-muted-foreground mb-3">
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
                </div>

                <div className="pt-4 border-t">
                  <Label>Huella Digital (Demo)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
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
                      onClick={handleRegisterFingerprint}
                      className="w-full"
                    >
                      <Fingerprint size={20} className="mr-2" />
                      Registrar Huella (Demo)
                    </Button>
                  )}
                </div>
              </div>
            )}

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
                      <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Efectivo</SelectItem>
                          <SelectItem value="TRANSFER">Transferencia</SelectItem>
                          <SelectItem value="STRIPE">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'STRIPE' && (
                      <Card className="bg-muted">
                        <CardContent className="p-4 space-y-3">
                          <p className="text-sm font-medium">Modo DEMO: Pago con Stripe</p>
                          <p className="text-xs text-muted-foreground">
                            La integración real de Stripe requiere un backend para crear sesiones de pago y recibir webhooks. 
                            Por ahora, puedes simular un pago exitoso.
                          </p>
                          <Button
                            onClick={handleSimulateStripePayment}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            <CreditCard size={20} className="mr-2" />
                            Simular Pago Exitoso (Demo)
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Modo Real (Planificado): Redirigir a Checkout de Stripe
                          </p>
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
                disabled={isSubmitting || (selectedPlanId && paymentMethod === 'STRIPE')}
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
