import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usersService } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
import type { User, CreateUserData, UpdateUserData } from '@/types/models';
import { toast } from 'sonner';
import {
    UserCircle,
    Upload,
    ArrowLeft,
    FloppyDisk,
    PlusCircle,
    Camera,
    MagnifyingGlassPlus,
    X,
    FilePdf,
    FileImage,
    Eye,
    EyeSlash
} from '@phosphor-icons/react';
import { FingerprintRegistration } from '@/components/FingerprintRegistration';
import { PhotoGalleryManager } from '@/components/PhotoGalleryManager';
import { WebcamCapture } from '@/components/WebcamCapture';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';


export function StaffForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

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
        hireDate: new Date().toISOString().split('T')[0],
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
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    //ver las contraseñas en texto plano
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [documents, setDocuments] = useState<{
        name: string;
        url: string;
        type: string;
        category: string;
        file?: File;
    }[]>([]);
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<{ name: string; url: string; type: string } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newDocItems = Array.from(files).filter(file => {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Archivo no permitido: ${file.name}`);
                return false;
            }
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`El archivo ${file.name} supera 50MB`);
                return false;
            }
            return true;
        }).map(file => ({
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type,
            category: 'staff_doc',
            file: file
        }));

        setDocuments((prev) => [...prev, ...newDocItems]);
        // Reset input
        e.target.value = '';
    };
    const removeDocument = (index: number) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const clearDocuments = () => {
        setDocuments([]);
        toast.info('Documentos eliminados');
    };










    useEffect(() => {
        loadRoles();
        if (isEditing && id) {
            loadUser(id);
        }
    }, [id]);

    const loadRoles = async () => {
        const allRoles = await rolesService.getAllRoles();
        setRoles(allRoles);
        if (!formData.roleId && allRoles.length > 0) {
            setFormData(prev => ({ ...prev, roleId: allRoles[0].id }));
        }
    };

    const loadUser = async (userId: string) => {
        setIsLoading(true);
        try {
            const user = await usersService.getUserById(userId);
            if (user) {
                setFormData({
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    password: '',
                    confirmPassword: '',
                    phone: user.phone || '',
                    address: user.address || '',
                    birthDate: user.birthDate || '',
                    position: user.position || '',
                    hireDate: user.hireDate || '',
                    salary: user.salary?.toString() || '',
                    roleId: user.roleId || '',
                    active: user.active,
                    emergencyContactName: user.emergencyContact?.name || '',
                    emergencyContactPhone: user.emergencyContact?.phone || '',
                    emergencyContactRelationship: user.emergencyContact?.relationship || '',
                    notes: user.notes || '',
                    photo: user.photo || '',
                    photos: user.photos || [],
                    cvUrl: user.cvUrl || '',
                    fingerprintId: user.fingerprintId || '',
                    fingerprintRegisteredAt: user.fingerprintRegisteredAt || '',
                });

                if (user.documents) {
                    setDocuments(user.documents.map(doc => ({
                        name: doc.name,
                        url: doc.url,
                        type: doc.type || 'application/pdf',
                        category: doc.category || 'staff_doc'
                    })));
                }
            }
        } catch (error) {
            toast.error('Error al cargar el usuario');
            navigate('/admin/staff');
        } finally {
            setIsLoading(false);
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
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('El archivo debe ser una imagen');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange('photo', reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRegisterFingerprint = () => {
        const fingerprintId = `FP-STAFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const registeredAt = new Date().toISOString();
        handleChange('fingerprintId', fingerprintId);
        handleChange('fingerprintRegisteredAt', registeredAt);
        toast.success('Huella digital registrada (Demo)');
    };

    const handleRemoveFingerprint = () => {
        handleChange('fingerprintId', '');
        handleChange('fingerprintRegisteredAt', '');
        toast.info('Huella digital eliminada');
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.username.trim()) newErrors.username = 'El nombre de usuario es requerido';
        if (!formData.email.trim()) newErrors.email = 'El email es requerido';
        if (!formData.roleId) newErrors.roleId = 'Debe seleccionar un rol';

        if (!isEditing) {
            if (!formData.password) newErrors.password = 'La contraseña es requerida';
            if (formData.password && formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        } else {
            if (formData.password && formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }
            if (formData.password && formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (createAnother: boolean = false) => {
        if (!validateForm()) {
            toast.error('Por favor corrige los errores en el formulario');
            setCurrentTab('basic');
            return;
        }

        setIsSaving(true);

        const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        };

        try {
            // Procesar documentos para el envío
            const processedDocuments = await Promise.all(
                documents.map(async (doc) => {
                    if (doc.file) {
                        return {
                            name: doc.name,
                            url: await fileToBase64(doc.file),
                            type: doc.type.split('/')[1] || 'pdf',
                            category: doc.category
                        };
                    }
                    return {
                        name: doc.name,
                        url: doc.url,
                        type: doc.type,
                        category: doc.category
                    };
                })
            );

            if (isEditing) {
                const updateData: UpdateUserData = {
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    birthDate: formData.birthDate,
                    position: formData.position,
                    hireDate: formData.hireDate,
                    salary: formData.salary ? parseFloat(formData.salary) : undefined,
                    roleId: formData.roleId,
                    active: formData.active,
                    photo: formData.photo,
                    photos: formData.photos,
                    documents: processedDocuments,
                    cvUrl: formData.cvUrl,
                    notes: formData.notes,
                    fingerprintId: formData.fingerprintId,
                    fingerprintRegisteredAt: formData.fingerprintRegisteredAt,
                    emergencyContact: {
                        name: formData.emergencyContactName,
                        phone: formData.emergencyContactPhone,
                        relationship: formData.emergencyContactRelationship,
                    },
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await usersService.updateUser(id!, updateData);
                toast.success('Usuario actualizado exitosamente');
                navigate('/admin/staff');
            } else {
                const createData: CreateUserData = {
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    address: formData.address,
                    birthDate: formData.birthDate,
                    position: formData.position,
                    hireDate: formData.hireDate,
                    salary: formData.salary ? parseFloat(formData.salary) : undefined,
                    roleId: formData.roleId,
                    active: formData.active,
                    photo: formData.photo,
                    photos: formData.photos,
                    documents: processedDocuments,
                    cvUrl: formData.cvUrl,
                    notes: formData.notes,
                    fingerprintId: formData.fingerprintId,
                    fingerprintRegisteredAt: formData.fingerprintRegisteredAt,
                    emergencyContact: {
                        name: formData.emergencyContactName,
                        phone: formData.emergencyContactPhone,
                        relationship: formData.emergencyContactRelationship,
                    },
                };

                await usersService.createUser(createData);
                toast.success('Usuario creado exitosamente');

                if (createAnother) {
                    // Reset form
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
                    setCurrentTab('basic');
                    setErrors({});
                    setDocuments([]);
                    toast.info('Puedes crear otro usuario');
                } else {
                    navigate('/admin/staff');
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar el usuario');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'basic', label: 'Información Básica' },
        { id: 'work', label: 'Información Laboral' },
        { id: 'biometric', label: 'Huella Digital' },
        { id: 'photos', label: 'Galería de Fotos' },
        { id: 'emergency', label: 'Contacto de Emergencia' },
        { id: 'documents', label: 'Documentos y Notas' },
    ] as const;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/staff')}
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold">
                            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditing ? 'Actualiza la información del staff' : 'Completa el formulario para crear un nuevo miembro del staff'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b overflow-x-auto pb-0 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${currentTab === tab.id
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <Card>
                <CardContent className="p-8">
                    {/* Tab: Información Básica */}
                    {currentTab === 'basic' && (
                        <div className="space-y-6">
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
                                        placeholder="juanperez"
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
                                        placeholder="juan@irongym.com"
                                        className={`mt-1.5 ${errors.email ? 'border-destructive' : ''}`}
                                    />
                                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        {isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                                    </Label>

                                    <div className="relative mt-1.5">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            placeholder={isEditing ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                                            className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                                </div>


                                <div>
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                        Confirmar Contraseña
                                    </Label>

                                    <div className="relative mt-1.5">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                            placeholder="Repetir contraseña"
                                            className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {errors.confirmPassword && (
                                        <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                                    )}
                                </div>


                                <div>
                                    <Label htmlFor="roleId" className="text-sm font-medium">Rol del Sistema *</Label>
                                    <Select value={formData.roleId} onValueChange={(value) => handleChange('roleId', value)}>
                                        <SelectTrigger className={`mt-1.5 ${errors.roleId ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Seleccionar rol" />
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
                                    <Label htmlFor="phone" className="text-sm font-medium">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="1234-5678"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label htmlFor="address" className="text-sm font-medium">Dirección</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        placeholder="Calle Principal #123, Ciudad"
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
                            </div>
                        </div>
                    )}

                    {/* Tab: Información Laboral */}
                    {currentTab === 'work' && (
                        <div className="space-y-6 px-1">
                            <div className="grid grid-cols-3 gap-5">
                                <div>
                                    <Label htmlFor="position" className="text-sm font-medium">Cargo/Posición</Label>
                                    <Input
                                        id="position"
                                        value={formData.position}
                                        onChange={(e) => handleChange('position', e.target.value)}
                                        placeholder="Ej: Entrenador Personal, Recepcionista"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hireDate" className="text-sm font-medium">Fecha de Contratación</Label>
                                    <Input
                                        id="hireDate"
                                        type="date"
                                        value={formData.hireDate}
                                        onChange={(e) => handleChange('hireDate', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="salary" className="text-sm font-medium">Salario (opcional)</Label>
                                    <Input
                                        id="salary"
                                        type="number"
                                        step="0.01"
                                        value={formData.salary}
                                        onChange={(e) => handleChange('salary', e.target.value)}
                                        placeholder="0.00"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div className="col-span-3">
                                    <Label htmlFor="cvUrl" className="text-sm font-medium">Link a Hoja de Vida (CV) / LinkedIn</Label>
                                    <Input
                                        id="cvUrl"
                                        value={formData.cvUrl}
                                        onChange={(e) => handleChange('cvUrl', e.target.value)}
                                        placeholder="https://ejemplo.com/mi-cv"
                                        className="mt-1.5"
                                    />
                                </div>

                                <div className="col-span-3">
                                    <div className="bg-accent/20 rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="active" className="text-sm font-medium">Estado del Usuario</Label>
                                            <p className="text-xs text-muted-foreground mt-1">
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

                            {/* Subida de documentos */}
                            <div className="bg-accent/20 rounded-lg p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Documentos del Staff (CV, Antecedentes, etc.)
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Formatos permitidos: PDF, JPG, PNG — Máx. 50 MB por archivo
                                        </p>
                                    </div>

                                    {/* Botón limpiar todo */}
                                    {documents.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={clearDocuments}
                                        >
                                            Eliminar todos
                                        </Button>
                                    )}
                                </div>

                                <Input
                                    type="file"
                                    multiple={true} // Se habilita la carga múltiple
                                    accept=".pdf,image/*"
                                    onChange={handleFileUpload}
                                />

                                {/* Lista de archivos */}
                                {documents.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {documents.map((doc, index) => {
                                            const isImage = doc.type.startsWith('image/');
                                            const isPdf = doc.type.includes('pdf');

                                            return (
                                                <div
                                                    key={index}
                                                    className="group border rounded-xl overflow-hidden bg-card transition-all hover:shadow-md border-border/50"
                                                >
                                                    {/* Vista previa miniatura */}
                                                    <div className="relative aspect-video bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                                                        {isImage ? (
                                                            <div className="w-full h-full flex items-center justify-center p-2">
                                                                <FileImage size={40} className="text-primary/40 absolute group-hover:scale-110 transition-transform" />
                                                                <img
                                                                    src={doc.url}
                                                                    alt={doc.name}
                                                                    className="w-full h-full object-cover rounded-sm z-10 opacity-90 group-hover:opacity-100"
                                                                />
                                                            </div>
                                                        ) : isPdf ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <FilePdf size={48} weight="fill" className="text-destructive/60" />
                                                                <span className="text-[10px] font-medium px-2 py-0.5 bg-destructive/10 text-destructive rounded uppercase tracking-wider">PDF Document</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Upload size={48} className="text-muted-foreground/30" />
                                                                <span className="text-xs text-muted-foreground">Archivo</span>
                                                            </div>
                                                        )}

                                                        {/* Overlay de acciones rápidas */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-full"
                                                                onClick={() => setSelectedFileForPreview({ name: doc.name, url: doc.url, type: doc.type })}
                                                                title="Vista previa ampliada"
                                                            >
                                                                <MagnifyingGlassPlus size={18} />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-full"
                                                                onClick={() => removeDocument(index)}
                                                                title="Eliminar archivo"
                                                            >
                                                                <X size={18} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Info del archivo */}
                                                    <div className="p-3 flex items-center justify-between gap-2 border-t border-border/50">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={doc.name}>
                                                                {doc.name}
                                                            </p>
                                                            {doc.file && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {(doc.file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            <div className="space-y-3">
                                <Label htmlFor="notes" className="text-sm font-medium">
                                    Notas y Observaciones Adicionales
                                </Label>

                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Información adicional relevante del miembro del staff, historial laboral, competencias destacadas, observaciones administrativas, etc."
                                    rows={8}
                                    className="mt-1.5 resize-none"
                                />

                                <p className="text-xs text-muted-foreground">
                                    Este espacio es solo interno y no será visible públicamente.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 gap-4 bg-card p-6 rounded-lg border shadow-sm">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/staff')}
                    size="lg"
                    disabled={isSaving}
                    className="gap-2"
                >
                    <ArrowLeft size={20} />
                    Cancelar y Volver
                </Button>

                <div className="flex gap-3">
                    {!isEditing && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSave(true)}
                            disabled={isSaving}
                            size="lg"
                            className="gap-2"
                        >
                            <PlusCircle size={20} weight="bold" />
                            Guardar y Crear Otro
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        size="lg"
                        className="gap-2 min-w-40"
                    >
                        <FloppyDisk size={20} weight="bold" />
                        {isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Usuario'}
                    </Button>
                </div>
            </div>

            {/* Modal de Vista Previa Ampliada */}
            <Dialog open={!!selectedFileForPreview} onOpenChange={(open) => !open && setSelectedFileForPreview(null)}>
                <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-1">
                    <DialogHeader className="px-5 py-3 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            {selectedFileForPreview?.type.startsWith('image/') ? <FileImage size={20} /> : <FilePdf size={20} />}
                            <span className="truncate">{selectedFileForPreview?.name}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 bg-muted/30 rounded-b-lg overflow-hidden flex items-center justify-center">
                        {selectedFileForPreview && (
                            selectedFileForPreview.type.startsWith('image/') ? (
                                <img
                                    src={selectedFileForPreview.url}
                                    alt={selectedFileForPreview.name}
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                            ) : selectedFileForPreview.type.includes('pdf') ? (
                                <iframe
                                    src={selectedFileForPreview.url}
                                    className="w-full h-full border-0"
                                    title={selectedFileForPreview.name}
                                />
                            ) : (
                                <div className="text-center p-10">
                                    <Upload size={64} className="mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground">No hay vista previa disponible para este tipo de archivo.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = selectedFileForPreview.url;
                                            a.download = selectedFileForPreview.name;
                                            a.click();
                                        }}
                                    >
                                        Descargar para ver
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
