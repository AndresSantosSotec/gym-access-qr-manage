import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Payment } from '@/types/models';

export const paymentsService = {
  getAllPayments: (): Payment[] => {
    return storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) || [];
  },

  getPaymentById: (id: string): Payment | null => {
    const payments = paymentsService.getAllPayments();
    return payments.find((p) => p.id === id) || null;
  },

  createManualPayment: (payment: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const newPayment: Payment = {
      ...payment,
      id: `PAY-MANUAL-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const payments = paymentsService.getAllPayments();
    storage.set(STORAGE_KEYS.PAYMENTS, [...payments, newPayment]);

    return newPayment;
  },

  getPaymentsByClient: (clientId: string): Payment[] => {
    const payments = paymentsService.getAllPayments();
    return payments.filter((p) => p.clientId === clientId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getPaymentsByStatus: (status: Payment['status']): Payment[] => {
    const payments = paymentsService.getAllPayments();
    return payments.filter((p) => p.status === status);
  },

  getTotalRevenue: (): number => {
    const payments = paymentsService.getAllPayments();
    return payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  },

  updatePaymentStatus: (id: string, status: Payment['status']): Payment | null => {
    const payments = paymentsService.getAllPayments();
    const index = payments.findIndex((p) => p.id === id);
    
    if (index === -1) return null;

    payments[index].status = status;
    storage.set(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  },
};
