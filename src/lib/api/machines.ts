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
    const res = await apiClient.get<MachineApiItem[]>('/api/v1/machines');
    const data = (res as unknown as { data?: MachineApiItem[] })?.data || res;
    return (data as MachineApiItem[]) || [];
  },

  getById: async (id: string): Promise<MachineApiItem> => {
    const res = await apiClient.get<MachineApiItem>(`/api/v1/machines/${id}`);
    const data = (res as unknown as { data?: MachineApiItem })?.data || res;
    return data as MachineApiItem;
  },

  create: async (dto: CreateMachineDto): Promise<MachineApiItem> => {
    const res = await apiClient.post<MachineApiItem>('/api/v1/machines', dto);
    const data = (res as unknown as { data?: MachineApiItem })?.data || res;
    return data as MachineApiItem;
  },

  update: async (id: string, dto: Partial<CreateMachineDto>): Promise<MachineApiItem> => {
    const res = await apiClient.put<MachineApiItem>(`/api/v1/machines/${id}`, dto);
    const data = (res as unknown as { data?: MachineApiItem })?.data || res;
    return data as MachineApiItem;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/machines/${id}`);
  },
};
