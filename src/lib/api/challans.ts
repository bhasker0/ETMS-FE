import { apiClient } from '../api-client';

export type ChallanStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPATCHED';

export interface InwardChallanApiItem {
  id: string;
  trader_name: string;
  trader_gstin?: string;
  lot_no: string;
  than_count: number;
  inward_meters: number;
  fabric_quality: string;
  design_no?: string;
  status: ChallanStatus;
  notes?: string;
  company_id: string;
  created_at: string;
  shift_logs?: any[];
  outward_invoices?: any[];
}

export interface CreateInwardChallanDto {
  trader_name: string;
  trader_gstin?: string;
  lot_no: string;
  than_count: number;
  inward_meters: number;
  fabric_quality: string;
  design_no?: string;
  notes?: string;
}

export const InwardChallansApi = {
  getAll: async (status?: ChallanStatus): Promise<InwardChallanApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/inward-challans', {
      params: status ? { status } : undefined,
    });
    return res?.data || [];
  },

  getById: async (id: string): Promise<InwardChallanApiItem> => {
    const res: any = await apiClient.get(`/api/v1/inward-challans/${id}`);
    return res?.data;
  },

  create: async (dto: CreateInwardChallanDto): Promise<InwardChallanApiItem> => {
    const res: any = await apiClient.post('/api/v1/inward-challans', dto);
    return res?.data;
  },

  update: async (id: string, dto: Partial<CreateInwardChallanDto & { status: ChallanStatus }>): Promise<InwardChallanApiItem> => {
    const res: any = await apiClient.put(`/api/v1/inward-challans/${id}`, dto);
    return res?.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/inward-challans/${id}`);
  },
};
