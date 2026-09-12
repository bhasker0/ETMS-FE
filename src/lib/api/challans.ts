import { apiClient } from '../api-client';

export type ChallanStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPATCHED';

export interface InwardChallanDesignItem {
  design_no: string;
  stitch_count: number;
  commission_type: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  commission_rate: number;
  jobwork_price_per_1k: number;
  meters: number;
  than_count: number;
}

export interface InwardChallanInvoiceRef {
  id: string;
  invoice_no: string;
  invoice_date?: string;
  net_amount?: number;
  [key: string]: unknown;
}

export interface InwardChallanShiftLogRef {
  id: string;
  shift_date?: string;
  shift_type?: string;
  stitches_count?: number;
  meter_count?: number;
  [key: string]: unknown;
}

export interface InwardChallanApiItem {
  id: string;
  challan_no?: string;
  trader_name: string;
  trader_gstin?: string;
  lot_no: string;
  than_count: number;
  inward_meters: number;
  fabric_quality: string;
  design_no?: string;
  stitch_count?: number;
  karigar_commission_rate?: number;
  karigar_commission_type?: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  jobwork_price_per_1k?: number;
  items?: InwardChallanDesignItem[];
  challan_date?: string;
  status: ChallanStatus;
  notes?: string;
  company_id: string;
  created_at: string;
  shift_logs?: InwardChallanShiftLogRef[];
  shiftLogs?: InwardChallanShiftLogRef[];
  production_summary?: Record<
    string,
    {
      total_stitches: number;
      total_meters: number;
      machine_heads: number;
      log_count: number;
    }
  >;
  outward_invoices?: InwardChallanInvoiceRef[];
}

export interface CreateInwardChallanDto {
  challan_no?: string;
  challan_date?: string;
  trader_name: string;
  trader_gstin?: string;
  lot_no: string;
  than_count: number;
  inward_meters: number;
  fabric_quality: string;
  design_no?: string;
  stitch_count?: number;
  karigar_commission_rate?: number;
  karigar_commission_type?: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  jobwork_price_per_1k?: number;
  items?: InwardChallanDesignItem[];
  notes?: string;
}

export interface PendingDesignItem {
  design_no: string;
  stitch_count: number;
  commission_type: 'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER';
  commission_rate: number;
  jobwork_price_per_1k: number;
  allocated_meters: number;
  produced_meters: number;
  remaining_meters: number;
  is_completed: boolean;
  than_count?: number;
}

export interface ActivePendingLotItem {
  id: string;
  challan_no: string;
  challan_date: string;
  lot_no: string;
  trader_name: string;
  fabric_quality: string;
  inward_meters: number;
  status: ChallanStatus;
  pending_designs: PendingDesignItem[];
}

export const InwardChallansApi = {
  getAll: async (status?: ChallanStatus): Promise<InwardChallanApiItem[]> => {
    const res = await apiClient.get<InwardChallanApiItem[]>('/api/v1/inward-challans', {
      params: status ? { status } : undefined,
    });
    return (res as unknown as { data: InwardChallanApiItem[] })?.data || (Array.isArray(res) ? res : []);
  },

  getActivePendingLots: async (): Promise<ActivePendingLotItem[]> => {
    const res = await apiClient.get<ActivePendingLotItem[]>('/api/v1/inward-challans/active-designs');
    return (res as unknown as { data: ActivePendingLotItem[] })?.data || (Array.isArray(res) ? res : []);
  },

  getById: async (id: string): Promise<InwardChallanApiItem> => {
    const res = await apiClient.get<InwardChallanApiItem>(`/api/v1/inward-challans/${id}`);
    return (res as unknown as { data: InwardChallanApiItem })?.data || (res as unknown as InwardChallanApiItem);
  },

  create: async (dto: CreateInwardChallanDto): Promise<InwardChallanApiItem> => {
    const res = await apiClient.post<InwardChallanApiItem>('/api/v1/inward-challans', dto);
    return (res as unknown as { data: InwardChallanApiItem })?.data || (res as unknown as InwardChallanApiItem);
  },

  update: async (id: string, dto: Partial<CreateInwardChallanDto>): Promise<InwardChallanApiItem> => {
    const res = await apiClient.put<InwardChallanApiItem>(`/api/v1/inward-challans/${id}`, dto);
    return (res as unknown as { data: InwardChallanApiItem })?.data || (res as unknown as InwardChallanApiItem);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/api/v1/inward-challans/${id}`);
    return (res as unknown as { data: { message: string } })?.data || (res as unknown as { message: string });
  },

  downloadPdf: async (id: string, filename: string = 'challan') => {
    const res = await apiClient.get<BlobPart>(`/api/v1/inward-challans/${id}/pdf`, {
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
