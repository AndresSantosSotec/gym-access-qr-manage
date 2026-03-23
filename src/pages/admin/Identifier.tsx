/**
 * Identifier — Terminal de Identificación por Huella Digital (Kiosco)
 *
 * Página pública de pantalla completa, diseñada para montarse en una TV/monitor
 * de entrada al gimnasio. No requiere autenticación.
 *
 * Flujo:
 *   1. La página carga → el hook useFingerprint detecta el lector DigitalPersona.
 *   2. El usuario coloca el dedo sin tocar nada.
 *   3. onSamplesAcquired dispara → se envía el PNG base64 a POST /access/identify-fingerprint.
 *   4. El backend (Laravel → Python server) hace correlación 1:N y devuelve el cliente.
 *   5. Se muestra tarjeta de resultado 4 s → vuelve al estado de espera automáticamente.
 *
 * Sobre la validación WebSDK:
 *   - El SDK captura imágenes en formato PngImage (base64).
 *   - El servidor Python aplica correlación cruzada normalizada (numpy) sobre los bytes
 *     crudos del PNG. Umbral por defecto 0.50 — misma persona suele dar 0.55–0.85.
 *   - NO se requiere ningún algoritmo propietario en el cliente; toda la comparación
 *     ocurre server-side, por lo que esta vista solo necesita el WebSDK para captura.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Fingerprint, CheckCircle, XCircle, Warning, User, ArrowClockwise } from '@phosphor-icons/react';
import { useFingerprint } from '@/hooks/useFingerprint';
import { clientsService } from '@/services/clients.service';

/* ── Types ────────────────────────────────────────────────────────────── */

interface IdentifyResult {
    match: boolean;
    status?: 'accept' | 'retry' | 'reject';
    allowed?: boolean;
    similarity_pct?: number;
    candidate_name?: string;
    candidate_id?: number;
    client?: {
        id: number;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        photo_public_path?: string;
        memberships?: Array<{ status: string; end_date: string }>;
    };
    message?: string;
    error?: string;
}

type KioskState = 'idle' | 'processing' | 'allowed' | 'denied' | 'no_match' | 'sdk_error' | 'retry';

const RESULT_DISPLAY_MS = 4500;

/* ── Helper ───────────────────────────────────────────────────────────── */

function buildPhotoUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return window.location.origin + (path.startsWith('/') ? path : '/' + path);
}

/* ── Component ────────────────────────────────────────────────────────── */

