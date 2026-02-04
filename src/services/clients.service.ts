import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { Client } from '@/types/models';
import { isExpired } from '@/utils/date';

const initializeMockClients = (): void => {
  const existingClients = storage.get<Client[]>(STORAGE_KEYS.CLIENTS);
  if (!existingClients) {
    const mockClients: Client[] = [
      {
        id: 'CLT-001',
        name: 'Juan Pérez',
        phone: '+502 5555-1234',
        email: 'juan.perez@email.com',
        status: 'ACTIVE',
        membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        profilePhoto: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%234f46e5" width="200" height="200"/%3E%3Ctext fill="white" font-size="80" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EJP%3C/text%3E%3C/svg%3E',
        fingerprintId: 'FP-CLT-001-1704067200000-abc123',
        fingerprintRegisteredAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'CLT-002',
        name: 'María González',
        phone: '+502 5555-5678',
        email: 'maria.gonzalez@email.com',
        status: 'INACTIVE',
        membershipEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'CLT-003',
        name: 'Carlos Ramírez',
        phone: '+502 5555-9012',
        status: 'ACTIVE',
        membershipEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        profilePhoto: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2310b981" width="200" height="200"/%3E%3Ctext fill="white" font-size="80" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECR%3C/text%3E%3C/svg%3E',
      },
    ];
    storage.set(STORAGE_KEYS.CLIENTS, mockClients);
  }
};

export const clientsService = {
  getAll: (): Client[] => {
    initializeMockClients();
    const clients = storage.get<Client[]>(STORAGE_KEYS.CLIENTS) || [];
    
    return clients.map(client => ({
      ...client,
      status: client.membershipEnd && isExpired(client.membershipEnd) ? 'INACTIVE' : client.status,
    }));
  },

  getById: (id: string): Client | null => {
    const clients = clientsService.getAll();
    return clients.find((c) => c.id === id) || null;
  },

  create: (client: Omit<Client, 'id' | 'createdAt'>): Client => {
    const clients = clientsService.getAll();
    const newClient: Client = {
      ...client,
      id: `CLT-${String(clients.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedClients = [...clients, newClient];
    storage.set(STORAGE_KEYS.CLIENTS, updatedClients);
    return newClient;
  },

  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = clientsService.getAll();
    const index = clients.findIndex((c) => c.id === id);
    
    if (index === -1) return null;
    
    const updatedClient = { ...clients[index], ...updates };
    clients[index] = updatedClient;
    storage.set(STORAGE_KEYS.CLIENTS, clients);
    return updatedClient;
  },

  delete: (id: string): boolean => {
    const clients = clientsService.getAll();
    const filtered = clients.filter((c) => c.id !== id);
    
    if (filtered.length === clients.length) return false;
    
    storage.set(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },

  search: (query: string): Client[] => {
    const clients = clientsService.getAll();
    const lowerQuery = query.toLowerCase();
    
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query) ||
        c.email?.toLowerCase().includes(lowerQuery)
    );
  },

  generateQR: (clientId: string): string => {
    return `QR-CLIENT-${clientId}`;
  },
};
