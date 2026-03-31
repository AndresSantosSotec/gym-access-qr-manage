/**
 * FingerprintAccessScanner — Modal de identificación pasiva 1:N
 *
 * Cómo funciona:
 *   1. Abre el diálogo → el hook useFingerprint arranca la captura continua.
 *   2. Cada vez que el lector detecta una huella se llama handleSample().
 *   3. Se envía el template al backend (POST /access/identify-fingerprint).
 *   4. Si hay coincidencia se muestra la tarjeta del cliente (acceso OK / denegado).
 *   5. Se respeta un cooldown de 3 s entre escaneos para no saturar el servidor.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Fingerprint,
  CheckCircle,
  XCircle,
  Warning,
  SpinnerGap,
  User,
} from '@phosphor-icons/react';
import { useFingerprint } from '@/hooks/useFingerprint';
import { clientsService } from '@/services/clients.service';

/* ─── Types ──────────────────────────────────────────────────────────── */

interface IdentifyResult {
  match: boolean;
  status?: 'accept' | 'retry' | 'reject' | 'quality';
  decision_reason?: string;
  allowed?: boolean;
  similarity_pct?: number;
  best_score?: number;
  second_best_score?: number;
  gap?: number;
  quality_score?: number;
  blur_score?: number;
  winning_fingerprint_id?: string | null;
  client_score_mode?: string;
  confirm_window_sec?: number;
  candidate_name?: string;
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    photo_public_path?: string;
    memberships?: Array<{ status: string; end_date: string }>;
  };
  message?: string;
}

type ScanState = 'idle' | 'processing' | 'matched' | 'denied' | 'no_match' | 'error' | 'retry' | 'quality';

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const COOLDOWN_MS = 3000;

function photoUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return window.location.origin + (path.startsWith('/') ? path : '/' + path);
}

/* ─── Component ───────────────────────────────────────────────────────── */

