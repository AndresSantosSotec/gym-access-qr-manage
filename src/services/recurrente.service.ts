import { api } from './api.service';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface RecurrenteCheckoutResponse {
    checkout_url: string;
    checkout_id: string;
}

export interface RecurrenteChargeResponse {
    payment_id: number;
    recurrente_payment_id: string;
    status: 'paid' | 'pending' | 'failed';
    message: string;
}

export interface RecurrenteSubscriptionResponse {
    subscription_id: number;
    recurrente_subscription_id: string;
    status: string;
}

export interface RecurrentePaymentRecord {
    id: number;
    client_id: number;
    type: 'checkout' | 'one_time' | 'subscription';
    amount_in_cents: number;
    amount_gtq: string;
    currency: string;
    status: 'pending' | 'succeeded' | 'paid' | 'failed';
    concept: string;
    paid_at: string | null;
    created_at: string;
    membership_plan?: { id: number; name: string };
}

export interface RecurrenteClientStatus {
    has_recurrente_account: boolean;
    has_saved_card: boolean;
    recurrente_user_id: string | null;
    active_subscription: {
        id: number;
        status: string;
        recurrente_subscription_id: string;
        membership_plan?: { name: string };
    } | null;
}

// ─────────────────────────────────────────────────────────────
//  Servicio
// ─────────────────────────────────────────────────────────────

export const recurrenteService = {

    /**
     * CASO 1 — Obtener link de pago (Checkout hosteado)
     * Usado para clientes nuevos sin tarjeta guardada.
     *
     * @returns URL a la que redirigir al cliente
     */
    async createCheckout(
        clientId: number,
        planId: number,
        successUrl?: string,
        cancelUrl?: string,
    ): Promise<RecurrenteCheckoutResponse> {
        const { data } = await api.post('/pagos/checkout', {
            client_id: clientId,
            plan_id: planId,
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return data;
    },

    /**
     * CASO 2 — Cobrar con tarjeta guardada (Tokenized Payment)
     * Solo funciona si el cliente ya hizo un checkout previo.
     */
    async chargeCard(
        clientId: number,
        amountInCents: number,
        concept: string,
        planId?: number,
    ): Promise<RecurrenteChargeResponse> {
        const { data } = await api.post('/pagos/cobrar', {
            client_id: clientId,
            amount_in_cents: amountInCents,
            concept,
            plan_id: planId,
        });
        return data;
    },

    /**
     * CASO 3 — Crear suscripción recurrente
     */
    async createSubscription(
        clientId: number,
        planId: number,
    ): Promise<RecurrenteSubscriptionResponse> {
        const { data } = await api.post('/suscripciones/crear', {
            client_id: clientId,
            plan_id: planId,
        });
        return data;
    },

    /**
     * CASO 5 — Cancelar suscripción activa
     */
    async cancelSubscription(subscriptionId: number): Promise<void> {
        await api.delete(`/suscripciones/${subscriptionId}`);
    },

    /**
     * Estado de pagos de un cliente
     */
    async getClientStatus(clientId: number): Promise<RecurrenteClientStatus> {
        const { data } = await api.get(`/pagos/estado/${clientId}`);
        return data;
    },

    /**
     * Historial de pagos de un cliente
     */
    async getPaymentHistory(clientId: number): Promise<{
        payments: RecurrentePaymentRecord[];
        subscriptions: any[];
    }> {
        const { data } = await api.get(`/pagos/historial/${clientId}`);
        return data;
    },
};
