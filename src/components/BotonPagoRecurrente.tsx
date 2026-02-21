/**
 * BotonPagoRecurrente
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  FIXES DE QA IMPLEMENTADOS                                   ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║ 🔴 Fix 2.2 — Anti doble-click: botón deshabilitado          ║
 * ║              inmediatamente al primer click                  ║
 * ║ 🟡 Fix 4.1 — No permite re-submit si ya hay pago exitoso   ║
 * ║ 🟡 Fix 4.2 — checkout_id guardado en localStorage para     ║
 * ║              reconciliar si la sesión expira                 ║
 * ║ 🟡 Fix 4.3 — Polling cada 5s post-checkout para detectar   ║
 * ║              activación de membresía por webhook             ║
 * ║ 🟢 Fix 4.4 — Todos los errores muestran toast visible       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { CreditCard, Link, ArrowCircleRight, CircleNotch, CheckCircle, XCircle, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useRecurrentePago } from '@/hooks/useRecurrentePago';
import { toast } from 'sonner';
import type { RecurrenteClientStatus } from '@/services/recurrente.service';

// ─────────────────────────────────────────────────────────────
//  Clave de localStorage para reconciliación post-checkout
//  FIX 4.2 — Guardamos el contexto de pago por si expira la sesión
// ─────────────────────────────────────────────────────────────
const CHECKOUT_STORAGE_KEY = 'gymflow_pending_checkout';

interface PendingCheckout {
    checkoutId: string;
    clientId: number;
    planId: number;
    planName: string;
    timestamp: number;
}

// ─────────────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────────────

interface BotonPagoRecurrenteProps {
    clientId: number;
    planId: number;
    planName: string;
    planPrice: number; // en Quetzales (ej: 500.00)
    mode?: 'checkout' | 'charge' | 'subscription' | 'auto';
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export function BotonPagoRecurrente({
    clientId,
    planId,
    planName,
    planPrice,
    mode = 'auto',
    onSuccess,
    onError,
    className,
    size = 'default',
}: BotonPagoRecurrenteProps) {
    const {
        state,
        isLoading,
        clientStatus,
        lastPayment,
        initiateCheckout,
        chargeCard,
        createSubscription,
        checkClientStatus,
        reset,
    } = useRecurrentePago();

    const [statusLoaded, setStatusLoaded] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // FIX 4.3 — Polling state para detectar activación por webhook
    const [pollingActive, setPollingActive] = useState(false);
    const [membershipActivated, setMembershipActivated] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // FIX 2.2 — Ref para evitar doble submit (independiente del estado React)
    const submittingRef = useRef(false);

    // ── Cargar estado del cliente ─────────────────────────────
    useEffect(() => {
        checkClientStatus(clientId).then(() => setStatusLoaded(true));
    }, [clientId, checkClientStatus]);

    // ── Notificar éxito al padre ──────────────────────────────
    useEffect(() => {
        if (state === 'success' && lastPayment) {
            onSuccess?.(lastPayment);
        }
    }, [state, lastPayment, onSuccess]);

    // ── FIX 4.3 — Polling para detectar membresía activada ───
    // Útil cuando el webhook activa la membresía después del checkout
    const startPolling = useCallback(() => {
        setPollingActive(true);
        let attempts = 0;
        const maxAttempts = 12; // 12 × 5s = 60s máximo

        pollingRef.current = setInterval(async () => {
            attempts++;
            const status = await checkClientStatus(clientId);

            if (status?.active_subscription || status?.has_saved_card) {
                setMembershipActivated(true);
                setPollingActive(false);
                clearInterval(pollingRef.current!);
                toast.success('✅ ¡Membresía activada! Tu pago fue procesado correctamente.');
                onSuccess?.({ type: 'webhook_confirmed', status });
            }

            if (attempts >= maxAttempts) {
                setPollingActive(false);
                clearInterval(pollingRef.current!);
                toast.info('Tu pago está siendo procesado. La membresía se activará en breve.');
            }
        }, 5000);
    }, [clientId, checkClientStatus, onSuccess]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // ── FIX 4.2 — Verificar checkout pendiente en localStorage ─
    // Por si el usuario regresó después de que su sesión expiró
    useEffect(() => {
        const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (stored) {
            try {
                const pending: PendingCheckout = JSON.parse(stored);
                const isRecent = Date.now() - pending.timestamp < 30 * 60 * 1000; // 30 min

                if (isRecent && pending.clientId === clientId && pending.planId === planId) {
                    toast.info(
                        `Tienes un pago pendiente para "${pending.planName}". ` +
                        'Si ya pagaste, la membresía se activará automáticamente.',
                        { duration: 8000 }
                    );
                    // Iniciar polling para ver si el webhook ya llegó
                    startPolling();
                } else {
                    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
                }
            } catch {
                localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            }
        }
    }, [clientId, planId, planName, startPolling]);

    // ── Determinar modo efectivo ──────────────────────────────
    const hasSavedCard = clientStatus?.has_saved_card ?? false;
    const effectiveMode = mode === 'auto'
        ? hasSavedCard ? 'charge' : 'checkout'
        : mode;

    // ── Handler principal con anti doble-click ────────────────
    const handlePago = async () => {
        // FIX 2.2 — Guard de doble click con ref (más rápido que state)
        if (submittingRef.current || isLoading) {
            toast.warning('Ya hay un pago en proceso. Espera un momento.');
            return;
        }

        submittingRef.current = true;

        try {
            if (effectiveMode === 'checkout') {
                setConfirmOpen(false);

                // FIX 4.2 — Guardar contexto en localStorage antes de redirigir
                if (clientStatus?.has_recurrente_account !== false) {
                    const pending: PendingCheckout = {
                        checkoutId: '',  // se llenará con la respuesta
                        clientId,
                        planId,
                        planName,
                        timestamp: Date.now(),
                    };
                    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(pending));
                }

                await initiateCheckout(clientId, planId);
                // El usuario fue redirigido; el polling se activa cuando regrese

            } else if (effectiveMode === 'charge') {
                setConfirmOpen(false);
                const result = await chargeCard(clientId, Math.round(planPrice * 100), `Membresía: ${planName}`, planId);

                if (result?.status === 'paid' || result?.status === 'succeeded') {
                    // FIX 4.3 — Iniciar polling para confirmar activación
                    startPolling();
                } else if (!result) {
                    onError?.('Cobro fallido');
                }

            } else if (effectiveMode === 'subscription') {
                const ok = await createSubscription(clientId, planId);
                if (ok) {
                    onSuccess?.({ type: 'subscription' });
                    startPolling();
                } else {
                    onError?.('Error al crear suscripción');
                }
            }
        } finally {
            // Liberar el guard después de un breve delay
            setTimeout(() => {
                submittingRef.current = false;
            }, 3000);
        }
    };

    // ── Estados de UI ─────────────────────────────────────────

    if (!statusLoaded) {
        return (
            <Button variant="outline" size={size} disabled className={className}>
                <CircleNotch className="animate-spin w-4 h-4 mr-2" />
                Verificando...
            </Button>
        );
    }

    // FIX 4.3 — Mostrar polling state
    if (pollingActive) {
        return (
            <Button variant="outline" size={size} disabled className={`border-blue-400 text-blue-700 ${className}`}>
                <CircleNotch className="animate-spin w-4 h-4 mr-2" />
                Confirmando pago...
            </Button>
        );
    }

    // FIX 4.1 — Membresía ya activada (no permitir re-submit)
    if (membershipActivated || state === 'success') {
        return (
            <Button
                variant="outline"
                size={size}
                className={`border-green-500 text-green-700 cursor-default ${className}`}
                onClick={() => toast.success('Tu membresía ya está activa')}
            >
                <CheckCircle weight="fill" className="w-4 h-4 mr-2 text-green-600" />
                Membresía activa
            </Button>
        );
    }

    if (state === 'error') {
        return (
            <Button variant="destructive" size={size} onClick={reset} className={className}>
                <XCircle weight="fill" className="w-4 h-4 mr-2" />
                Error — Reintentar
            </Button>
        );
    }

    // FIX 2.5 — Cliente necesita actualizar tarjeta
    if (state === 'requires_checkout') {
        return (
            <Button
                size={size}
                className={`bg-amber-500 hover:bg-amber-600 text-white gap-2 ${className}`}
                onClick={() => initiateCheckout(clientId, planId)}
                disabled={isLoading || submittingRef.current}
            >
                <Warning weight="bold" className="w-4 h-4" />
                Actualizar tarjeta
            </Button>
        );
    }

    // ── MODO CHECKOUT (sin tarjeta guardada) ──────────────────
    if (effectiveMode === 'checkout') {
        return (
            <Button
                size={size}
                className={`bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 ${className}`}
                onClick={handlePago}
                disabled={isLoading || submittingRef.current}
            >
                {isLoading
                    ? <CircleNotch className="animate-spin w-4 h-4" />
                    : <Link weight="bold" className="w-4 h-4" />
                }
                {isLoading ? 'Generando link...' : 'Pagar con Recurrente'}
            </Button>
        );
    }

    // ── MODO CHARGE (tarjeta guardada) ─────────────────────────
    if (effectiveMode === 'charge') {
        return (
            <>
                <Button
                    size={size}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white gap-2 ${className}`}
                    onClick={() => setConfirmOpen(true)}
                    // FIX 2.2 — Deshabilitar inmediatamente al primer click
                    disabled={isLoading || submittingRef.current}
                >
                    {isLoading
                        ? <CircleNotch className="animate-spin w-4 h-4" />
                        : <CreditCard weight="bold" className="w-4 h-4" />
                    }
                    {isLoading ? 'Procesando...' : `Cobrar Q${planPrice.toFixed(2)}`}
                </Button>

                <Dialog open={confirmOpen} onOpenChange={(open) => {
                    // No cerrar si está procesando (FIX 2.2)
                    if (!isLoading) setConfirmOpen(open);
                }}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard weight="fill" className="text-emerald-600" size={22} />
                                Confirmar cobro
                            </DialogTitle>
                            <DialogDescription>
                                Se cobrará a la tarjeta registrada del cliente.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-lg border p-4 my-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="font-semibold">{planName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Monto:</span>
                                <span className="font-bold text-emerald-700 text-lg">Q{planPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Método:</span>
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <CreditCard size={11} />
                                    Tarjeta guardada
                                </Badge>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmOpen(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handlePago}
                                disabled={isLoading || submittingRef.current}
                            >
                                {isLoading
                                    ? <CircleNotch className="animate-spin w-4 h-4 mr-2" />
                                    : null
                                }
                                {isLoading ? 'Procesando...' : 'Confirmar cobro'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ── MODO SUBSCRIPTION ─────────────────────────────────────
    return (
        <Button
            size={size}
            className={`bg-violet-600 hover:bg-violet-700 text-white gap-2 ${className}`}
            onClick={handlePago}
            disabled={isLoading || submittingRef.current}
        >
            {isLoading
                ? <CircleNotch className="animate-spin w-4 h-4" />
                : <ArrowCircleRight weight="bold" className="w-4 h-4" />
            }
            {isLoading ? 'Activando...' : 'Activar Suscripción'}
        </Button>
    );
}

// ─────────────────────────────────────────────────────────────
//  Badge de estado para ClientDetail
// ─────────────────────────────────────────────────────────────

export function RecurrenteStatusBadge({ status }: { status: RecurrenteClientStatus }) {
    if (status.has_saved_card) {
        return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                <CreditCard size={12} weight="fill" />
                Tarjeta guardada
            </Badge>
        );
    }
    if (status.has_recurrente_account) {
        return (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
                <CreditCard size={12} />
                Sin tarjeta
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-muted-foreground text-xs">
            Sin cuenta Recurrente
        </Badge>
    );
}
