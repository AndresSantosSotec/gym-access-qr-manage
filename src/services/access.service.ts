import { api } from './api.service';
import type { AccessLog, Client } from '@/types/models';

export interface VerifyAccessResponse {
  allowed: boolean;
  client: Client | null;
  message: string;
  log?: AccessLog;
}

export const accessService = {
  verifyAccessByQR: async (qrCode: string): Promise<VerifyAccessResponse> => {
    try {
      const response = await api.post('/access/verify-qr', { qr_code: qrCode });
      return {
        allowed: response.data.allowed,
        client: response.data.client,
        message: response.data.message,
        log: response.data.log
      };
    } catch (error: any) {
      return {
        allowed: false,
        client: null,
        message: error.response?.data?.message || 'Error al verificar acceso',
      };
    }
  },

  verifyAccessByFingerprint: async (fingerprintId: string): Promise<VerifyAccessResponse> => {
    try {
      const response = await api.post('/access/verify-fingerprint', { fingerprint_id: fingerprintId });
      return {
        allowed: response.data.allowed,
        client: response.data.client,
        message: response.data.message,
        log: response.data.log
      };
    } catch (error: any) {
      return {
        allowed: false,
        client: null,
        message: error.response?.data?.message || 'Error al verificar huella',
      };
    }
  },

  verifyAccess: async (qrCode: string): Promise<VerifyAccessResponse> => {
    return accessService.verifyAccessByQR(qrCode);
  },

  getRecentLogs: async (limit: number = 10): Promise<AccessLog[]> => {
    const response = await api.get(`/access/recent?limit=${limit}`);
    return response.data;
  },

  getLogsByClient: async (clientId: string): Promise<AccessLog[]> => {
    const response = await api.get(`/access/by-client/${clientId}`);
    return response.data;
  },

  getAllLogs: async (): Promise<AccessLog[]> => {
    const response = await api.get('/access-logs');
    return response.data;
  },
};
