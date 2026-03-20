import { api } from './api.service';
import type { AccessLog, AccessLogRecord, Client, PaginatedResponse } from '@/types/models';

export interface VerifyAccessResponse {
  allowed: boolean;
  client: Client | null;
  message: string;
  log?: AccessLog;
}

export interface AccessLogQueryParams {
  search?: string;
  status?: 'allowed' | 'denied';
  verification_method?: 'qr' | 'fingerprint';
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

function mapAccessLog(log: any): AccessLog {
  return {
    id: String(log.id),
    clientId: String(log.client_id),
    createdAt: log.access_time || log.created_at || new Date().toISOString(),
    method: log.verification_method === 'fingerprint' ? 'FINGERPRINT' : 'QR',
    result: (log.status || log.result || 'denied').toUpperCase() === 'ALLOWED' ? 'ALLOWED' : 'DENIED',
    clientName: log.client?.full_name || [log.client?.first_name, log.client?.last_name].filter(Boolean).join(' ') || log.clientName || undefined,
  };
}

function mapAccessLogRecord(log: any): AccessLogRecord {
  return {
    id: Number(log.id),
    client_id: Number(log.client_id),
    access_time: log.access_time || log.created_at,
    access_type: log.access_type || 'entry',
    verification_method: log.verification_method === 'fingerprint' ? 'fingerprint' : 'qr',
    status: log.status === 'allowed' ? 'allowed' : 'denied',
    notes: log.notes,
    qr_code: log.qr_code,
    fingerprint_id: log.fingerprint_id,
    client: log.client,
  };
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
    try {
      const response = await api.get(`/access/recent?limit=${limit}`);
      const raw = Array.isArray(response.data) ? response.data : [];
      return raw.map(mapAccessLog);
    } catch (error) {
      console.error('Error fetching recent access logs:', error);
      return [];
    }
  },

  getLogsByClient: async (clientId: string): Promise<AccessLog[]> => {
    const response = await api.get(`/access/by-client/${clientId}`);
    return response.data;
  },

  getLogs: async (params: AccessLogQueryParams = {}): Promise<PaginatedResponse<AccessLogRecord>> => {
    const response = await api.get('/access-logs', { params });
    const payload = response.data;
    const items = Array.isArray(payload?.data) ? payload.data : [];

    return {
      data: items.map(mapAccessLogRecord),
      current_page: payload?.current_page ?? 1,
      last_page: payload?.last_page ?? 1,
      per_page: payload?.per_page ?? items.length,
      total: payload?.total ?? items.length,
    };
  },

  getAllLogs: async (): Promise<AccessLogRecord[]> => {
    const response = await api.get('/access-logs', { params: { per_page: 100 } });
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map(mapAccessLogRecord);
  },
};
