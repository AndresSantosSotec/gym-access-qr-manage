import { storage } from '@/utils/storage';
import type { CashMovement } from '@/types/models';

const CASH_KEY = 'irongym_cash_movements';

export const cashService = {
  getAllMovements: (): CashMovement[] => {
    return storage.get<CashMovement[]>(CASH_KEY) || [];
  },

  getMovementById: (id: string): CashMovement | undefined => {
    const movements = cashService.getAllMovements();
    return movements.find(m => m.id === id);
  },

  createMovement: (data: Omit<CashMovement, 'id' | 'createdAt'>): CashMovement => {
    const movements = cashService.getAllMovements();
    
    const newMovement: CashMovement = {
      ...data,
      id: `cash-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...movements, newMovement];
    storage.set(CASH_KEY, updated);
    
    return newMovement;
  },

  getBalance: (): number => {
    const movements = cashService.getAllMovements();
    return movements.reduce((acc, m) => {
      return m.type === 'IN' ? acc + m.amount : acc - m.amount;
    }, 0);
  },

  getMovementsByDateRange: (startDate: string, endDate: string): CashMovement[] => {
    const movements = cashService.getAllMovements();
    return movements.filter(m => {
      const date = new Date(m.createdAt);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  },
};
