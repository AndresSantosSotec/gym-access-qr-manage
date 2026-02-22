import { api } from './api.service';

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface RecurrenteCheckoutResponse {
    checkout_url: string;
    checkout_id: string;
    client_id?: number;
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const recurrenteService = {

    /**
     * CASO 1 — Obtener link de pago (Checkout hosteado)
     * Usado para clientes nuevos sin tarjeta guardada.
     * Requiere autenticación (admin).
     */
    async createCheckout(
        clientId: number,
        planId: number,
        successUrl?: string,
        cancelUrl?: string,
    ): Promise<RecurrenteCheckoutResponse> {
        const { data } = await api.post('/recurrente/checkout', {
            client_id: clientId,
            plan_id: planId,
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return data;
    },

    /**
     * CHECKOUT PÚBLICO — Sin autenticación.
     * Crea el cliente automáticamente y genera el checkout de Recurrente.
     * Usado en la página pública de suscripción.
     */
    async createPublicCheckout(
        name: string,
        email: string,
        phone: string,
        planId: number | string,
    ): Promise<RecurrenteCheckoutResponse> {
        // Use fetch directly to avoid the auth interceptor on api.client
        const response = await fetch(`${API_BASE}/public/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, plan_id: planId }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw { response: { data: err, status: response.status }, message: err.error || 'Error en checkout' };
        }
        return response.json();
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
        const { data } = await api.post('/recurrente/charge-card', {
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
        const { data } = await api.post('/recurrente/subscriptions', {
            client_id: clientId,
            plan_id: planId,
        });
        return data;
    },

    /**
     * CASO 5 — Cancelar suscripción activa
     */
    async cancelSubscription(subscriptionId: number): Promise<void> {
        await api.delete(`/recurrente/subscriptions/${subscriptionId}`);
    },

    /**
     * Estado de pagos de un cliente
     */
    async getClientStatus(clientId: number): Promise<RecurrenteClientStatus> {
        const { data } = await api.get(`/recurrente/payments/status/${clientId}`);
        return data;
    },

    /**
     * Historial de pagos de un cliente
     */
    async getPaymentHistory(clientId: number): Promise<{
        payments: RecurrentePaymentRecord[];
        subscriptions: any[];
    }> {
        const { data } = await api.get(`/recurrente/payments/history/${clientId}`);
        return data;
    },
};
