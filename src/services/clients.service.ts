import { api } from './api.service';
import type { Client } from '@/types/models';

/** Construye URL de foto: mismo origen que la app (evita localhost y Mixed Content). */
function photoPublicUrl(publicPath: string | null | undefined): string | undefined {
  if (!publicPath) return undefined;
  if (publicPath.startsWith('http')) return publicPath;
  if (typeof window !== 'undefined') {
    return window.location.origin + (publicPath.startsWith('/') ? publicPath : '/' + publicPath);
  }
  return undefined;
}

// Helper transform function
const mapClientFromBackend = (data: any): Client => {
  // photo_public_path = /storage/clients/photos/xxx.jpg → mismo origen, sin host del backend
  let profilePhoto: string | undefined = undefined;
  if (data.photo_public_path) {
    profilePhoto = photoPublicUrl(data.photo_public_path);
  } else if (data.photo_url) {
    profilePhoto = photoPublicUrl('/storage/' + (data.photo_url as string).replace(/^\//, ''));
  } else if (data.profile_photo_url) {
    profilePhoto = data.profile_photo_url;
  }

  return {
    id: data.id.toString(),
    name: data.full_name || `${data.first_name} ${data.last_name}`,
    phone: data.phone || '',
    email: data.email,
    dpi: data.dni,
    nit: data.nit,
    companyName: data.company_name,
    fiscalAddress: data.fiscal_address,
    notes: data.notes,
    status: (data.status || 'inactive').toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    membershipEnd: data.membership_end_date,
    profilePhoto: profilePhoto,
    fingerprintId: data.fingerprint_id,
    fingerprintRegisteredAt: data.fingerprint_registered_at,
    createdAt: data.created_at || new Date().toISOString(),
  };
};

export interface ClientsListParams {
  search?: string;
  per_page?: number;
  page?: number;
  status?: string;
  active_membership?: boolean;
  expired_membership?: boolean;
  has_fingerprint?: boolean;
  gender?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface ClientsPaginatedResponse {
  data: Client[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export const clientsService = {
  getAll: async (params?: ClientsListParams): Promise<Client[]> => {
    try {
      const response = await api.get('/clients', {
        params: {
          ...params,
          per_page: params?.per_page ?? 100
        }
      });
      const items = response.data.data || [];
      return items.map(mapClientFromBackend);
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  },

  /** Listado paginado con filtros (para la pantalla de clientes con paginación en servidor) */
  getPaginated: async (params: ClientsListParams = {}): Promise<ClientsPaginatedResponse> => {
    try {
      const response = await api.get('/clients', {
        params: {
          search: params.search || undefined,
          page: params.page ?? 1,
          per_page: params.per_page ?? 15,
          status: params.status ? String(params.status).toLowerCase() : undefined,
          active_membership: params.active_membership,
          expired_membership: params.expired_membership,
          has_fingerprint: params.has_fingerprint,
          gender: params.gender || undefined,
          sort_by: params.sort_by || undefined,
          sort_dir: params.sort_dir || undefined
        }
      });
      const items = (response.data.data || []).map(mapClientFromBackend);
      const meta = {
        current_page: response.data.current_page ?? 1,
        last_page: response.data.last_page ?? 1,
        total: response.data.total ?? 0,
        per_page: response.data.per_page ?? 15
      };
      return { data: items, meta };
    } catch (error) {
      console.error('Error fetching clients (paginated):', error);
      return { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: params.per_page ?? 15 } };
    }
  },

  getById: async (id: string): Promise<Client | null> => {
    try {
      const response = await api.get(`/clients/${id}`);
      return mapClientFromBackend(response.data);
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      return null;
    }
  },

  create: async (clientData: any): Promise<Client> => {
    // Map frontend fields to backend fields - ONLY include fields the backend expects
    const nameParts = clientData.name ? clientData.name.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Use explicit firstName/lastName if provided
    const payload = {
      first_name: clientData.firstName || firstName,
      last_name: clientData.lastName || lastName,
      phone: clientData.phone || null,
      email: clientData.email || null,
      dni: clientData.dpi || null,
      nit: clientData.nit || null,
      company_name: clientData.companyName || null,
      fiscal_address: clientData.fiscalAddress || null,
      notes: clientData.notes || null,
      // Only include optional fields that backend accepts
      ...(clientData.birthDate && { birth_date: clientData.birthDate }),
      ...(clientData.gender && { gender: clientData.gender }),
      ...(clientData.address && { address: clientData.address }),
      ...(clientData.emergencyContactName && { emergency_contact_name: clientData.emergencyContactName }),
      ...(clientData.emergencyContactPhone && { emergency_contact_phone: clientData.emergencyContactPhone }),
      // DO NOT include: status, profilePhoto, fingerprintId - these are handled separately
    };

    const response = await api.post('/clients', payload);
    const newClient = mapClientFromBackend(response.data);

    // Upload photo separately if provided
    if (clientData.profilePhoto && clientData.profilePhoto.startsWith('data:')) {
      try {
        await clientsService.uploadPhoto(newClient.id, clientData.profilePhoto);
      } catch (photoError) {
        console.error('Error uploading photo:', photoError);
        // Don't fail the entire operation if photo upload fails
      }
    }

    return newClient;
  },

  update: async (id: string, updates: Partial<Client> & any): Promise<Client | null> => {
    const payload: any = { ...updates };

    // Reverse map common fields if they are present
    if (updates.name) {
      const parts = updates.name.split(' ');
      payload.first_name = parts[0];
      payload.last_name = parts.slice(1).join(' ');
    }
    // Map dpi → dni (send empty string as null so backend doesn't fail validation)
    if ('dpi' in updates) payload.dni = updates.dpi || null;
    if ('nit' in updates) payload.nit = updates.nit || null;
    if ('companyName' in updates) payload.company_name = updates.companyName || null;
    if ('fiscalAddress' in updates) payload.fiscal_address = updates.fiscalAddress || null;
    // Normalize status to lowercase so backend 'in:active,inactive,suspended' accepts it
    if (payload.status) payload.status = (payload.status as string).toLowerCase();
    // Convert empty email to null
    if ('email' in payload && payload.email === '') payload.email = null;
    if (updates.profilePhoto && updates.profilePhoto.startsWith('data:')) {
      // Prepare for file upload separately or handle base64 if backend supports it
      // The current ClientController.uploadPhoto expects a file 'photo'
      // We might need to handle this differently or assume the hook handles it
      // For now, let's look at how the component sends it.
    }

    const response = await api.put(`/clients/${id}`, payload);
    return mapClientFromBackend(response.data);
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/clients/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  },

  getFingerprintClients: async (): Promise<Partial<Client>[]> => {
    try {
      const response = await api.get('/public/fingerprint-clients');
      return response.data.map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        fingerprintId: c.fingerprint_id,
        profilePhoto: c.photo_url
      }));
    } catch (error) {
      console.error('Error fetching fingerprint clients', error);
      return [];
    }
  },

  search: async (query: string): Promise<Client[]> => {
    return clientsService.getAll({ search: query });
  },

  generateQR: (clientId: string): string => {
    // Backend generates the actual QR content, but this might be for display URL
    return `QR-CLIENT-${clientId}`;
  },

  uploadPhoto: async (clientId: string, base64Data: string): Promise<any> => {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('photo', blob, 'profile.jpg');

      const result = await api.post(`/clients/${clientId}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return result.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  // ─── Fingerprint Methods ───

  registerFingerprint: async (clientId: string, template: string, allTemplates?: string[]): Promise<any> => {
    const body: Record<string, unknown> = { fingerprint_template: template };
    if (allTemplates && allTemplates.length > 1) {
      // slice(1): template[0] is already in fingerprint_template — avoid sending it twice
      body.extra_templates = allTemplates.slice(1);
    }
    const response = await api.post(`/clients/${clientId}/fingerprint`, body);
    return response.data;
  },

  removeFingerprint: async (clientId: string): Promise<any> => {
    const response = await api.delete(`/clients/${clientId}/fingerprint`);
    return response.data;
  },

  getFingerprintStatus: async (clientId: string): Promise<any> => {
    const response = await api.get(`/clients/${clientId}/fingerprint/status`);
    return response.data;
  },

  /**
   * 1:N fingerprint identification using a two-step local+remote approach:
   *
   *  Step 1 — Call the Python fingerprint server DIRECTLY on localhost:8089.
   *            The server runs on the same kiosk machine as the browser and the
   *            physical reader, so localhost is always reachable.
   *            Python queries the production MySQL for stored templates and
   *            runs ORB matching returning {match, client_id, similarity_pct}.
   *
   *  Step 2 — If a match is found, call Laravel (/access/log-fingerprint-access)
   *            to log the access event and retrieve full client + membership data.
   *
   * This bypasses the old Laravel → localhost:8089 proxy path that failed on
   * the remote server (cURL error 7).
   */
  identifyFingerprint: async (fingerprintTemplate: string, threshold?: number): Promise<{
    match: boolean;
    status?: 'accept' | 'retry' | 'reject' | 'quality';
    allowed?: boolean;
    similarity_pct?: number;
    candidate_name?: string;
    candidate_id?: number;
    client?: any;
    message?: string;
    error?: string;
  }> => {
    // ── Step 1: local Python server ──────────────────────────────────────────
    let pythonResult: any;
    try {
      const pythonResp = await fetch('http://localhost:8089/api/fingerprint/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint_template: fingerprintTemplate,
          ...(threshold !== undefined ? { threshold } : {}),
        }),
      });
      pythonResult = await pythonResp.json();
    } catch {
      return {
        match: false,
        error: 'Servidor de huellas no disponible. Verifique que el servicio GymflowFP esté activo en localhost:8089.',
      };
    }

    if (!pythonResult?.match) {
      return {
        match:          false,
        status:         pythonResult?.status,         // 'retry' | 'reject'
        similarity_pct: pythonResult?.similarity_pct,
        candidate_name: pythonResult?.candidate_name, // set when status==='retry'
        candidate_id:   pythonResult?.candidate_id,
        message:        pythonResult?.message ?? 'No se encontró coincidencia.',
      };
    }

    // ── Step 2: Laravel — log access + get full client info ──────────────────
    const response = await api.post('/access/log-fingerprint-access', {
      client_id:      pythonResult.client_id,
      similarity_pct: pythonResult.similarity_pct,
      fingerprint_id: pythonResult.fingerprint_id,
    });
    return response.data;
  }
};
