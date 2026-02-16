import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '@/services/api.service';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export function ImageUploader({ images, onChange, maxImages = 5, label = 'Imágenes Hero' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validar cantidad máxima
    if (images.length + files.length > maxImages) {
      toast.error(`Puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    // Validar tamaño (max 2MB por imagen)
    const maxSize = 2 * 1024 * 1024; // 2MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        toast.error(`La imagen "${files[i].name}" supera los 2MB`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images[]', file);
      });

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.post<{ urls: string[] }>('/site-settings/upload-hero-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Agregar las URLs recibidas al array de imágenes
      onChange([...images, ...response.data.urls]);
      
      toast.success(`${response.data.urls.length} imagen(es) subida(s) exitosamente`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      toast.error('Error al subir las imágenes');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    const updatedImages = images.filter((_, i) => i !== index);
    
    try {
      // Intentar eliminar del servidor (solo si es una URL del servidor)
      if (imageUrl.includes('/storage/')) {
        await api.delete('/site-settings/hero-image', {
          data: { url: imageUrl },
        });
      }
      
      onChange(updatedImages);
      toast.success('Imagen eliminada');
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      // Eliminar de todas formas del estado local
      onChange(updatedImages);
      toast.warning('Imagen eliminada localmente (error en servidor)');
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} imágenes
        </span>
      </div>

      {/* Preview de imágenes existentes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <img
                src={url}
                alt={`Hero ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                  className="gap-1"
                >
                  <Trash size={16} weight="bold" />
                  Eliminar
                </Button>
              </div>
              {/* Indicador de orden */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-bold">
                #{index + 1}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Zona de carga */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleClickUpload}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg p-8 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
              {isUploading ? (
                <>
                  <div className="animate-spin">
                    <Upload size={48} weight="duotone" />
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2">Subiendo... {uploadProgress}%</p>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={48} weight="duotone" />
                  <div className="text-center">
                    <p className="font-medium">Haz clic para seleccionar imágenes</p>
                    <p className="text-xs mt-1">
                      JPG, PNG o WEBP • Máximo 2MB por imagen • Hasta {maxImages - images.length} más
                    </p>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Info adicional */}
      {images.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> Las imágenes se mostrarán en un carrusel automático en la página principal.
            El orden de las imágenes es el orden en que aparecerán.
          </p>
        </div>
      )}
    </div>
  );
}
