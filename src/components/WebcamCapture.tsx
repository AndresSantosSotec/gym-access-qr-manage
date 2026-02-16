import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, ArrowClockwise, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      setIsLoading(false);
      toast.error('Error al acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photoDataUrl);
    toast.success('Foto capturada correctamente');
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopCamera();
      onClose();
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <X size={32} className="text-red-600" weight="bold" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Error de Cámara</h3>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Asegúrate de dar permisos de cámara en tu navegador
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={startCamera}>
                <ArrowClockwise size={16} className="mr-2" />
                Reintentar
              </Button>
              <Button variant="default" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera size={20} className="text-primary" weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold">Capturar Foto</h3>
                <p className="text-xs text-muted-foreground">
                  {capturedPhoto ? 'Foto capturada' : 'Cámara activa'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                stopCamera();
                onClose();
              }}
            >
              <X size={20} />
            </Button>
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <Camera size={48} className="mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Iniciando cámara...</p>
                </div>
              </div>
            )}
            
            {capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

            {/* Overlay guide */}
            {!capturedPhoto && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-white/30 rounded-full"></div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            {capturedPhoto ? (
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 gap-2"
                >
                  <ArrowClockwise size={18} weight="bold" />
                  Tomar Otra Foto
                </Button>
                <Button
                  variant="default"
                  onClick={confirmPhoto}
                  className="flex-1 gap-2"
                >
                  <Check size={18} weight="bold" />
                  Usar Esta Foto
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                onClick={capturePhoto}
                disabled={isLoading}
                className="w-full gap-2"
                size="lg"
              >
                <Camera size={20} weight="bold" />
                Capturar Foto
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Centra tu rostro en el círculo y toma la foto cuando estés listo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
