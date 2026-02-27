import { api } from './api.service';

export interface Receipt {
  id: number;
  client_id: number;
  payment_id: number;
  receipt_number: string;
  type: 'receipt' | 'invoice' | 'proforma';
  payment_type: 'subscription' | 'individual_payment' | 'course' | 'product';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  is_invoiced: boolean;
  invoice_number?: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  email_sent: boolean;
  sent_to_email?: string;
  paid_at?: string;
  invoiced_at?: string;
  email_sent_at?: string;
  description?: string;
  details?: Record<string, any>;
  client?: {
    id: number;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
  };
  payment?: {
    id: number;
    amount: number;
    payment_method: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ReceiptResponse {
  data: Receipt[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
  };
}

export interface BulkDownloadResult {
  success: Array<{
    id: number;
    receipt_number: string;
    file: string;
  }>;
  failed: Array<{
    id: number;
    error: string;
  }>;
}

/**
 * Servicio para gestionar recibos y facturas
 */
export const receiptsService = {
  /**
   * Obtener todos los recibos
   */
  async getAll(filters?: {
    client_id?: number;
    payment_id?: number;
    status?: string;
    payment_type?: string;
    is_invoiced?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<ReceiptResponse> {
    const params = new URLSearchParams();
    
    if (filters?.client_id) params.append('client_id', String(filters.client_id));
    if (filters?.payment_id) params.append('payment_id', String(filters.payment_id));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payment_type) params.append('payment_type', filters.payment_type);
    if (filters?.is_invoiced !== undefined) params.append('is_invoiced', String(filters.is_invoiced));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page ?? 15));

    const response = await api.get(`/receipts?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener recibos de un cliente
   */
  async byClient(clientId: number): Promise<Receipt[]> {
    const response = await api.get(`/receipts/client/${clientId}`);
    return response.data;
  },

  /**
   * Obtener un recibo específico
   */
  async getById(id: number): Promise<Receipt> {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  },

  /**
   * Crear un recibo
   */
  async create(data: Partial<Receipt>): Promise<Receipt> {
    const response = await api.post('/receipts', data);
    return response.data;
  },

  /**
   * Crear recibo desde un pago
   */
  async createFromPayment(paymentId: number, type: string, paymentType: string): Promise<Receipt> {
    const response = await api.post('/receipts/from-payment', {
      payment_id: paymentId,
      type,
      payment_type: paymentType,
    });
    return response.data;
  },

  /**
   * Descargar PDF del recibo
   */
  async downloadReceiptPdf(receiptId: number): Promise<Blob> {
    const response = await api.get(`/receipts/${receiptId}/download/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Descargar PDF de la factura
   */
  async downloadInvoicePdf(receiptId: number): Promise<Blob> {
    const response = await api.get(`/receipts/${receiptId}/download/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generar factura desde recibo y descargar
   */
  async generateAndDownloadInvoice(receiptId: number, notes?: string): Promise<Blob> {
    const response = await api.post(`/receipts/${receiptId}/generate-invoice-pdf`, {
      invoice_notes: notes,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Previsualizar recibo en HTML
   */
  async previewReceipt(receiptId: number): Promise<string> {
    const response = await api.get(`/receipts/${receiptId}/preview/receipt`);
    return response.data;
  },

  /**
   * Previsualizar factura en HTML
   */
  async previewInvoice(receiptId: number): Promise<string> {
    const response = await api.get(`/receipts/${receiptId}/preview/invoice`);
    return response.data;
  },

  /**
   * Descargar ticket térmico 80mm como PDF
   */
  async downloadTicketPdf(receiptId: number): Promise<Blob> {
    const response = await api.get(`/receipts/${receiptId}/download/ticket`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obtener HTML del ticket para impresión directa
   */
  async previewTicket(receiptId: number): Promise<string> {
    const response = await api.get(`/receipts/${receiptId}/preview/ticket`);
    return response.data;
  },

  /**
   * Descargar reporte general de recibos en PDF
   */
  async downloadReportPdf(filters?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    payment_type?: string;
    payment_method?: string;
    is_invoiced?: boolean;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payment_type) params.append('payment_type', filters.payment_type);
    if (filters?.payment_method) params.append('payment_method', filters.payment_method);
    if (filters?.is_invoiced !== undefined) params.append('is_invoiced', String(filters.is_invoiced));

    const response = await api.get(`/receipts/report/pdf?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Enviar recibo por email
   */
  async emailReceipt(receiptId: number, email: string, message?: string): Promise<any> {
    const response = await api.post(`/receipts/${receiptId}/email-pdf`, {
      email,
      message,
    });
    return response.data;
  },

  /**
   * Descargar múltiples recibos
   */
  async bulkDownload(ids: number[]): Promise<BulkDownloadResult> {
    const response = await api.post('/receipts/bulk-download', {
      ids,
    });
    return response.data;
  },

  /**
   * Marcar recibo como pagado
   */
  async markAsPaid(receiptId: number): Promise<Receipt> {
    const response = await api.post(`/receipts/${receiptId}/mark-paid`);
    return response.data;
  },

  /**
   * Obtener estadísticas de recibos
   */
  async statistics(): Promise<any> {
    const response = await api.get('/receipts/statistics/all');
    return response.data;
  },

  /**
   * Actualizar recibo
   */
  async update(id: number, data: Partial<Receipt>): Promise<Receipt> {
    const response = await api.put(`/receipts/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar recibo
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/receipts/${id}`);
  },
};
