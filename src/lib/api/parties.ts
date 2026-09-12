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
    recent_challans?: unknown[];
    recent_invoices?: unknown[];
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
    const res = await apiClient.get<PartyApiItem[]>('/api/v1/parties', { params });
    const data = (res as unknown as { data?: PartyApiItem[] })?.data || res;
    return (data as PartyApiItem[]) || [];
  },

  getById: async (id: string): Promise<PartyApiItem> => {
    const res = await apiClient.get<PartyApiItem>(`/api/v1/parties/${id}`);
    const data = (res as unknown as { data?: PartyApiItem })?.data || res;
    return data as PartyApiItem;
  },

  getStatement: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<PartyStatementResult> => {
    const res = await apiClient.get<PartyStatementResult>(`/api/v1/parties/${id}/statement`, { params });
    const data = (res as unknown as { data?: PartyStatementResult })?.data || res;
    return data as PartyStatementResult;
  },

  create: async (dto: CreatePartyDto): Promise<PartyApiItem> => {
    const res = await apiClient.post<PartyApiItem>('/api/v1/parties', dto);
    const data = (res as unknown as { data?: PartyApiItem })?.data || res;
    return data as PartyApiItem;
  },

  update: async (id: string, dto: UpdatePartyDto): Promise<PartyApiItem> => {
    const res = await apiClient.put<PartyApiItem>(`/api/v1/parties/${id}`, dto);
    const data = (res as unknown as { data?: PartyApiItem })?.data || res;
    return data as PartyApiItem;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/api/v1/parties/${id}`);
    const data = (res as unknown as { data?: { message: string } })?.data || res;
    return data as { message: string };
  },

  downloadStatementPdf: async (
    id: string,
    params?: { startDate?: string; endDate?: string },
    filename: string = 'ledger_statement',
  ) => {
    const res = await apiClient.get<BlobPart>(`/api/v1/parties/${id}/statement/pdf`, {
      params,
      responseType: 'blob',
    });
    const rawData = res instanceof Blob ? res : ((res as { data?: BlobPart })?.data instanceof Blob ? (res as { data: Blob }).data : (res as unknown as BlobPart));
    const blob = new Blob([rawData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  },
};
