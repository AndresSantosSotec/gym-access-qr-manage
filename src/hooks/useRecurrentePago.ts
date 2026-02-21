import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    recurrenteService,
    type RecurrenteClientStatus,
    type RecurrenteChargeResponse,
} from '@/services/recurrente.service';

// ─────────────────────────────────────────────────────────────
//  Estado compartido del hook
// ─────────────────────────────────────────────────────────────

type PaymentState =
    | 'idle'
    | 'loading'
    | 'success'
    | 'error'
    | 'cancelled'
    | 'requires_checkout';

interface UseRecurrentePagoReturn {
    state: PaymentState;
    isLoading: boolean;
    clientStatus: RecurrenteClientStatus | null;
    lastPayment: RecurrenteChargeResponse | null;

    /** CASO 1: Redirigir al cliente al checkout de Recurrente */
    initiateCheckout: (clientId: number, planId: number) => Promise<void>;

    /** CASO 2: Cobrar automáticamente con tarjeta guardada */
    chargeCard: (
        clientId: number,
        amountInCents: number,
        concept: string,
        planId?: number,
    ) => Promise<RecurrenteChargeResponse | null>;

    /** CASO 3: Activar suscripción mensual/anual */
    createSubscription: (clientId: number, planId: number) => Promise<boolean>;

    /** CASO 5: Cancelar suscripción activa */
    cancelSubscription: (subscriptionId: number) => Promise<boolean>;

    /** Consultar estado de pagos del cliente */
    checkClientStatus: (clientId: number) => Promise<RecurrenteClientStatus | null>;

    reset: () => void;
}

// ─────────────────────────────────────────────────────────────
//  Hook principal
// ─────────────────────────────────────────────────────────────

export function useRecurrentePago(): UseRecurrentePagoReturn {
    const [state, setState] = useState<PaymentState>('idle');
    const [clientStatus, setClientStatus] = useState<RecurrenteClientStatus | null>(null);
    const [lastPayment, setLastPayment] = useState<RecurrenteChargeResponse | null>(null);

    const reset = useCallback(() => {
        setState('idle');
        setLastPayment(null);
    }, []);

    // ── CASO 1: Checkout hosteado ─────────────────────────────
    const initiateCheckout = useCallback(async (clientId: number, planId: number) => {
        setState('loading');
        try {
            const { checkout_url } = await recurrenteService.createCheckout(clientId, planId);

            if (!checkout_url) {
                throw new Error('No se recibió URL de checkout');
            }

            toast.success('Redirigiendo al portal de pago...');
            // Redirigir al portal de pago de Recurrente
            window.location.href = checkout_url;

        } catch (error: any) {
            setState('error');
            const msg = error?.response?.data?.error || 'Error al crear el checkout';
            toast.error(msg);
        }
    }, []);

    // ── CASO 2: Cobro con tarjeta guardada ───────────────────
    const chargeCard = useCallback(async (
        clientId: number,
        amountInCents: number,
        concept: string,
        planId?: number,
    ): Promise<RecurrenteChargeResponse | null> => {
        setState('loading');
        try {
            const result = await recurrenteService.chargeCard(clientId, amountInCents, concept, planId);
            setLastPayment(result);

            if (result.status === 'paid') {
                setState('success');
                toast.success(`✅ Cobro exitoso: Q${(amountInCents / 100).toFixed(2)}`);
            } else {
                setState('idle');
                toast.info('Pago procesándose...');
            }

            return result;

        } catch (error: any) {
            const data = error?.response?.data;

            // El cliente necesita hacer checkout primero
            if (data?.requires_checkout) {
                setState('requires_checkout');
                toast.warning('El cliente no tiene tarjeta guardada. Usa el link de pago primero.');
                return null;
            }

            setState('error');
            toast.error(data?.error || 'Error al procesar el cobro');
            return null;
        }
    }, []);

    // ── CASO 3: Suscripción recurrente ───────────────────────
    const createSubscription = useCallback(async (
        clientId: number,
        planId: number,
    ): Promise<boolean> => {
        setState('loading');
        try {
            await recurrenteService.createSubscription(clientId, planId);
            setState('success');
            toast.success('Suscripción activada correctamente');
            return true;
        } catch (error: any) {
            setState('error');
            toast.error(error?.response?.data?.error || 'Error al crear la suscripción');
            return false;
        }
    }, []);

    // ── CASO 5: Cancelar suscripción ─────────────────────────
    const cancelSubscription = useCallback(async (subscriptionId: number): Promise<boolean> => {
        setState('loading');
        try {
            await recurrenteService.cancelSubscription(subscriptionId);
            setState('idle');
            toast.success('Suscripción cancelada');
            return true;
        } catch (error: any) {
            setState('error');
            toast.error(error?.response?.data?.error || 'Error al cancelar la suscripción');
            return false;
        }
    }, []);

    // ── Estado del cliente ────────────────────────────────────
    const checkClientStatus = useCallback(async (
        clientId: number,
    ): Promise<RecurrenteClientStatus | null> => {
        try {
            const status = await recurrenteService.getClientStatus(clientId);
            setClientStatus(status);
            return status;
        } catch {
            return null;
        }
    }, []);

    return {
        state,
        isLoading: state === 'loading',
        clientStatus,
        lastPayment,
        initiateCheckout,
        chargeCard,
        createSubscription,
        cancelSubscription,
        checkClientStatus,
        reset,
    };
}
