import { api } from './api.service';

export interface RegistrationProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image_url?: string;
  published: boolean;
  max_uses?: number;
  uses_count: number;
  available: boolean;
  success_url?: string;
  cancel_url?: string;
  phone_requirement: 'none' | 'optional' | 'required';
  address_requirement: 'none' | 'optional' | 'required';
  billing_info_requirement: 'none' | 'optional' | 'required';
  recurrente_product_id?: string;
  recurrente_price_id?: string;
  synced_with_recurrente: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRegistrationProductPayload {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  image_url?: string;
  published?: boolean;
  max_uses?: number;
  success_url?: string;
  cancel_url?: string;
  phone_requirement?: 'none' | 'optional' | 'required';
  address_requirement?: 'none' | 'optional' | 'required';
  billing_info_requirement?: 'none' | 'optional' | 'required';
  metadata?: Record<string, any>;
}

export interface CreateCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  product: RegistrationProduct;
}

export const registrationProductsService = {
  /**
   * Obtener todos los productos de inscripción (admin)
   */
  getAll: async (params?: {
    published?: boolean;
    available?: boolean;
  }): Promise<RegistrationProduct[]> => {
    try {
      const response = await api.get<RegistrationProduct[]>('/registration-products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching registration products:', error);
      return [];
    }
  },

  /**
   * Obtener productos publicados y disponibles (público)
   */
  getPublic: async (): Promise<RegistrationProduct[]> => {
    try {
      const response = await api.get<RegistrationProduct[]>('/public/registration-products');
      return response.data;
    } catch (error) {
      console.error('Error fetching public registration products:', error);
      return [];
    }
  },

  /**
   * Obtener un producto específico
   */
  getById: async (id: number): Promise<RegistrationProduct | null> => {
    try {
      const response = await api.get<RegistrationProduct>(`/registration-products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching registration product ${id}:`, error);
      return null;
    }
  },

  /**
   * Crear nuevo producto de inscripción
   */
  create: async (data: CreateRegistrationProductPayload): Promise<RegistrationProduct> => {
    const response = await api.post<RegistrationProduct>('/registration-products', data);
    return response.data;
  },

  /**
   * Actualizar producto de inscripción
   */
  update: async (id: number, data: Partial<CreateRegistrationProductPayload>): Promise<RegistrationProduct> => {
    const response = await api.patch<RegistrationProduct>(`/registration-products/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar producto de inscripción
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/registration-products/${id}`);
  },

  /**
   * Generar un checkout/link de pago para una inscripción
   * 
   * @param productId - ID del producto de inscripción
   * @param userId - ID del usuario en Recurrente (us_xxx)
   * @param metadata - Metadata opcional
   */
  createCheckout: async (
    productId: number,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<CreateCheckoutResponse> => {
    const response = await api.post<CreateCheckoutResponse>(
      `/registration-products/${productId}/checkout`,
      {
        user_id: userId,
        metadata,
      }
    );
    return response.data;
  },
};
