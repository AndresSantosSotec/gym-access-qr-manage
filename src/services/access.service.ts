import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { AccessLog, Client } from '@/types/models';
import { clientsService } from './clients.service';
import { isExpired } from '@/utils/date';

export const accessService = {
  verifyAccessByQR: (qrCode: string): { allowed: boolean; client: Client | null; message: string } => {
    const clientId = qrCode.replace('QR-CLIENT-', '');
    const client = clientsService.getById(clientId);

    if (!client) {
      return {
        allowed: false,
        client: null,
        message: 'Código QR inválido',
      };
    }

    const allowed = !!(client.status === 'ACTIVE' && 
                    client.membershipEnd && 
                    !isExpired(client.membershipEnd));

    const log: AccessLog = {
      id: `LOG-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      createdAt: new Date().toISOString(),
      method: 'QR',
      result: allowed ? 'ALLOWED' : 'DENIED',
    };

    const logs = storage.get<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS) || [];
    storage.set(STORAGE_KEYS.ACCESS_LOGS, [...logs, log]);

    return {
      allowed,
      client,
      message: allowed 
        ? '¡Acceso permitido! Bienvenido/a' 
        : 'Acceso denegado - Membresía vencida',
    };
  },

  verifyAccessByFingerprint: (fingerprintId: string): { allowed: boolean; client: Client | null; message: string } => {
    const clients = clientsService.getAll();
    const client = clients.find((c) => c.fingerprintId === fingerprintId);

    if (!client) {
      return {
        allowed: false,
        client: null,
        message: 'Huella digital no registrada',
      };
    }

    const allowed = !!(client.status === 'ACTIVE' && 
                    client.membershipEnd && 
                    !isExpired(client.membershipEnd));

    const log: AccessLog = {
      id: `LOG-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      createdAt: new Date().toISOString(),
      method: 'FINGERPRINT',
      result: allowed ? 'ALLOWED' : 'DENIED',
    };

    const logs = storage.get<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS) || [];
    storage.set(STORAGE_KEYS.ACCESS_LOGS, [...logs, log]);

    return {
      allowed,
      client,
      message: allowed 
        ? '¡Acceso permitido! Bienvenido/a' 
        : 'Acceso denegado - Membresía vencida',
    };
  },

  verifyAccess: (qrCode: string): { allowed: boolean; client: Client | null; message: string } => {
    return accessService.verifyAccessByQR(qrCode);
  },

  getRecentLogs: (limit: number = 10): AccessLog[] => {
    const logs = storage.get<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS) || [];
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  getLogsByClient: (clientId: string): AccessLog[] => {
    const logs = storage.get<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS) || [];
    return logs
      .filter((log) => log.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllLogs: (): AccessLog[] => {
    return storage.get<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS) || [];
  },
};
