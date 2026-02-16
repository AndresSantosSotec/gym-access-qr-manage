import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Camera, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface PhotoGalleryManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoGalleryManager({ 
  photos, 
  onPhotosChange,
  maxPhotos = 10 
}: PhotoGalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    setIsUploading(true);

    const newPhotos: string[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        filesProcessed++;
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.warning(`${file.name} es mayor a 2MB`);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        filesProcessed++;

        if (filesProcessed === files.length) {
          onPhotosChange([...photos, ...newPhotos]);
          setIsUploading(false);
          toast.success(`${newPhotos.length} foto(s) agregada(s)`);
        }
      };
      reader.onerror = () => {
        filesProcessed++;
        toast.error(`Error al cargar ${file.name}`);
        if (filesProcessed === files.length) {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    toast.info('Foto eliminada');
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-accent/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon size={24} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Galería de Fotos</h3>
            <p className="text-sm text-muted-foreground">
              {photos.length} de {maxPhotos} fotos agregadas
            </p>
          </div>
        </div>
        {canAddMore && (
          <div>
            <input
              type="file"
              id="photo-gallery-upload"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => document.getElementById('photo-gallery-upload')?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              <Upload size={18} weight="bold" />
              {isUploading ? 'Subiendo...' : 'Agregar Fotos'}
            </Button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="p-16">
            <div className="text-center text-muted-foreground space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon size={56} className="text-primary opacity-60" weight="duotone" />
              </div>
              <div>
                <p className="font-semibold text-lg text-foreground">No hay fotos agregadas</p>
                <p className="text-sm mt-2">
                  Agrega fotos del staff para su perfil, eventos o actividades del gimnasio
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-4 gap-2"
                onClick={() => document.getElementById('photo-gallery-upload')?.click()}
              >
                <Camera size={20} weight="duotone" />
                Subir Primera Foto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted hover:border-primary transition-colors">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8"
                onClick={() => handleRemovePhoto(index)}
              >
                <X size={16} weight="bold" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded font-medium">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Consejos:</strong> Puedes agregar fotos del staff en diferentes actividades, eventos o momentos del gimnasio.
          Las imágenes deben ser menores a 2MB y en formato JPG, PNG o WebP.
        </p>
      </div>
    </div>
  );
}
