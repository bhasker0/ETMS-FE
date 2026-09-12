import { apiClient } from '../api-client';

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';

export interface UchapatApiItem {
  id: string;
  karigar_id: string;
  karigar?: {
    id: string;
    name: string;
    mobile: string;
  };
  amount: number;
  date: string;
  reason?: string;
  payment_mode: PaymentMode;
  is_settled: boolean;
  settled_hisab_id?: string;
  company_id: string;
  created_at: string;
}

export interface CreateUchapatDto {
  karigar_id: string;
  amount: number;
  date: string;
  reason?: string;
  payment_mode?: PaymentMode;
}

export interface KarigarUchapatSummary {
  karigar_id: string;
  karigar_name: string;
  total_advances: number;
  unsettled_advances: number;
  last_advance_date?: string;
}

interface UchapatResponse<T> {
  success?: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export const UchapatApi = {
  getAll: async (params?: { karigar_id?: string; is_settled?: boolean }): Promise<UchapatApiItem[]> => {
    const res = await apiClient.get<UchapatResponse<UchapatApiItem[]>>('/api/v1/uchapat', { params }) as unknown as UchapatResponse<UchapatApiItem[]>;
    return res?.data || [];
  },

  create: async (dto: CreateUchapatDto): Promise<UchapatApiItem> => {
    const res = await apiClient.post<UchapatResponse<UchapatApiItem>>('/api/v1/uchapat', dto) as unknown as UchapatResponse<UchapatApiItem>;
    return res?.data;
  },

  getSummaryByKarigar: async (karigarId: string): Promise<KarigarUchapatSummary> => {
    const res = await apiClient.get<UchapatResponse<KarigarUchapatSummary>>(`/api/v1/uchapat/summary/karigar/${karigarId}`) as unknown as UchapatResponse<KarigarUchapatSummary>;
    return res?.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/uchapat/${id}`);
  },
};
