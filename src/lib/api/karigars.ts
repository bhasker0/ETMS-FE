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
    const res = await apiClient.get<KarigarApiItem[]>('/api/v1/karigars');
    const data = (res as unknown as { data?: KarigarApiItem[] })?.data || res;
    return (data as KarigarApiItem[]) || [];
  },

  getById: async (id: string): Promise<KarigarApiItem> => {
    const res = await apiClient.get<KarigarApiItem>(`/api/v1/karigars/${id}`);
    const data = (res as unknown as { data?: KarigarApiItem })?.data || res;
    return data as KarigarApiItem;
  },

  create: async (dto: CreateKarigarDto): Promise<KarigarApiItem> => {
    const res = await apiClient.post<KarigarApiItem>('/api/v1/karigars', dto);
    const data = (res as unknown as { data?: KarigarApiItem })?.data || res;
    return data as KarigarApiItem;
  },

  update: async (id: string, dto: Partial<CreateKarigarDto>): Promise<KarigarApiItem> => {
    const res = await apiClient.put<KarigarApiItem>(`/api/v1/karigars/${id}`, dto);
    const data = (res as unknown as { data?: KarigarApiItem })?.data || res;
    return data as KarigarApiItem;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/karigars/${id}`);
  },
};
