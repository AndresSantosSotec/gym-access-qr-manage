import { api } from './api.service';
import type { Client } from '@/types/models';

// Helper transform function
const mapClientFromBackend = (data: any): Client => {
  // Construct full photo URL if exists
  let profilePhoto: string | undefined = undefined;
  if (data.photo_url) {
    if (data.photo_url.startsWith('http')) {
      profilePhoto = data.photo_url;
    } else {
      // Assuming storage is served from /storage
      const storageUrl = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';
      profilePhoto = `${storageUrl}/${data.photo_url}`;
    }
  } else if (data.profile_photo_url) {
    // Laravel Jetstream/common convention
    profilePhoto = data.profile_photo_url;
  }

  return {
    id: data.id.toString(),
    name: data.full_name || `${data.first_name} ${data.last_name}`,
    phone: data.phone || '',
    email: data.email,
    dpi: data.dni,
    notes: data.notes,
    status: (data.status || 'inactive').toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    membershipEnd: data.membership_end_date,
    profilePhoto: profilePhoto,
    fingerprintId: data.fingerprint_id,
    fingerprintRegisteredAt: data.fingerprint_registered_at,
    createdAt: data.created_at || new Date().toISOString(),
  };
};

export const clientsService = {
  getAll: async (params?: { search?: string; per_page?: number }): Promise<Client[]> => {
    try {
      const response = await api.get('/clients', {
        params: {
          ...params,
          per_page: params?.per_page || 100
        }
      });

      // Handle Laravel Pagination response
      const items = response.data.data || [];
      return items.map(mapClientFromBackend);
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
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
    // Map frontend fields to backend fields
    const payload = {
      first_name: clientData.name?.split(' ')[0] || 'Unknown', // Simple split fallback
      last_name: clientData.name?.split(' ').slice(1).join(' ') || 'User',
      phone: clientData.phone,
      email: clientData.email,
      dni: clientData.dpi,
      notes: clientData.notes,
      // Add other fields as necessary
      ...clientData
    };

    // If name wasn't pre-split, try to be smarter or expect first_name/last_name from form
    if (clientData.firstName && clientData.lastName) {
      payload.first_name = clientData.firstName;
      payload.last_name = clientData.lastName;
    }

    const response = await api.post('/clients', payload);
    return mapClientFromBackend(response.data);
  },

  update: async (id: string, updates: Partial<Client> & any): Promise<Client | null> => {
    const payload: any = { ...updates };

    // Reverse map common fields if they are present
    if (updates.name) {
      const parts = updates.name.split(' ');
      payload.first_name = parts[0];
      payload.last_name = parts.slice(1).join(' ');
    }
    if (updates.dpi) payload.dni = updates.dpi;
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

  // ─── Fingerprint Methods ───

  registerFingerprint: async (clientId: string, template: string): Promise<any> => {
    const response = await api.post(`/clients/${clientId}/fingerprint`, {
      fingerprint_template: template
    });
    return response.data;
  },

  removeFingerprint: async (clientId: string): Promise<any> => {
    const response = await api.delete(`/clients/${clientId}/fingerprint`);
    return response.data;
  },

  getFingerprintStatus: async (clientId: string): Promise<any> => {
    const response = await api.get(`/clients/${clientId}/fingerprint/status`);
    return response.data;
  }
};
