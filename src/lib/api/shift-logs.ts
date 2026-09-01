import { apiClient } from '../api-client';

export type ShiftType = 'DAY' | 'NIGHT';

export interface ShiftLogApiItem {
  id: string;
  machine_id: string;
  machine?: {
    id: string;
    machine_no: string;
    head_count: number;
  };
  shift_type: ShiftType;
  shift_date: string;
  inward_challan_id?: string;
  design_no?: string;
  start_counter: number;
  end_counter: number;
  total_stitches: number;
  total_meters: number;
  karigar_id: string;
  karigar?: {
    id: string;
    name: string;
    wage_type: string;
  };
  downtime_minutes: number;
  downtime_reason?: string;
  lot_allocations?: Array<{
    inward_challan_id: string;
    lot_no: string;
    design_no: string;
    meters: number;
    stitch_count?: number;
    commission_rate?: number;
    commission_type?: string;
  }>;
  company_id: string;
  created_at: string;
}

export interface CreateShiftLogDto {
  machine_id: string;
  shift_type: ShiftType;
  shift_date: string;
  inward_challan_id?: string;
  design_no?: string;
  start_counter: number;
  end_counter: number;
  total_meters: number;
  karigar_id: string;
  downtime_minutes?: number;
  downtime_reason?: string;
  lot_allocations?: Array<{
    inward_challan_id: string;
    lot_no: string;
    design_no: string;
    meters: number;
    stitch_count?: number;
    commission_rate?: number;
    commission_type?: string;
  }>;
}

export interface DowntimeAnalytics {
  reason: string;
  total_minutes: number;
  incident_count: number;
}

export const ShiftLogsApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; machine_id?: string }): Promise<ShiftLogApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/shift-logs', { params });
    return res?.data || [];
  },

  getById: async (id: string): Promise<ShiftLogApiItem> => {
    const res: any = await apiClient.get(`/api/v1/shift-logs/${id}`);
    return res?.data;
  },

  create: async (dto: CreateShiftLogDto): Promise<ShiftLogApiItem> => {
    const res: any = await apiClient.post('/api/v1/shift-logs', dto);
    return res?.data;
  },

  getDowntimeAnalytics: async (params?: { startDate?: string; endDate?: string }): Promise<DowntimeAnalytics[]> => {
    const res: any = await apiClient.get('/api/v1/shift-logs/downtime-analytics', { params });
    return res?.data || [];
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/shift-logs/${id}`);
  },
};
