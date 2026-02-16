import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Trash, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '@/services/api.service';
import { cn } from '@/lib/utils';

interface SingleImageUploaderProps {
    value?: string | null;
    onChange: (url: string | null) => void;
    uploadUrl: string;
    label?: string;
    className?: string;
}

export function SingleImageUploader({ value, onChange, uploadUrl, label = 'Imagen', className }: SingleImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(`La imagen supera los 2MB`);
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post<{ url: string }>(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onChange(response.data.url);
            toast.success('Imagen subida exitosamente');
        } catch (error) {
            console.error('Error al subir imagen:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange(null);
    };

    return (
        <div className={cn("space-y-3", className)}>
            <Label>{label}</Label>

            {!value ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all h-40",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {isUploading ? (
                        <div className="animate-spin text-primary mb-2">
                            <Upload size={32} />
                        </div>
                    ) : (
                        <div className="bg-primary/10 p-3 rounded-full mb-2 text-primary">
                            <Upload size={24} />
                        </div>
                    )}

                    <p className="text-sm font-medium text-muted-foreground">
                        {isUploading ? 'Subiendo...' : 'Click para subir imagen'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Máx 2MB (JPG, PNG, WEBP)</p>
                </div>
            ) : (
                <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 h-64 w-full flex items-center justify-center">
                    <img
                        src={value}
                        alt="Preview"
                        className="h-full w-full object-contain"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <PencilSimple size={16} className="mr-2" />
                            Cambiar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleRemove}>
                            <Trash size={16} className="mr-2" />
                            Quitar
                        </Button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            )}
        </div>
    );
}
