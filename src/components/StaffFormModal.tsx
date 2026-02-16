import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersService } from '@/services/users.service';
import type { User, CreateUserData, UpdateUserData } from '@/types/models';
import { toast } from 'sonner';
import { UserCircle, Upload, Fingerprint, Images, Camera } from '@phosphor-icons/react';
import { FingerprintRegistration } from './FingerprintRegistration';
import { PhotoGalleryManager } from './PhotoGalleryManager';
import { WebcamCapture } from './WebcamCapture';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: User | null;
  roles: any[];
}

export function StaffFormModal({ isOpen, onClose, onSuccess, editingUser, roles }: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    birthDate: '',
    position: '',
    hireDate: '',
    salary: '',
    roleId: '',
    active: true,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    notes: '',
    photo: '',
    photos: [] as string[],
    cvUrl: '',
    fingerprintId: '',
    fingerprintRegisteredAt: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState<'basic' | 'work' | 'emergency' | 'documents' | 'biometric' | 'photos'>('basic');
  const [showWebcam, setShowWebcam] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          name: editingUser.name || '',
          username: editingUser.username || '',
          email: editingUser.email || '',
          password: '',
          confirmPassword: '',
          phone: editingUser.phone || '',
          address: editingUser.address || '',
          birthDate: editingUser.birthDate || '',
          position: editingUser.position || '',
          hireDate: editingUser.hireDate || '',
          salary: editingUser.salary?.toString() || '',
          roleId: editingUser.roleId || '',
          active: editingUser.active,
          emergencyContactName: editingUser.emergencyContact?.name || '',
          emergencyContactPhone: editingUser.emergencyContact?.phone || '',
          emergencyContactRelationship: editingUser.emergencyContact?.relationship || '',
          notes: editingUser.notes || '',
          photo: editingUser.photo || '',
          photos: editingUser.photos || [],
          cvUrl: editingUser.cvUrl || '',
          fingerprintId: editingUser.fingerprintId || '',
          fingerprintRegisteredAt: editingUser.fingerprintRegisteredAt || '',
        });
      } else {
        setFormData({
          name: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          address: '',
          birthDate: '',
          position: '',
          hireDate: new Date().toISOString().split('T')[0],
          salary: '',
          roleId: roles[0]?.id || '',
          active: true,
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelationship: '',
          notes: '',
          photo: '',
          photos: [],
          cvUrl: '',
          fingerprintId: '',
          fingerprintRegisteredAt: '',
        });
      }
      setErrors({});
      setCurrentTab('basic');
    }
  }, [isOpen, editingUser, roles]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.username.trim()) newErrors.username = 'El usuario es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    if (!editingUser) {
      if (!formData.password) newErrors.password = 'La contraseña es requerida';
      else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.roleId) newErrors.roleId = 'El rol es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          birthDate: formData.birthDate || undefined,
          position: formData.position || undefined,
          hireDate: formData.hireDate || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          roleId: formData.roleId,
          active: formData.active,
          photo: formData.photo || undefined,
          photos: formData.photos.length > 0 ? formData.photos : undefined,
          cvUrl: formData.cvUrl || undefined,
          notes: formData.notes || undefined,
          fingerprintId: formData.fingerprintId || undefined,
          fingerprintRegisteredAt: formData.fingerprintRegisteredAt || undefined,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (formData.emergencyContactName && formData.emergencyContactPhone) {
          updateData.emergencyContact = {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || 'No especificado',
          };
        }

        usersService.updateUser(editingUser.id, updateData);
        toast.success('Usuario actualizado correctamente');
      } else {
        const createData: CreateUserData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          birthDate: formData.birthDate || undefined,
          position: formData.position || undefined,
          hireDate: formData.hireDate || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          roleId: formData.roleId,
          active: formData.active,
          photo: formData.photo || undefined,
          photos: formData.photos.length > 0 ? formData.photos : undefined,
          cvUrl: formData.cvUrl || undefined,
          notes: formData.notes || undefined,
          fingerprintId: formData.fingerprintId || undefined,
          fingerprintRegisteredAt: formData.fingerprintRegisteredAt || undefined,
        };

        if (formData.emergencyContactName && formData.emergencyContactPhone) {
          createData.emergencyContact = {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || 'No especificado',
          };
        }

        usersService.createUser(createData);
        toast.success('Usuario creado correctamente');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar usuario');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterFingerprint = () => {
    const fpId = `FP-STAFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    handleChange('fingerprintId', fpId);
    handleChange('fingerprintRegisteredAt', new Date().toISOString());
    toast.success('Huella digital registrada (demo)');
  };

  const handleRemoveFingerprint = () => {
    handleChange('fingerprintId', '');
    handleChange('fingerprintRegisteredAt', '');
    toast.info('Huella digital eliminada');
  };

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: UserCircle },
    { id: 'work', label: 'Información Laboral', icon: UserCircle },
    { id: 'biometric', label: 'Huella Digital', icon: Fingerprint },
    { id: 'photos', label: 'Galería de Fotos', icon: Images },
    { id: 'emergency', label: 'Contacto de Emergencia', icon: UserCircle },
    { id: 'documents', label: 'Documentos y Notas' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-3xl font-bold">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {editingUser 
              ? 'Actualiza la información del usuario y del personal'
              : 'Completa los datos para crear un nuevo usuario del sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b overflow-x-auto pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id as any)}
                className={`px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Información Básica */}
          {currentTab === 'basic' && (
            <div className="space-y-6 px-1">
              {/* Foto de perfil */}
              <div className="space-y-4">
                {showWebcam ? (
                  <WebcamCapture
                    onCapture={(photoDataUrl) => {
                      handleChange('photo', photoDataUrl);
                      setShowWebcam(false);
                    }}
                    onClose={() => setShowWebcam(false)}
                  />
                ) : (
                  <div className="flex items-center gap-6 p-4 bg-accent/20 rounded-lg">
                    <div className="relative">
                      {formData.photo ? (
                        <img 
                          src={formData.photo} 
                          alt="Preview"
                          className="w-28 h-28 rounded-full object-cover border-4 border-primary shadow-lg"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                          <UserCircle size={56} className="text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="photo" className="text-base font-semibold">Foto de Perfil</Label>
                      <p className="text-sm text-muted-foreground mb-3">Imagen principal del usuario (formato: JPG, PNG)</p>
                      <div className="flex gap-2">
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo')?.click()}
                          className="gap-2"
                        >
                          <Upload size={18} />
                          Subir Foto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowWebcam(true)}
                          className="gap-2"
                        >
                          <Camera size={18} weight="duotone" />
                          Usar Cámara
                        </Button>
                        {formData.photo && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleChange('photo', '')}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Juan Pérez García"
                    className={`mt-1.5 ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="username" className="text-sm font-medium">Nombre de Usuario *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="jperez"
                    className={`mt-1.5 ${errors.username ? 'border-destructive' : ''}`}
                  />
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="juan@example.com"
                    className={`mt-1.5 ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="1234-5678"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate" className="text-sm font-medium">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Calle, zona, ciudad"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña {editingUser ? '(opcional)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={`mt-1.5 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`mt-1.5 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Información Laboral */}
          {currentTab === 'work' && (
            <div className="space-y-6 px-1">
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <Label htmlFor="position" className="text-sm font-medium">Puesto/Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="Ej: Recepcionista, Entrenador"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="roleId" className="text-sm font-medium">Rol del Sistema *</Label>
                  <Select value={formData.roleId} onValueChange={(value) => handleChange('roleId', value)}>
                    <SelectTrigger className={`mt-1.5 ${errors.roleId ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleId && <p className="text-xs text-destructive mt-1">{errors.roleId}</p>}
                </div>

                <div>
                  <Label htmlFor="hireDate" className="text-sm font-medium">Fecha de Ingreso</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleChange('hireDate', e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="salary" className="text-sm font-medium">Salario (Opcional)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">💰 Esta información es confidencial</p>
                </div>

                <div className="col-span-3 mt-2">
                  <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                    <div>
                      <Label htmlFor="active" className="text-base font-semibold">Estado del Usuario</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Los usuarios inactivos no pueden acceder al sistema
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleChange('active', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Huella Digital */}
          {currentTab === 'biometric' && (
            <div className="space-y-6 px-1">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-2 text-purple-900 dark:text-purple-100">
                  🔐 Registro Biométrico del Personal
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  El sistema de huella digital permite controlar el acceso del staff al gimnasio y registrar
                  su asistencia de forma automática y segura.
                </p>
              </div>
              <FingerprintRegistration
                fingerprintId={formData.fingerprintId}
                fingerprintRegisteredAt={formData.fingerprintRegisteredAt}
                onRegister={handleRegisterFingerprint}
                onRemove={handleRemoveFingerprint}
                entityType="staff"
              />
            </div>
          )}

          {/* Tab: Galería de Fotos */}
          {currentTab === 'photos' && (
            <div className="space-y-6 px-1">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-100">
                  📸 Galería de Fotos del Staff
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Las fotos del staff se mostrarán en su perfil y podrán ser utilizadas para promoción interna
                  del gimnasio, eventos, redes sociales y material publicitario. Máximo 15 fotos por persona.
                </p>
              </div>
              <PhotoGalleryManager
                photos={formData.photos}
                onPhotosChange={(photos) => handleChange('photos', photos)}
                maxPhotos={15}
              />
            </div>
          )}

          {/* Tab: Contacto de Emergencia */}
          {currentTab === 'emergency' && (
            <div className="space-y-6 px-1">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>ℹ️ Información importante:</strong> Estos datos serán utilizados solo en caso de emergencia
                  médica o situaciones críticas que requieran contactar a un familiar o persona cercana.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <Label htmlFor="emergencyContactName" className="text-sm font-medium">Nombre del Contacto</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    placeholder="Juan Pérez"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactPhone" className="text-sm font-medium">Teléfono</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    placeholder="1234-5678"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactRelationship" className="text-sm font-medium">Relación/Parentesco</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                    placeholder="Ej: Padre, Madre, Esposo/a"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Documentos y Notas */}
          {currentTab === 'documents' && (
            <div className="space-y-6 px-1">
              <div className="bg-accent/20 rounded-lg p-5">
                <div className="space-y-3">
                  <Label htmlFor="cvUrl" className="text-sm font-medium">Hoja de Vida (CV) - Documento PDF o enlace</Label>
                  <Input
                    id="cvUrl"
                    type="url"
                    value={formData.cvUrl}
                    onChange={(e) => handleChange('cvUrl', e.target.value)}
                    placeholder="https://ejemplo.com/cv-juan-perez.pdf"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    📄 Ingrese la URL del archivo o documento del currículum vitae del staff
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-medium">Notas y Observaciones Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional relevante sobre el usuario, observaciones especiales, historial laboral, competencias destacadas, etc..."
                  rows={10}
                  className="mt-1.5 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Espacio para agregar cualquier información adicional que considere importante sobre este miembro del staff
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-8 gap-3">
            <Button type="button" variant="outline" onClick={onClose} size="lg" className="min-w-32">
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="min-w-32">
              {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
