import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, XCircle, CheckCircle, Warning } from '@phosphor-icons/react';

interface WebcamCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'error' | 'denied';

export function WebcamCaptureModal({ open, onClose, onCapture }: WebcamCaptureModalProps) {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    setCameraState('requesting');
    setErrorMessage('');

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraState('active');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraState('denied');
          setErrorMessage('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraState('error');
          setErrorMessage('No se encontró ninguna cámara disponible en este dispositivo.');
        } else {
          setCameraState('error');
          setErrorMessage('Error al acceder a la cámara. Por favor, verifica que tu cámara esté conectada y funcionando.');
        }
      } else {
        setCameraState('error');
        setErrorMessage('Error desconocido al acceder a la cámara.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  };

  const capturePhoto = () => {
    if (!videoRef.current || cameraState !== 'active') return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMessage('Error al procesar la imagen');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMessage('Error al convertir la imagen');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            
            const sizeInBytes = result.length * 0.75;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            
            if (sizeInMB > 1) {
              setErrorMessage(`La imagen es muy grande (${sizeInMB.toFixed(2)}MB). Se recomienda menos de 1MB.`);
            }

            onCapture(result);
            handleClose();
          };
          reader.readAsDataURL(blob);
        },
        'image/webp',
        0.9
      );
    } catch (error) {
      try {
        const base64Image = canvas.toDataURL('image/jpeg', 0.9);
        
        const sizeInBytes = base64Image.length * 0.75;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 1) {
          setErrorMessage(`La imagen es muy grande (${sizeInMB.toFixed(2)}MB). Se recomienda menos de 1MB, pero se guardará de todas formas.`);
        }

        onCapture(base64Image);
        handleClose();
      } catch (jpegError) {
        setErrorMessage('Error al capturar la imagen');
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const getStateIndicator = () => {
    switch (cameraState) {
      case 'requesting':
        return (
          <Badge variant="secondary" className="mb-4">
            <div className="animate-pulse mr-2 w-2 h-2 bg-blue-500 rounded-full" />
            Solicitando acceso a cámara...
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="mb-4 bg-green-600">
            <CheckCircle className="mr-1" size={14} weight="fill" />
            Cámara activa
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="mb-4">
            <XCircle className="mr-1" size={14} weight="fill" />
            Permiso denegado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="mb-4">
            <Warning className="mr-1" size={14} weight="fill" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera size={24} weight="bold" />
            Capturar Foto con Cámara
          </DialogTitle>
          <DialogDescription>
            Posiciona tu rostro en el centro y presiona "Capturar foto" cuando estés listo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {getStateIndicator()}

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {cameraState === 'requesting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                  <Camera className="mx-auto mb-4 animate-pulse" size={64} weight="duotone" />
                  <p className="text-lg font-semibold">Solicitando acceso a la cámara...</p>
                  <p className="text-sm text-gray-400 mt-2">Por favor, permite el acceso cuando tu navegador lo solicite</p>
                </div>
              </div>
            )}

            {(cameraState === 'denied' || cameraState === 'error') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white max-w-md px-4">
                  {cameraState === 'denied' ? (
                    <XCircle className="mx-auto mb-4 text-red-500" size={64} weight="fill" />
                  ) : (
                    <Warning className="mx-auto mb-4 text-yellow-500" size={64} weight="fill" />
                  )}
                  <p className="text-lg font-semibold mb-2">
                    {cameraState === 'denied' ? 'Permiso Denegado' : 'Error de Cámara'}
                  </p>
                  <p className="text-sm text-gray-400">{errorMessage}</p>
                  {cameraState === 'denied' && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left text-xs">
                      <p className="font-semibold mb-2">Para permitir el acceso:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-300">
                        <li>Busca el icono de cámara en la barra de direcciones</li>
                        <li>Haz clic y selecciona "Permitir"</li>
                        <li>Recarga la página si es necesario</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraState === 'active' ? 'block' : 'hidden'}`}
            />

            {cameraState === 'active' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-80 border-2 border-white/50 rounded-lg" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black/50 inline-block px-3 py-1 rounded-full">
                    Centra tu rostro en el recuadro
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMessage && cameraState === 'active' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Warning className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} weight="fill" />
              <p className="text-sm text-yellow-800">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={cameraState !== 'active'}
              className="flex-1"
            >
              <Camera className="mr-2" size={20} weight="bold" />
              Capturar Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
