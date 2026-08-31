import { apiClient } from '../api-client';

export type WageType = 'PIECE_RATE' | 'FIXED_MONTHLY' | 'FIXED_PLUS_INCENTIVE';

export interface KarigarApiItem {
  id: string;
  name: string;
  mobile: string;
  wage_type: WageType;
  default_rate_per_meter?: number;
  default_monthly_salary?: number;
  incentive_threshold_value?: number;
  incentive_threshold_type?: 'STITCHES' | 'PIECES' | 'METERS';
  incentive_rate?: number;
  incentive_rate_type?: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  is_active: boolean;
  company_id: string;
  created_at: string;
}

export interface CreateKarigarDto {
  name: string;
  mobile: string;
  wage_type: WageType;
  default_rate_per_meter?: number;
  default_monthly_salary?: number;
  incentive_threshold_value?: number;
  incentive_threshold_type?: 'STITCHES' | 'PIECES' | 'METERS';
  incentive_rate?: number;
  incentive_rate_type?: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  is_active?: boolean;
}

export const KarigarsApi = {
  getAll: async (): Promise<KarigarApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/karigars');
    return res?.data || [];
  },

  getById: async (id: string): Promise<KarigarApiItem> => {
    const res: any = await apiClient.get(`/api/v1/karigars/${id}`);
    return res?.data;
  },

  create: async (dto: CreateKarigarDto): Promise<KarigarApiItem> => {
    const res: any = await apiClient.post('/api/v1/karigars', dto);
    return res?.data;
  },

  update: async (id: string, dto: Partial<CreateKarigarDto>): Promise<KarigarApiItem> => {
    const res: any = await apiClient.put(`/api/v1/karigars/${id}`, dto);
    return res?.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/karigars/${id}`);
  },
};
