import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clientsService } from '@/services/clients.service';
import type { Client } from '@/types/models';
import { toast } from 'sonner';
import { Camera, Upload, X, UserCircle } from '@phosphor-icons/react';
import { WebcamCaptureModal } from '@/components/WebcamCaptureModal';

interface ClientEditModalProps {
    client: Client | null;
    open: boolean;
    onClose: () => void;
    onSuccess: (updatedClient: Client) => void;
}

export function ClientEditModal({ client, open, onClose, onSuccess }: ClientEditModalProps) {
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        email: '',
        dpi: '',
        notes: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string>('');
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);

    useEffect(() => {
        if (client && open) {
            setEditForm({
                name: client.name || '',
                phone: client.phone || '',
                email: client.email || '',
                dpi: client.dpi || '',
                notes: client.notes || '',
                status: client.status || 'ACTIVE',
            });
            setProfilePhoto(client.profilePhoto || '');
        }
    }, [client, open]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten imágenes');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.warning('La imagen supera los 2MB, puede afectar el rendimiento');
        }
        const reader = new FileReader();
        reader.onloadend = () => setProfilePhoto(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;

        if (!editForm.name || !editForm.phone) {
            toast.error('Nombre y teléfono son requeridos');
            return;
        }

        setIsSubmitting(true);
        try {
            const updated = await clientsService.update(client.id, editForm);
            if (!updated) throw new Error('No se recibió respuesta del servidor');

            // Upload new photo if changed
            if (profilePhoto && profilePhoto.startsWith('data:')) {
                try {
                    await clientsService.uploadPhoto(client.id, profilePhoto);
                    toast.success('Foto actualizada');
                } catch {
                    toast.warning('Datos guardados, pero falló la subida de la foto');
                }
            }

            toast.success('Cliente actualizado');
            onSuccess({ ...updated, profilePhoto: profilePhoto || updated.profilePhoto });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>Actualiza los datos del cliente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ── Foto de perfil ── */}
                    <div className="space-y-2">
                        <Label>Foto de Perfil</Label>
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative w-20 h-20 shrink-0">
                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Foto de perfil"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                        <UserCircle size={40} className="text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {/* Botones */}
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 flex-1"
                                        onClick={() => document.getElementById('edit-photo-upload')?.click()}
                                    >
                                        <Upload size={15} />
                                        Subir
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 flex-1"
                                        onClick={() => setIsWebcamOpen(true)}
                                    >
                                        <Camera size={15} />
                                        Cámara
                                    </Button>
                                </div>
                                {profilePhoto && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1.5 text-destructive hover:text-destructive w-full"
                                        onClick={() => setProfilePhoto('')}
                                    >
                                        <X size={14} />
                                        Eliminar foto
                                    </Button>
                                )}
                            </div>
                        </div>
                        <input
                            id="edit-photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                    </div>
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
                        <Label htmlFor="edit-dpi">DPI</Label>
                        <Input
                            id="edit-dpi"
                            value={editForm.dpi}
                            onChange={(e) => setEditForm({ ...editForm, dpi: e.target.value })}
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
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>

        <WebcamCaptureModal
            open={isWebcamOpen}
            onClose={() => setIsWebcamOpen(false)}
            onCapture={(base64) => {
                setProfilePhoto(base64);
                setIsWebcamOpen(false);
            }}
        />
        </>
    );
}
