import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { MembershipPlan, Payment } from '@/types/models';
import { addDays } from '@/utils/date';
import { clientsService } from './clients.service';

export const membershipsService = {
  getPlans: (): MembershipPlan[] => {
    return storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
  },

  getPlanById: (id: string): MembershipPlan | null => {
    const plans = membershipsService.getPlans();
    return plans.find((p) => p.id === id) || null;
  },

  getPlanBySlug: (slug: string): MembershipPlan | null => {
    const plans = membershipsService.getPlans();
    return plans.find((p) => p.slug === slug) || null;
  },

  getPublishedPlans: (): MembershipPlan[] => {
    const plans = membershipsService.getPlans();
    return plans.filter((p) => p.published);
  },

  createPlan: (plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>): MembershipPlan => {
    const now = new Date().toISOString();
    const newPlan: MembershipPlan = {
      ...plan,
      id: `PLAN-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const plans = membershipsService.getPlans();
    storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, [...plans, newPlan]);
    return newPlan;
  },

  updatePlan: (id: string, updates: Partial<MembershipPlan>): MembershipPlan | null => {
    const plans = membershipsService.getPlans();
    const index = plans.findIndex((p) => p.id === id);
    
    if (index === -1) return null;

    const updatedPlan = {
      ...plans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    plans[index] = updatedPlan;
    storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, plans);
    return updatedPlan;
  },

  deletePlan: (id: string): boolean => {
    const plans = membershipsService.getPlans();
    const filtered = plans.filter((p) => p.id !== id);
    
    if (filtered.length === plans.length) return false;

    storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, filtered);
    return true;
  },

  togglePublished: (id: string): MembershipPlan | null => {
    const plan = membershipsService.getPlanById(id);
    if (!plan) return null;

    return membershipsService.updatePlan(id, { published: !plan.published });
  },

  assignMembership: (
    clientId: string,
    planId: string,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'stripe',
    amount: number,
    reference?: string
  ): Payment | null => {
    const client = clientsService.getById(clientId);
    const plan = membershipsService.getPlanById(planId);

    if (!client || !plan) return null;

    const payment: Payment = {
      id: `PAY-${Date.now()}`,
      clientId,
      planId,
      amount,
      method: paymentMethod,
      createdAt: new Date().toISOString(),
      reference,
      status: 'paid',
    };

    const payments = storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [];
    storage.set(STORAGE_KEYS.PAYMENTS, [...payments, payment]);

    const startDate = new Date();
    const endDate = addDays(startDate, plan.durationDays);

    clientsService.update(clientId, {
      status: 'active',
      membershipEnd: endDate.toISOString(),
    });

    return payment;
  },

  getPaymentsByClient: (clientId: string): Payment[] => {
    const payments = storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [];
    return payments.filter((p) => p.clientId === clientId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAllPayments: (): Payment[] => {
    return storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [];
  },
};