export function Identifier() {
    const [kioskState, setKioskState] = useState<KioskState>('idle');
    const [result, setResult]         = useState<IdentifyResult | null>(null);
    const [countdown, setCountdown]   = useState(0);
    const [retrySeconds, setRetrySeconds] = useState(0);
    const cooldownRef                 = useRef(false);
    const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimerRef               = useRef<ReturnType<typeof setInterval> | null>(null);

    /* Auto-reset after a result is shown */
    const startCountdown = useCallback(() => {
        let secs = Math.ceil(RESULT_DISPLAY_MS / 1000);
        setCountdown(secs);
        timerRef.current = setInterval(() => {
            secs -= 1;
            setCountdown(secs);
            if (secs <= 0) {
                clearInterval(timerRef.current!);
                timerRef.current = null;
                cooldownRef.current = false;
                setKioskState('idle');
                setResult(null);
                setCountdown(0);
            }
        }, 1000);
    }, []);

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    }, []);

    /* Called every time the WebSDK reader fires onSamplesAcquired */
    const handleSample = useCallback(async (sample: { imageBase64: string }) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;

        // Cancel any running retry countdown so the new scan takes over cleanly
        if (retryTimerRef.current) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        setKioskState('processing');
        setResult(null);

        try {
            const data = await clientsService.identifyFingerprint(sample.imageBase64) as IdentifyResult;
            setResult(data);

            if (data.status === 'retry') {
                // Gray zone — prompt user to scan again within the 3 s window
                setKioskState('retry');
                setRetrySeconds(3);
                // Release cooldown after 1.2 s so the user can rescan immediately
                setTimeout(() => { cooldownRef.current = false; }, 1200);
                // Countdown 3-2-1 then auto-reset to idle
                let secs = 3;
                retryTimerRef.current = setInterval(() => {
                    secs -= 1;
                    setRetrySeconds(secs);
                    if (secs <= 0) {
                        clearInterval(retryTimerRef.current!);
                        retryTimerRef.current = null;
                        cooldownRef.current = false;
                        setKioskState('idle');
                        setResult(null);
                        setRetrySeconds(0);
                    }
                }, 1000);
            } else if (!data.match) {
                setKioskState('no_match');
                startCountdown();
            } else if (data.allowed) {
                setKioskState('allowed');
                startCountdown();
            } else {
                setKioskState('denied');
                startCountdown();
            }
        } catch {
            setKioskState('no_match');
            startCountdown();
        }
    }, [startCountdown]);

    const {
        sdkReady,
        readers,
        selectedReader,
        setSelectedReader,
        status: sdkStatus,
        isCapturing,
        startCapture,
        stopCapture,
    } = useFingerprint(handleSample);

    /* Auto-start capture when reader is available */
    useEffect(() => {
        if (sdkReady && selectedReader && !isCapturing) {
            startCapture();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sdkReady, selectedReader]);

    /* Report SDK error state so the kiosk shows something useful */
    useEffect(() => {
        if (!sdkReady && sdkStatus && sdkStatus !== 'Inicializando SDK...') {
            setKioskState('sdk_error');
        }
    }, [sdkReady, sdkStatus]);

    /* ── Theme per state ── */
    const bg: Record<KioskState, string> = {
        idle:      'from-slate-900 to-slate-800',
        processing:'from-blue-950 to-blue-900',
        allowed:   'from-green-950 to-green-900',
        denied:    'from-orange-950 to-orange-900',
        no_match:  'from-red-950 to-red-900',
        sdk_error: 'from-yellow-950 to-yellow-900',
        retry:     'from-amber-950 to-amber-900',
    };

    const clientPhoto = buildPhotoUrl(result?.client?.photo_public_path);
    const clientName  = result?.client?.full_name
        ?? (result?.client ? `${result.client.first_name ?? ''} ${result.client.last_name ?? ''}`.trim() : '');

    const manualReset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        timerRef.current = null;
        retryTimerRef.current = null;
        cooldownRef.current = false;
        setKioskState('idle');
        setResult(null);
        setCountdown(0);
        setRetrySeconds(0);
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${bg[kioskState]} transition-colors duration-700 flex flex-col items-center justify-center p-6 select-none`}>

            {/* ── Header ── */}
            <div className="mb-8 text-center">
                <p className="text-white/50 text-sm uppercase tracking-widest font-medium">GymFlow · Control de Acceso</p>
            </div>

            {/* ── SDK not ready ── */}
            {kioskState === 'sdk_error' && (
                <div className="max-w-lg w-full rounded-2xl border border-yellow-500/40 bg-yellow-900/30 p-6 text-center space-y-3">
                    <Warning size={48} weight="fill" className="mx-auto text-yellow-400" />
                    <p className="text-yellow-200 font-semibold text-lg">Lector no disponible</p>
                    <pre className="text-yellow-300/70 text-xs whitespace-pre-wrap font-mono text-left bg-black/30 rounded-lg p-3">{sdkStatus}</pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 flex items-center gap-2 mx-auto text-sm text-yellow-300 hover:text-yellow-100 transition-colors"
                    >
                        <ArrowClockwise size={16} /> Recargar página
                    </button>
                </div>
            )}

            {/* ── Reader selector (only shown if >1 reader) ── */}
            {sdkReady && readers.length > 1 && kioskState === 'idle' && (
                <div className="mb-6 flex items-center gap-3 text-sm text-white/60">
                    <span>Lector:</span>
                    <select
                        className="rounded-lg bg-white/10 border border-white/20 text-white px-3 py-1.5 text-sm"
                        value={selectedReader}
                        onChange={(e) => {
                            setSelectedReader(e.target.value);
                            if (isCapturing) stopCapture();
                        }}
                    >
                        {readers.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            )}

            {/* ── Main panel ── */}
            {kioskState !== 'sdk_error' && (
                <div className="max-w-sm w-full flex flex-col items-center gap-6">

                    {/* Fingerprint icon / spinner */}
                    {(kioskState === 'idle' || kioskState === 'processing') && (
                        <div className={`w-44 h-44 rounded-full border-4 flex items-center justify-center
                            ${kioskState === 'processing'
                                ? 'border-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.4)] animate-pulse'
                                : 'border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]'}`}>
                            <Fingerprint
                                size={96}
                                weight="light"
                                className={`${kioskState === 'processing' ? 'text-blue-300 animate-pulse' : 'text-white/40'} transition-colors duration-500`}
                            />
                        </div>
                    )}

                    {/* Result: client card */}
                    {(kioskState === 'allowed' || kioskState === 'denied') && result?.client && (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-400">
                            {/* Avatar */}
                            <div className="relative">
                                {clientPhoto ? (
                                    <img
                                        src={clientPhoto}
                                        alt={clientName}
                                        className={`w-44 h-44 rounded-full object-cover border-4 shadow-xl
                                            ${kioskState === 'allowed' ? 'border-green-400 shadow-green-500/40' : 'border-orange-400 shadow-orange-500/40'}`}
                                    />
                                ) : (
                                    <div className={`w-44 h-44 rounded-full flex items-center justify-center border-4 bg-white/10
                                        ${kioskState === 'allowed' ? 'border-green-400' : 'border-orange-400'}`}>
                                        <User size={80} className="text-white/50" weight="fill" />
                                    </div>
                                )}
                                <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center border-4 border-background
                                    ${kioskState === 'allowed' ? 'bg-green-500' : 'bg-orange-500'}`}>
                                    {kioskState === 'allowed'
                                        ? <CheckCircle size={28} weight="fill" className="text-white" />
                                        : <XCircle     size={28} weight="fill" className="text-white" />}
                                </div>
                            </div>

                            <p className="text-3xl font-bold text-white text-center">{clientName}</p>
                        </div>
                    )}

                    {/* Retry: gray zone — prompt second scan within 3 s */}
                    {kioskState === 'retry' && (
                        <div className="w-44 h-44 rounded-full border-4 border-amber-400 bg-amber-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)] animate-pulse">
                            <Fingerprint size={96} weight="duotone" className="text-amber-300" />
                        </div>
                    )}

                    {/* No match icon */}
                    {kioskState === 'no_match' && (
                        <div className="w-44 h-44 rounded-full border-4 border-red-500/60 flex items-center justify-center">
                            <XCircle size={96} weight="light" className="text-red-400" />
                        </div>
                    )}

                    {/* Status message */}
                    <div className="text-center space-y-1">
                        {kioskState === 'idle' && (
                            <>
                                <p className="text-white text-2xl font-light">Coloca el dedo en el lector</p>
                                <p className="text-white/40 text-sm">
                                    {isCapturing ? 'Escaneando...' : sdkReady ? 'Iniciando lector...' : 'Conectando SDK...'}
                                </p>
                            </>
                        )}
                        {kioskState === 'processing' && (
                            <p className="text-blue-200 text-2xl font-light animate-pulse">Identificando…</p>
                        )}
                        {(kioskState === 'allowed' || kioskState === 'denied') && (
                            <>
                                <p className={`text-2xl font-semibold ${kioskState === 'allowed' ? 'text-green-300' : 'text-orange-300'}`}>
                                    {result?.message ?? (kioskState === 'allowed' ? '¡Bienvenido/a!' : 'Acceso denegado')}
                                </p>
                                {result?.similarity_pct !== undefined && (
                                    <p className="text-white/30 text-sm">{result.similarity_pct}% similitud</p>
                                )}
                            </>
                        )}
                        {kioskState === 'retry' && (
                            <>
                                <p className="text-amber-200 text-2xl font-semibold animate-pulse">
                                    ¡Coloca el dedo nuevamente!
                                </p>
                                {result?.candidate_name && (
                                    <p className="text-amber-300/70 text-sm">
                                        Verificando: {result.candidate_name}
                                    </p>
                                )}
                                <p className="text-amber-400/60 text-lg font-bold">
                                    {retrySeconds}s
                                </p>
                            </>
                        )}
                        {kioskState === 'no_match' && (
                            <p className="text-red-300 text-2xl font-light">Huella no reconocida</p>
                        )}
                    </div>

                    {/* Retry countdown bar */}
                    {kioskState === 'retry' && (
                        <div className="w-full space-y-1">
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-amber-400 transition-all duration-1000"
                                    style={{ width: `${(retrySeconds / 3) * 100}%` }}
                                />
                            </div>
                            <p className="text-center text-xs text-amber-400/50">
                                Ventana de confirmación
                            </p>
                        </div>
                    )}

                    {/* Countdown bar */}
                    {countdown > 0 && (
                        <div className="w-full space-y-1">
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-1000
                                        ${kioskState === 'allowed' ? 'bg-green-400' : kioskState === 'denied' ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${(countdown / Math.ceil(RESULT_DISPLAY_MS / 1000)) * 100}%` }}
                                />
                            </div>
                            <button
                                onClick={manualReset}
                                className="mx-auto block text-xs text-white/30 hover:text-white/60 transition-colors"
                            >
                                Nueva lectura ({countdown}s)
                            </button>
                        </div>
                    )}

                    {/* Manual capture toggle (shown idle, not processing) */}
                    {sdkReady && kioskState === 'idle' && !isCapturing && (
                        <button
                            onClick={() => startCapture()}
                            disabled={!selectedReader}
                            className="mt-2 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm border border-white/20 transition-all"
                        >
                            Activar lector
                        </button>
                    )}
                </div>
            )}

            {/* ── Footer ── */}
            <div className="mt-10 text-center text-white/20 text-xs">
                DigitalPersona U.are.U · WebSDK · Identificación 1:N
            </div>
        </div>
    );
}
