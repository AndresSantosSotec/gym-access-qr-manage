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
        }
    }, [client, open]);

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
            if (updated) {
                toast.success('Cliente actualizado');
                onSuccess(updated);
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>Actualiza los datos del cliente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
    );
}
