import { apiClient } from '../api-client';

export interface PurchaseItem {
  description: string;
  category?: string;
  hsn?: string;
  qty: number;
  unit: string;
  rate: number;
  taxable_amount: number;
  gst_rate?: number;
  gst_amount?: number;
  total: number;
}

export interface PurchaseApiItem {
  id: string;
  company_id: string;
  supplier_name: string;
  supplier_gstin?: string;
  supplier_phone?: string;
  invoice_no: string;
  invoice_date: string;
  category: string;
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID';
  payment_mode: string;
  items: PurchaseItem[];
  subtotal: number;
  gst_amount: number;
  net_amount: number;
  paid_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseDto {
  supplier_name: string;
  supplier_gstin?: string;
  supplier_phone?: string;
  invoice_no: string;
  invoice_date: string;
  category?: string;
  payment_status?: string;
  payment_mode?: string;
  items: PurchaseItem[];
  subtotal?: number;
  gst_amount?: number;
  net_amount?: number;
  paid_amount?: number;
  notes?: string;
}

export interface PurchasesSummary {
  count: number;
  total_subtotal: number;
  total_gst: number;
  total_net_amount: number;
  total_paid: number;
  total_pending: number;
  category_totals: Record<string, number>;
}

export const PurchasesApi = {
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    category?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ purchases: PurchaseApiItem[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get<{ purchases: PurchaseApiItem[]; total: number; page: number; totalPages: number }>('/api/v1/purchases', { params });
    const data = (res as unknown as { data?: { purchases: PurchaseApiItem[]; total: number; page: number; totalPages: number } })?.data || res;
    return (data as { purchases: PurchaseApiItem[]; total: number; page: number; totalPages: number }) || { purchases: [], total: 0, page: 1, totalPages: 1 };
  },

  getSummary: async (params?: { startDate?: string; endDate?: string }): Promise<PurchasesSummary> => {
    const res = await apiClient.get<PurchasesSummary>('/api/v1/purchases/summary', { params });
    const data = (res as unknown as { data?: PurchasesSummary })?.data || res;
    return (
      (data as PurchasesSummary) || {
        count: 0,
        total_subtotal: 0,
        total_gst: 0,
        total_net_amount: 0,
        total_paid: 0,
        total_pending: 0,
        category_totals: {},
      }
    );
  },

  getById: async (id: string): Promise<PurchaseApiItem> => {
    const res = await apiClient.get<PurchaseApiItem>(`/api/v1/purchases/${id}`);
    const data = (res as unknown as { data?: PurchaseApiItem })?.data || res;
    return data as PurchaseApiItem;
  },

  create: async (dto: CreatePurchaseDto): Promise<PurchaseApiItem> => {
    const res = await apiClient.post<PurchaseApiItem>('/api/v1/purchases', dto);
    const data = (res as unknown as { data?: PurchaseApiItem })?.data || res;
    return data as PurchaseApiItem;
  },

  update: async (id: string, dto: Partial<CreatePurchaseDto>): Promise<PurchaseApiItem> => {
    const res = await apiClient.put<PurchaseApiItem>(`/api/v1/purchases/${id}`, dto);
    const data = (res as unknown as { data?: PurchaseApiItem })?.data || res;
    return data as PurchaseApiItem;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/purchases/${id}`);
    const data = (res as unknown as { data?: { success: boolean; message: string } })?.data || res;
    return data as { success: boolean; message: string };
  },
};
