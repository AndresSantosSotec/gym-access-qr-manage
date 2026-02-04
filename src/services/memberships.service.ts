import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { MembershipPlan, Payment } from '@/types/models';
import { addDays } from '@/utils/date';
import { clientsService } from './clients.service';

const initializeMockPlans = (): void => {
  const existingPlans = storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS);
  if (!existingPlans) {
    const mockPlans: MembershipPlan[] = [
      {
        id: 'PLAN-001',
        name: 'Mensual',
        price: 250,
        durationDays: 30,
        description: 'Acceso completo por 30 días',
      },
      {
        id: 'PLAN-002',
        name: 'Trimestral',
        price: 650,
        durationDays: 90,
        description: 'Acceso completo por 3 meses - Ahorra Q100',
      },
      {
        id: 'PLAN-003',
        name: 'Anual',
        price: 2200,
        durationDays: 365,
        description: 'Acceso completo por 1 año - Ahorra Q800',
      },
    ];
    storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, mockPlans);
  }
};

export const membershipsService = {
  getPlans: (): MembershipPlan[] => {
    initializeMockPlans();
    return storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
  },

  getPlanById: (id: string): MembershipPlan | null => {
    const plans = membershipsService.getPlans();
    return plans.find((p) => p.id === id) || null;
  },

  assignMembership: (
    clientId: string,
    planId: string,
    paymentMethod: 'cash' | 'card' | 'transfer',
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
