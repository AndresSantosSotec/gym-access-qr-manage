import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, CheckCircle, XCircle, Spinner } from '@phosphor-icons/react';
import { Progress } from '@/components/ui/progress';

interface FingerprintCaptureModalProps {
    open: boolean;
    onClose: () => void;
    onCapture: (fingerprintData: string) => void;
    clientName: string;
}

export function FingerprintCaptureModal({
    open,
    onClose,
    onCapture,
    clientName
}: FingerprintCaptureModalProps) {
    const [step, setStep] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (open) {
            setStep('idle');
            setProgress(0);
        }
    }, [open]);

    const startScan = () => {
        setStep('scanning');
        setProgress(0);

        // Simulate scanning process
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStep('success');
                    return 100;
                }
                return prev + 2; // Increments to reach 100 in roughly 2.5s (50 steps * 50ms)
            });
        }, 50);
    };

    const handleConfirm = () => {
        // Generar una cadena Base64 simulada pero única
        // En un caso real, esto vendría del SDK del lector
        const mockBase64 = btoa(`FINGERPRINT_DATA_${clientName}_${Date.now()}_${Math.random()}`);
        onCapture(mockBase64);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Huella Digital</DialogTitle>
                    <DialogDescription>
                        Cliente: <span className="font-semibold text-foreground">{clientName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-300 dark:border-slate-600 transition-colors duration-500">

                        {/* Estado Inactivo / Inicial */}
                        {step === 'idle' && (
                            <Fingerprint
                                size={64}
                                className="text-slate-400 animate-pulse"
                                weight="light"
                            />
                        )}

                        {/* Escaneando */}
                        {step === 'scanning' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                <Fingerprint
                                    size={64}
                                    className="text-primary"
                                    weight="fill"
                                />
                            </>
                        )}

                        {/* Éxito */}
                        {step === 'success' && (
                            <div className="relative">
                                <Fingerprint
                                    size={64}
                                    className="text-green-600"
                                    weight="fill"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                                    <CheckCircle size={24} className="text-green-600" weight="fill" />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {step === 'error' && (
                            <div className="relative">
                                <Fingerprint
                                    size={64}
                                    className="text-red-500"
                                    weight="duotone"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                                    <XCircle size={24} className="text-red-600" weight="fill" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-2 w-full max-w-xs">
                        {step === 'idle' && (
                            <p className="text-sm text-muted-foreground">
                                Coloque el dedo del cliente en el lector y presione iniciar.
                            </p>
                        )}
                        {step === 'scanning' && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium animate-pulse">Escaneando huella...</p>
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}
                        {step === 'success' && (
                            <p className="text-sm font-medium text-green-600">
                                ¡Huella capturada correctamente!
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="sm:justify-between flex-row items-center">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={step === 'scanning'}
                    >
                        Cancelar
                    </Button>

                    {step === 'idle' && (
                        <Button onClick={startScan}>
                            Iniciar Escaneo
                        </Button>
                    )}

                    {step === 'success' && (
                        <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                            Guardar Huella
                        </Button>
                    )}
                    {/* Retry logic could be added here for error state */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
