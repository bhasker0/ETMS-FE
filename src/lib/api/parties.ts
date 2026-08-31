import { apiClient } from '../api-client';

export interface PartyApiItem {
  id: string;
  name: string;
  gstin?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city: string;
  state_code: string;
  credit_period_days: number;
  opening_balance: number;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  transaction_summary?: {
    total_challans: number;
    total_invoices: number;
    total_billed_amount: number;
    recent_challans?: any[];
    recent_invoices?: any[];
  };
}

export interface CreatePartyDto {
  name: string;
  gstin?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state_code?: string;
  credit_period_days?: number;
  opening_balance?: number;
  is_active?: boolean;
}

export type UpdatePartyDto = Partial<CreatePartyDto>;

export interface PartyStatementResult {
  party: PartyApiItem;
  metrics: {
    opening_balance: number;
    total_billed_amount: number;
    total_inward_meters: number;
    total_inward_lots: number;
    total_outward_meters: number;
    total_invoices_count: number;
    closing_balance: number;
    fabric_in_process_meters: number;
    aging: {
      within_15_days: number;
      days_16_to_30: number;
      above_30_days: number;
    };
  };
  timeline: Array<{
    id: string;
    date: string;
    type: 'INWARD_LOT' | 'OUTWARD_INVOICE';
    ref_no: string;
    particulars: string;
    quantity_info: string;
    debit: number;
    credit: number;
    running_balance: number;
  }>;
}

export const PartiesApi = {
  getAll: async (params?: { search?: string }): Promise<PartyApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/parties', { params });
    return res?.data || [];
  },

  getById: async (id: string): Promise<PartyApiItem> => {
    const res: any = await apiClient.get(`/api/v1/parties/${id}`);
    return res?.data;
  },

  getStatement: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<PartyStatementResult> => {
    const res: any = await apiClient.get(`/api/v1/parties/${id}/statement`, { params });
    return res?.data;
  },

  create: async (dto: CreatePartyDto): Promise<PartyApiItem> => {
    const res: any = await apiClient.post('/api/v1/parties', dto);
    return res?.data;
  },

  update: async (id: string, dto: UpdatePartyDto): Promise<PartyApiItem> => {
    const res: any = await apiClient.put(`/api/v1/parties/${id}`, dto);
    return res?.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res: any = await apiClient.delete(`/api/v1/parties/${id}`);
    return res?.data;
  },
};
