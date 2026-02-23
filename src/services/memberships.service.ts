import { storage, STORAGE_KEYS } from '@/utils/storage';
import { api } from './api.service';
import type { MembershipPlan, Payment } from '@/types/models';

export const membershipsService = {
  // ============ PLANES - MÉTODOS SÍNCRONOS (cache local) ============

  /**
   * Obtener planes desde cache local (síncrono, para display)
   */
  getPlansSync: (): MembershipPlan[] => {
    return storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
  },

  /**
   * Obtener plan por ID desde cache local (síncrono, para display)
   */
  getPlanByIdSync: (id: string): MembershipPlan | null => {
    const plans = membershipsService.getPlansSync();
    return plans.find((p) => p.id === id) || null;
  },

  // ============ PLANES - API REAL (asíncrono) ============

  /**
   * Obtener todos los planes (requiere autenticación)
   */
  getPlans: async (): Promise<MembershipPlan[]> => {
    try {
      const response = await api.get<any[]>('/membership-plans');
      const plans = response.data.map(membershipsService.transformPlan);
      // Guardar en cache local
      storage.set(STORAGE_KEYS.MEMBERSHIP_PLANS, plans);
      return plans;
    } catch (error) {
      console.warn('Error al obtener planes del backend:', error);
      // Fallback a localStorage
      return storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
    }
  },

  /**
   * Obtener planes publicados (público, sin autenticación)
   */
  getPublishedPlans: async (): Promise<MembershipPlan[]> => {
    try {
      const response = await api.get<MembershipPlan[]>('/public/plans');
      return response.data;
    } catch (error) {
      console.warn('Error al obtener planes públicos:', error);
      // Fallback a localStorage
      const plans = storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
      return plans.filter((p) => p.published);
    }
  },

  /**
   * Obtener plan por ID
   */
  getPlanById: async (id: string): Promise<MembershipPlan | null> => {
    try {
      const response = await api.get<any>(`/membership-plans/${id}`);
      return membershipsService.transformPlan(response.data);
    } catch (error) {
      console.warn('Error al obtener plan:', error);
      const plans = storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
      return plans.find((p) => p.id === id) || null;
    }
  },

  /**
   * Obtener plan por slug (para página pública)
   */
  getPlanBySlug: async (slug: string): Promise<MembershipPlan | null> => {
    try {
      const plans = await membershipsService.getPublishedPlans();
      return plans.find((p) => p.slug === slug) || null;
    } catch (error) {
      const plans = storage.get<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS) || [];
      return plans.find((p) => p.slug === slug) || null;
    }
  },

  /**
   * Crear nuevo plan
   */
  createPlan: async (plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MembershipPlan> => {
    try {
      const response = await api.post<any>('/membership-plans', {
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        duration_days: plan.durationDays,
        description: plan.description,
        features: plan.features,
        published: plan.published,
      });
      return membershipsService.transformPlan(response.data);
    } catch (error) {
      console.error('Error al crear plan:', error);
      throw error;
    }
  },

  /**
   * Actualizar plan
   */
  updatePlan: async (id: string, updates: Partial<MembershipPlan>): Promise<MembershipPlan> => {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.durationDays !== undefined) payload.duration_days = updates.durationDays;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.features !== undefined) payload.features = updates.features;
      if (updates.published !== undefined) payload.published = updates.published;

      const response = await api.put<any>(`/membership-plans/${id}`, payload);
      return membershipsService.transformPlan(response.data);
    } catch (error) {
      console.error('Error al actualizar plan:', error);
      throw error;
    }
  },

  /**
   * Eliminar plan
   */
  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/membership-plans/${id}`);
  },

  /**
   * Toggle publicado
   */
  togglePublished: async (id: string): Promise<MembershipPlan> => {
    const plan = await membershipsService.getPlanById(id);
    if (!plan) throw new Error('Plan no encontrado');
    return membershipsService.updatePlan(id, { published: !plan.published });
  },

  /**
   * Transformar datos del backend a formato frontend
   */
  transformPlan: (data: any): MembershipPlan => ({
    id: String(data.id),
    name: data.name,
    slug: data.slug,
    price: parseFloat(data.price),
    durationDays: data.duration_days || data.durationDays,
    description: data.description || '',
    features: data.features || [],
    published: Boolean(data.published),
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  }),

  // ============ PAGOS Y MEMBRESÍAS (API) ============

  assignMembership: async (
    clientId: string,
    planId: string,
    paymentMethod: Payment['method'],
    amount: number,
    reference?: string,
    paymentType: 'single' | 'installments' = 'single',
    numInstallments?: number,
    initialPayment?: number,
    inscriptionFee?: number,
    documentBase64?: string,
  ) => {
    const response = await api.post('/memberships/assign', {
      client_id: clientId,
      plan_id: planId,
      payment_method: paymentMethod,
      amount,
      reference,
      payment_type: paymentType,
      num_installments: numInstallments,
      initial_payment: initialPayment,
      inscription_fee: inscriptionFee,
      document_base64: documentBase64,
    });
    return response.data;
  },

  // ============ CUOTAS / INSTALLMENTS ============

  getInstallments: async (params?: {
    client_id?: string;
    membership_id?: string;
    status?: string;
    overdue?: boolean;
    upcoming?: boolean;
  }) => {
    const response = await api.get('/installments', { params });
    return response.data;
  },

  getInstallmentSummary: async () => {
    const response = await api.get('/installments/summary');
    return response.data;
  },

  getPaymentPlan: async (membershipId: string) => {
    const response = await api.get(`/installments/membership/${membershipId}`);
    return response.data;
  },

  payInstallment: async (
    installmentId: number,
    amount: number,
    paymentMethod: string,
    reference?: string,
    notes?: string,
    documentBase64?: string,
  ) => {
    const response = await api.post(`/installments/${installmentId}/pay`, {
      amount,
      payment_method: paymentMethod,
      reference,
      notes,
      document_base64: documentBase64,
    });
    return response.data;
  },

  getPaymentsByClient: async (clientId: string): Promise<Payment[]> => {
    try {
      const response = await api.get(`/payments/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getAllPayments: async (): Promise<Payment[]> => {
    try {
      const response = await api.get('/payments');
      // Handle Laravel Pagination
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },
};
