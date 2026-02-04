import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { EconomicProfileItem } from '@/types/models';

export const economicProfileService = {
  getByClient: (clientId: string): EconomicProfileItem[] => {
    const items = storage.get<EconomicProfileItem[]>(STORAGE_KEYS.ECONOMIC_PROFILES) || [];
    return items.filter(item => item.clientId === clientId);
  },

  create: (item: Omit<EconomicProfileItem, 'id' | 'createdAt'>): EconomicProfileItem => {
    const items = economicProfileService.getAll();
    const newItem: EconomicProfileItem = {
      ...item,
      id: `ECO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedItems = [...items, newItem];
    storage.set(STORAGE_KEYS.ECONOMIC_PROFILES, updatedItems);
    return newItem;
  },

  update: (id: string, updates: Partial<EconomicProfileItem>): EconomicProfileItem | null => {
    const items = economicProfileService.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    storage.set(STORAGE_KEYS.ECONOMIC_PROFILES, items);
    return updatedItem;
  },

  delete: (id: string): boolean => {
    const items = economicProfileService.getAll();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    storage.set(STORAGE_KEYS.ECONOMIC_PROFILES, filtered);
    return true;
  },

  getAll: (): EconomicProfileItem[] => {
    return storage.get<EconomicProfileItem[]>(STORAGE_KEYS.ECONOMIC_PROFILES) || [];
  },

  calculateCapacity: (clientId: string): { totalIncome: number; totalExpense: number; capacity: number } => {
    const items = economicProfileService.getByClient(clientId).filter(item => item.active);
    
    const totalIncome = items
      .filter(item => item.type === 'INCOME')
      .reduce((sum, item) => sum + item.monthlyAmount, 0);
    
    const totalExpense = items
      .filter(item => item.type === 'EXPENSE')
      .reduce((sum, item) => sum + item.monthlyAmount, 0);
    
    return {
      totalIncome,
      totalExpense,
      capacity: totalIncome - totalExpense,
    };
  },
};