export function FingerprintAccessScanner({ open, onClose }: Props) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult]       = useState<IdentifyResult | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string>('');
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const cooldownRef               = useRef(false);
  const showDebug = typeof window !== 'undefined' && window.localStorage.getItem('fp_debug') === '1';

  useEffect(() => {
    if (scanState !== 'retry' || retryCountdown <= 0) return;
    const id = window.setTimeout(() => setRetryCountdown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [scanState, retryCountdown]);

  /* Called on every fingerprint acquisition from the WebSDK reader */
  const handleSample = useCallback(async (sample: { imageBase64: string }) => {
    if (cooldownRef.current) return;   // ignore during cooldown
    cooldownRef.current = true;

    setScanState('processing');
    setResult(null);
    setErrorMsg('');

    // Default reset delay; retry gets a shorter one so user can rescan quickly
    let cooldownMs = COOLDOWN_MS;

    try {
      const data = await clientsService.identifyFingerprint(sample.imageBase64);
      setResult(data as IdentifyResult);

      if (data.status === 'retry') {
        setScanState('retry');
        setRetryCountdown(Math.max(1, data.confirm_window_sec ?? 10));
        cooldownMs = 1500;   // release quickly so user can confirm within 3 s
      } else if (data.status === 'quality') {
        setScanState('quality');
        setRetryCountdown(0);
        cooldownMs = 2000;   // brief flash, then back to idle
      } else if (!data.match) {
        setRetryCountdown(0);
        setScanState('no_match');
      } else if (data.allowed) {
        setRetryCountdown(0);
        setScanState('matched');
      } else {
        setRetryCountdown(0);
        setScanState('denied');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setScanState('error');
    } finally {
      setTimeout(() => {
        cooldownRef.current = false;
        setScanState('idle');
        setResult(null);
      }, cooldownMs);
    }
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
  } = useFingerprint(handleSample);

  /* ── UI helpers ── */

  const stateColor: Record<ScanState, string> = {
    idle:       'border-muted',
    processing: 'border-blue-400 animate-pulse',
    matched:    'border-green-500',
    denied:     'border-orange-400',
    no_match:   'border-red-500',
    error:      'border-red-500',
    retry:      'border-amber-400 animate-pulse',
    quality:    'border-sky-400 animate-pulse',
  };

  const img = photoUrl(result?.client?.photo_public_path);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint size={22} weight="duotone" />
            Escáner de Acceso — Huella Digital
          </DialogTitle>
        </DialogHeader>

        {/* ── SDK not available ── */}
        {!sdkReady && (
          <div className="rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
            <Warning size={16} className="mb-1 inline mr-1" weight="bold" />
            SDK no disponible:
            <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{sdkStatus}</pre>
          </div>
        )}

        {/* ── Reader selector ── */}
        {sdkReady && readers.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Lector:</span>
            <select
              className="flex-1 rounded border px-2 py-1 text-sm"
              value={selectedReader}
              onChange={(e) => setSelectedReader(e.target.value)}
            >
              {readers.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Scan zone ── */}
        {sdkReady && (
          <div className={`flex flex-col items-center gap-3 rounded-xl border-4 p-6 transition-colors duration-300 ${stateColor[scanState]}`}>

            {/* Icon / state indicator */}
            {scanState === 'idle' && (
              <Fingerprint size={64} weight="light" className="text-muted-foreground animate-pulse" />
            )}
            {scanState === 'retry' && (
              <Fingerprint size={64} weight="duotone" className="text-amber-400 animate-pulse" />
            )}
            {scanState === 'quality' && (
              <Fingerprint size={64} weight="light" className="text-sky-400 animate-pulse" />
            )}
            {scanState === 'processing' && (
              <SpinnerGap size={64} weight="bold" className="text-blue-500 animate-spin" />
            )}
            {scanState === 'matched' && (
              <CheckCircle size={64} weight="fill" className="text-green-500" />
            )}
            {(scanState === 'denied' || scanState === 'no_match' || scanState === 'error') && (
              <XCircle size={64} weight="fill" className="text-red-400" />
            )}

            {/* State text */}
            <p className="text-center text-sm font-medium text-muted-foreground">
              {scanState === 'idle'       && (isCapturing ? 'Coloca el dedo en el lector…' : 'Inicia la captura para escanear')}
              {scanState === 'retry'      && (
                <span className="text-amber-600 font-semibold">
                  {(result as IdentifyResult | null)?.candidate_name
                    ? `¡Confirma: ${(result as IdentifyResult | null)?.candidate_name}!`
                    : '¡Coloca el dedo nuevamente para confirmar!'}
                  {retryCountdown > 0 ? ` (${retryCountdown}s)` : ''}
                </span>
              )}
              {scanState === 'quality'    && (
                <span className="text-sky-600 font-semibold">
                  {result?.decision_reason === 'blur_too_low'
                    ? 'Calidad insuficiente: limpia el dedo, presiona mejor y cubre toda la yema'
                    : 'Calidad insuficiente: mejora la posición del dedo'}
                </span>
              )}
              {scanState === 'processing' && 'Identificando…'}
              {scanState === 'no_match'   && 'Huella no registrada'}
              {scanState === 'error'      && `Error: ${errorMsg}`}
            </p>

            {/* Client card */}
            {result?.match && result.client && (
              <div className="mt-2 flex w-full flex-col items-center gap-2">
                {/* Avatar */}
                {img ? (
                  <img
                    src={img}
                    alt={result.client.full_name}
                    className="h-20 w-20 rounded-full object-cover shadow"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow">
                    <User size={40} className="text-muted-foreground" />
                  </div>
                )}

                {/* Name & message */}
                <p className="text-lg font-semibold">{result.client.full_name ?? `${result.client.first_name} ${result.client.last_name}`}</p>

                <p className={`text-sm font-medium ${result.allowed ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.message}
                </p>

                {/* Badges */}
                <div className="flex gap-2">
                  {result.allowed ? (
                    <Badge className="bg-green-100 text-green-800">Acceso permitido</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">Acceso denegado</Badge>
                  )}
                  {result.similarity_pct !== undefined && (
                    <Badge variant="outline">{result.similarity_pct}% similitud</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Quality indicator */}
            {qualityText && scanState === 'idle' && (
              <p className="text-xs text-muted-foreground">Calidad: {qualityText}</p>
            )}

            {showDebug && result && (
              <div className="w-full rounded border bg-muted/30 p-2 text-[11px] font-mono text-muted-foreground">
                dec={result.status} reason={result.decision_reason ?? '-'} sim={result.similarity_pct ?? '-'}%
                {' '}best={result.best_score ?? '-'} second={result.second_best_score ?? '-'} gap={result.gap ?? '-'}
                {' '}q={result.quality_score ?? '-'} blur={result.blur_score ?? '-'}
                {' '}win_fp={result.winning_fingerprint_id ?? '-'} mode={result.client_score_mode ?? '-'}
              </div>
            )}
          </div>
        )}

        {/* ── SDK status text ── */}
        {sdkReady && (
          <p className="text-center text-xs text-muted-foreground">{sdkStatus}</p>
        )}

        <DialogFooter className="gap-2">
          {sdkReady && !isCapturing && (
            <Button
              onClick={() => startCapture()}
              disabled={!selectedReader}
              className="flex-1"
            >
              <Fingerprint size={16} className="mr-1" />
              Iniciar escaneo
            </Button>
          )}
          {sdkReady && isCapturing && (
            <Button variant="outline" onClick={stopCapture} className="flex-1">
              Pausar escaneo
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
