import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { StripeSession, Payment } from '@/types/models';
import { membershipsService } from './memberships.service';
import { clientsService } from './clients.service';
import { addDays } from '@/utils/date';

export const stripeService = {
  createCheckoutSession: (
    planId: string,
    clientId?: string,
    leadId?: string
  ): StripeSession => {
    const plan = membershipsService.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const session: StripeSession = {
      sessionId: `cs_test_${Date.now()}`,
      checkoutUrl: `/p/pago-demo?session=cs_test_${Date.now()}`,
      planId,
      clientId,
      leadId,
      amount: plan.price,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const sessions = storage.get<StripeSession[]>(STORAGE_KEYS.STRIPE_SESSIONS) || [];
    storage.set(STORAGE_KEYS.STRIPE_SESSIONS, [...sessions, session]);

    return session;
  },

  getSessionById: (sessionId: string): StripeSession | null => {
    const sessions = storage.get<StripeSession[]>(STORAGE_KEYS.STRIPE_SESSIONS) || [];
    return sessions.find((s) => s.sessionId === sessionId) || null;
  },

  simulateWebhookSuccess: (sessionId: string): Payment | null => {
    const session = stripeService.getSessionById(sessionId);
    if (!session || session.status === 'completed') return null;

    const sessions = storage.get<StripeSession[]>(STORAGE_KEYS.STRIPE_SESSIONS) || [];
    const index = sessions.findIndex((s) => s.sessionId === sessionId);
    
    if (index !== -1) {
      sessions[index].status = 'completed';
      storage.set(STORAGE_KEYS.STRIPE_SESSIONS, sessions);
    }

    const payment: Payment = {
      id: `PAY-STRIPE-${Date.now()}`,
      clientId: session.clientId,
      leadId: session.leadId,
      planId: session.planId,
      amount: session.amount,
      method: 'stripe',
      reference: sessionId,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    const payments = storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [];
    storage.set(STORAGE_KEYS.PAYMENTS, [...payments, payment]);

    if (session.clientId) {
      const plan = membershipsService.getPlanById(session.planId);
      if (plan) {
        const startDate = new Date();
        const endDate = addDays(startDate, plan.durationDays);
        
        clientsService.update(session.clientId, {
          status: 'ACTIVE',
          membershipEnd: endDate.toISOString(),
        });
      }
    }

    return payment;
  },

  getAllSessions: (): StripeSession[] => {
    return storage.get<StripeSession[]>(STORAGE_KEYS.STRIPE_SESSIONS) || [];
  },
};
