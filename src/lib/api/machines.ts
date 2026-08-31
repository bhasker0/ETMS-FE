import { apiClient } from '../api-client';

export interface MachineApiItem {
  id: string;
  machine_no: string;
  head_count: 24 | 32 | 44 | 66;
  rpm: number;
  make_model?: string;
  status?: 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | string;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMachineDto {
  machine_no: string;
  head_count: 24 | 32 | 44 | 66;
  rpm?: number;
  make_model?: string;
  is_active?: boolean;
}

export const MachinesApi = {
  getAll: async (): Promise<MachineApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/machines');
    return res?.data || [];
  },

  getById: async (id: string): Promise<MachineApiItem> => {
    const res: any = await apiClient.get(`/api/v1/machines/${id}`);
    return res?.data;
  },

  create: async (dto: CreateMachineDto): Promise<MachineApiItem> => {
    const res: any = await apiClient.post('/api/v1/machines', dto);
    return res?.data;
  },

  update: async (id: string, dto: Partial<CreateMachineDto>): Promise<MachineApiItem> => {
    const res: any = await apiClient.put(`/api/v1/machines/${id}`, dto);
    return res?.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/machines/${id}`);
  },
};
