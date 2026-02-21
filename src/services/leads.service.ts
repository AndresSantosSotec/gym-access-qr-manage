import { api } from './api.service';
import type { Lead } from '@/types/models';

/**
 * Maps a backend lead record to the frontend Lead type
 */
const mapLeadFromBackend = (data: any): Lead => ({
  id: data.id.toString(),
  name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
  firstName: data.first_name || '',
  lastName: data.last_name || '',
  phone: data.phone || '',
  email: data.email || undefined,
  planSlug: data.plan_slug || '',
  preferredPaymentMethod: data.preferred_payment_method || 'cash',
  status: data.status || 'new',
  source: data.source || undefined,
  notes: data.notes || undefined,
  contactedAt: data.contacted_at || undefined,
  createdAt: data.created_at || new Date().toISOString(),
});

export const leadsService = {
  /**
   * Get all leads from the API (admin, requires auth)
   */
  getAllLeads: async (params?: {
    status?: string;
    search?: string;
    per_page?: number;
  }): Promise<Lead[]> => {
    try {
      const response = await api.get('/leads', {
        params: {
          ...params,
          per_page: params?.per_page || 100,
        },
      });
      const items = response.data.data || [];
      return items.map(mapLeadFromBackend);
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  },

  /**
   * Get lead by ID
   */
  getLeadById: async (id: string): Promise<Lead | null> => {
    try {
      const response = await api.get(`/leads/${id}`);
      return mapLeadFromBackend(response.data);
    } catch (error) {
      console.error(`Error fetching lead ${id}:`, error);
      return null;
    }
  },

  /**
   * Get leads statistics
   */
  getStatistics: async (): Promise<{
    total: number;
    by_status: Record<string, number>;
    conversion_rate: number;
  }> => {
    try {
      const response = await api.get('/leads/statistics/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching lead statistics:', error);
      return { total: 0, by_status: {}, conversion_rate: 0 };
    }
  },

  /**
   * Create a lead (admin, requires auth)
   */
  createLead: async (leadData: {
    name: string;
    phone: string;
    email?: string;
    planSlug: string;
    preferredPaymentMethod: string;
    notes?: string;
    source?: string;
  }): Promise<Lead> => {
    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await api.post('/leads', {
      first_name: firstName,
      last_name: lastName,
      email: leadData.email || null,
      phone: leadData.phone,
      plan_slug: leadData.planSlug,
      preferred_payment_method: leadData.preferredPaymentMethod,
      notes: leadData.notes || null,
      source: leadData.source || 'admin',
      status: 'new',
    });

    return mapLeadFromBackend(response.data);
  },

  /**
   * Create a lead from the public website (NO auth required)
   */
  createPublicLead: async (leadData: {
    name: string;
    phone: string;
    email?: string;
    planSlug: string;
    preferredPaymentMethod: string;
  }): Promise<Lead> => {
    const nameParts = leadData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await api.post('/public/leads', {
      first_name: firstName,
      last_name: lastName,
      email: leadData.email || null,
      phone: leadData.phone,
      plan_slug: leadData.planSlug,
      preferred_payment_method: leadData.preferredPaymentMethod,
    });

    return mapLeadFromBackend(response.data.lead || response.data);
  },

  /**
   * Update a lead
   */
  updateLead: async (id: string, updates: Partial<{
    status: Lead['status'];
    notes: string;
    phone: string;
    email: string;
  }>): Promise<Lead | null> => {
    try {
      const payload: any = {};
      if (updates.status) payload.status = updates.status;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.email) payload.email = updates.email;

      const response = await api.put(`/leads/${id}`, payload);
      return mapLeadFromBackend(response.data);
    } catch (error) {
      console.error('Error updating lead:', error);
      return null;
    }
  },

  /**
   * Convert lead to client (calls backend endpoint)
   */
  convertToClient: async (leadId: string): Promise<{ clientId: string } | null> => {
    try {
      const response = await api.post(`/leads/${leadId}/convert`);
      return {
        clientId: response.data.client?.id?.toString() || '',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al convertir lead';
      throw new Error(message);
    }
  },

  /**
   * Delete a lead
   */
  deleteLead: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/leads/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  },
};
