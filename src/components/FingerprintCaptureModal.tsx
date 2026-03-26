import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fingerprint, CheckCircle, ArrowCounterClockwise, ShieldCheck, ArrowClockwise, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useFingerprint } from '@/hooks/useFingerprint';

const REQUIRED_SCANS = 4;

/**
 * Compress a PNG base64 fingerprint image to 256×256 JPEG.
 * The Python server uses _FP_COMPARE_SIZE=(256,256) anyway, so no quality loss.
 * Reduces payload from ~80KB/image (PNG) to ~15KB/image (JPEG 85%).
 */
async function compressImage(base64png: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No canvas context'));
            ctx.drawImage(img, 0, 0, 256, 256);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl.replace(/^data:image\/jpeg;base64,/, ''));
        };
        img.onerror = () => reject(new Error('Failed to load fingerprint image'));
        img.src = `data:image/png;base64,${base64png}`;
    });
}

interface ScanResult {
    template: string;
    image_base64: string;
    mode: 'websdk';
}

interface FingerprintCaptureModalProps {
    open: boolean;
    onClose: () => void;
    onCapture: (fingerprintData: string, allTemplates: string[]) => void;
    clientName: string;
}

export function FingerprintCaptureModal({
    open,
    onClose,
    onCapture,
    clientName
}: FingerprintCaptureModalProps) {
    const [phase, setPhase] = useState<'intro' | 'scanning' | 'done'>('intro');
    const [scans, setScans] = useState<ScanResult[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    // Called by the hook every time the reader fires onSamplesAcquired.
    // Deduplicates by checking if the last scan is identical (same image = finger not lifted).
    const handleSample = useCallback((sample: { imageDataUrl: string; imageBase64: string }) => {
        setScans((prev) => {
            if (prev.length >= REQUIRED_SCANS) return prev;
            // Skip if identical to the last captured scan (finger held still)
            if (prev.length > 0 && prev[prev.length - 1].image_base64 === sample.imageBase64) return prev;
            return [...prev, { template: sample.imageBase64, image_base64: sample.imageBase64, mode: 'websdk' }];
        });
    }, []);

    const {
        sdkReady,
        readers,
        selectedReader,
        setSelectedReader,
        status: sdkStatus,
        qualityText,
        isCapturing,
        startCapture,
        stopCapture,
        refreshReaders,
    } = useFingerprint(handleSample);

    const completed = scans.length;
    const allDone = completed >= REQUIRED_SCANS;

    // Auto-stop once we have REQUIRED_SCANS samples
    useEffect(() => {
        if (scans.length >= REQUIRED_SCANS && phase === 'scanning') {
            stopCapture();
            setPhase('done');
            toast.success('¡Registro completado! Listo para guardar.');
        }
    }, [scans.length, phase, stopCapture]);

    // Reset every time the dialog opens
    useEffect(() => {
        if (open) {
            setPhase('intro');
            setScans([]);
            if (isCapturing) stopCapture();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleStart = () => {
        if (!selectedReader) {
            toast.error('Selecciona un lector antes de iniciar.');
            return;
        }
        setPhase('scanning');
        startCapture();
    };

    const handleReset = () => {
        if (isCapturing) stopCapture();
        setScans([]);
        setPhase('intro');
    };

    const handleConfirm = async () => {
        if (scans.length === 0 || isCompressing) return;
        setIsCompressing(true);
        try {
            // Compress all captures to 256×256 JPEG to stay well under server limits
            const compressed = await Promise.all(scans.map(s => compressImage(s.template)));
            onCapture(compressed[0], compressed);
        } catch {
            // If compression fails (e.g. old browser), send originals
            const allTemplates = scans.map(s => s.template);
            onCapture(scans[0].template, allTemplates);
        } finally {
            setIsCompressing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && !isCapturing) onClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Fingerprint size={22} weight="duotone" className="text-primary" />
                        Registro de Huella Digital
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 flex-wrap">
                        Cliente: <span className="font-semibold text-foreground">{clientName}</span>
                        <Badge variant="outline" className="text-xs font-normal">DigitalPersona WebSDK</Badge>
                    </DialogDescription>
                </DialogHeader>

                {/* ── SDK not loaded warning ── */}
                {!sdkReady && (
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
                        <Warning size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                SDK de DigitalPersona no disponible
                            </p>
                            {sdkStatus && (
                                <p className="text-xs text-amber-800 dark:text-amber-200 font-mono bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                                    {sdkStatus}
                                </p>
                            )}
                            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                                Verifica que los 3 archivos estén en <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">public/scripts/</code>:
                            </p>
                            <ul className="text-xs text-amber-800 dark:text-amber-200 list-disc list-inside space-y-0.5">
                                <li><code>es6-shim.js</code></li>
                                <li><code>websdk.client.bundle.min.js</code></li>
                                <li><code>fingerprint.sdk.min.js</code></li>
                            </ul>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                También requiere el agente <strong>DigitalPersona WebAPI</strong> instalado y ejecutándose en esta PC.
                            </p>
                        </div>
                    </div>
                )}

                {sdkReady && (
                    <>
                        {/* ── Device selector ── */}
                        {phase === 'intro' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium flex-1">Lector biométrico</label>
                                    <Button variant="ghost" size="sm" onClick={refreshReaders}
                                        className="h-7 px-2 text-muted-foreground" title="Refrescar">
                                        <ArrowClockwise size={14} />
                                    </Button>
                                </div>
                                {readers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                                        {sdkStatus || 'No se detectaron lectores. Conecta el dispositivo y refresca.'}
                                    </p>
                                ) : (
                                    <Select value={selectedReader} onValueChange={setSelectedReader}>
                                        <SelectTrigger className="w-full text-sm">
                                            <SelectValue placeholder="Selecciona un lector..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {readers.map((uid) => (
                                                <SelectItem key={uid} value={uid}>
                                                    DigitalPersona U.are.U — {uid.slice(0, 16)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        {/* ── Step dots ── */}
                        <div className="flex items-center justify-center gap-3 py-1">
                            {Array.from({ length: REQUIRED_SCANS }).map((_, i) => {
                                const done = i < completed;
                                const active = i === completed && phase === 'scanning';
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                            done ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                                : active ? 'border-primary bg-primary/10 animate-pulse'
                                                : 'border-dashed border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {done
                                                ? <CheckCircle size={22} weight="fill" className="text-green-600" />
                                                : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Captured images grid ── */}
                        {scans.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: REQUIRED_SCANS }).map((_, i) => {
                                    const scan = scans[i];
                                    return (
                                        <div key={i} className={`aspect-square rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all ${
                                            scan ? 'border-green-500/60 bg-slate-50 dark:bg-slate-800'
                                                : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                                        }`}>
                                            {scan ? (
                                                <img
                                                    src={`data:image/png;base64,${scan.image_base64}`}
                                                    alt={`Lectura ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{i + 1}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Central sensor visual ── */}
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className={`relative flex items-center justify-center w-28 h-28 rounded-full border-4 transition-all duration-500 ${
                                phase === 'scanning' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                    : allDone ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                    : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                            }`}>
                                {phase === 'scanning' && (
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                )}
                                <Fingerprint size={56} weight={allDone ? 'fill' : 'duotone'}
                                    className={`z-10 transition-colors ${
                                        phase === 'scanning' ? 'text-primary'
                                            : allDone ? 'text-green-600'
                                            : 'text-slate-400'
                                    }`}
                                />
                                {allDone && (
                                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                                        <CheckCircle size={22} className="text-green-600" weight="fill" />
                                    </div>
                                )}
                            </div>

                            {/* Status text */}
                            <div className="text-center space-y-1">
                                {phase === 'intro' && (
                                    <>
                                        <p className="text-sm font-medium">Selecciona el lector e inicia el registro</p>
                                        <p className="text-xs text-muted-foreground">
                                            Se requieren <strong>{REQUIRED_SCANS} lecturas</strong> para un registro de calidad
                                        </p>
                                    </>
                                )}
                                {phase === 'scanning' && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium animate-pulse text-primary">
                                            Lectura {completed + 1} de {REQUIRED_SCANS} — Coloca el dedo...
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Retira y vuelve a colocar el dedo entre cada lectura
                                        </p>
                                        {qualityText && (
                                            <p className="text-xs text-muted-foreground">
                                                Última calidad: <strong>{qualityText}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
                                {allDone && (
                                    <p className="font-semibold text-green-700 dark:text-green-400">
                                        ¡{REQUIRED_SCANS} lecturas completadas exitosamente!
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <DialogFooter className="sm:justify-between flex-row items-center gap-2">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isCapturing}>
                            Cancelar
                        </Button>
                        {scans.length > 0 && !allDone && (
                            <Button variant="ghost" size="sm" onClick={handleReset}
                                disabled={isCapturing} className="text-muted-foreground">
                                <ArrowCounterClockwise size={14} className="mr-1" />
                                Reiniciar
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {sdkReady && !allDone && (
                            <Button onClick={handleStart} disabled={isCapturing || !selectedReader} className="gap-2">
                                <Fingerprint size={16} weight="bold" />
                                {phase === 'scanning'
                                    ? `Capturando ${completed} / ${REQUIRED_SCANS}...`
                                    : 'Iniciar Registro'}
                            </Button>
                        )}
                        {allDone && (
                            <Button onClick={handleConfirm} disabled={isCompressing} className="bg-green-600 hover:bg-green-700 gap-2">
                                <ShieldCheck size={16} weight="bold" />
                                {isCompressing ? 'Procesando...' : 'Guardar Huella'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

