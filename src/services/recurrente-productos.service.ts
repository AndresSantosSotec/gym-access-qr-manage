import { api } from './api.service';

export type ProductoRecurrenteTipo = 'inscripcion' | 'mensualidad' | 'curso' | 'otro';

export interface ProductoRecurrente {
  id: number;
  recurrente_product_id: string | null;
  recurrente_price_id: string | null;
  nombre: string;
  descripcion: string | null;
  monto_centavos: number;
  monto_quetzales: number;
  tipo: ProductoRecurrenteTipo;
  storefront_link: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductoRecurrentePayload {
  nombre: string;
  descripcion?: string;
  monto: number;
  tipo: ProductoRecurrenteTipo;
  activo?: boolean;
}

export interface CheckoutProductosResponse {
  checkout_url: string;
  checkout_id: string;
}

export const recurrenteProductosService = {
  /**
   * Lista productos de pago (inscripción, mensualidad, curso, otro).
   */
  getProductos: async (params?: { tipo?: ProductoRecurrenteTipo; activo?: boolean }): Promise<ProductoRecurrente[]> => {
    const { data } = await api.get<ProductoRecurrente[]>('/recurrente/productos', { params });
    return data;
  },

  /**
   * Crear producto en Recurrente y guardar local.
   */
  createProducto: async (payload: CreateProductoRecurrentePayload): Promise<ProductoRecurrente> => {
    const { data } = await api.post<ProductoRecurrente>('/recurrente/productos', payload);
    return data;
  },

  /**
   * Eliminar producto (Recurrente + soft delete local).
   */
  deleteProducto: async (id: number): Promise<void> => {
    await api.delete(`/recurrente/productos/${id}`);
  },

  /**
   * Crear checkout con plan (opcional) + productos. Retorna URL para redirigir.
   * productoIds = recurrente_productos; registrationProductIds = productos del módulo Inscripción (registration-products).
   */
  createCheckoutProductos: async (
    clientId: number,
    options: {
      planId?: number;
      productoIds?: number[];
      registrationProductIds?: number[];
      successUrl?: string;
      cancelUrl?: string;
    }
  ): Promise<CheckoutProductosResponse> => {
    const { data } = await api.post<CheckoutProductosResponse>('/recurrente/checkout-productos', {
      client_id: clientId,
      plan_id: options.planId,
      producto_ids: options.productoIds ?? [],
      registration_product_ids: options.registrationProductIds ?? [],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
    });
    return data;
  },
};
