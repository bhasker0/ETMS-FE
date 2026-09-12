import { apiClient, getApiBaseUrl } from '../api-client';
import type { InwardChallanApiItem } from './challans';
import type { PartyApiItem } from './parties';

export interface CalculateInvoiceDto {
  total_stitches: number;
  rate_per_1000: number;
  machine_heads: number;
  inward_meters: number;
  outward_meters: number;
  trader_gstin?: string;
}

export interface CalculateInvoiceResult {
  gross_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  net_amount: number;
  is_interstate: boolean;
  shrinkage_meters: number;
  shrinkage_percent: number;
  is_shrinkage_exceeded: boolean;
  shrinkage_warning?: string;
}

export interface OutwardInvoiceApiItem {
  id: string;
  invoice_no: string;
  invoice_date: string;
  inward_challan_id?: string;
  inward_challan?: InwardChallanApiItem;
  trader_name: string;
  trader_gstin?: string;
  trader_mobile?: string;
  party?: PartyApiItem;
  sac_code: string;
  total_stitches: number;
  machine_heads: number;
  rate_per_1000: number;
  inward_meters: number;
  outward_meters: number;
  gross_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  net_amount: number;
  is_interstate: boolean;
  shrinkage_percent: number;
  is_tally_synced?: boolean;
  tally_guid?: string;
  lot_items?: Array<{
    inward_challan_id: string;
    lot_no: string;
    meters: number;
    thans?: number;
    fabric_quality?: string;
    design_no?: string;
    rate?: number;
  }>;
  company_id: string;
  created_at: string;
}

export interface CreateOutwardInvoiceDto {
  inward_challan_id?: string;
  trader_name: string;
  trader_gstin?: string;
  invoice_date: string;
  total_stitches: number;
  machine_heads: number;
  rate_per_1000: number;
  inward_meters: number;
  outward_meters: number;
  lot_items?: Array<{
    inward_challan_id?: string;
    lot_no: string;
    meters: number;
    thans?: number;
    fabric_quality?: string;
    design_no?: string;
    rate?: number;
    stitch_count?: number;
    machine_heads?: number;
    taxable_amount?: number;
  }>;
  notes?: string;
}

export const OutwardInvoicesApi = {
  calculatePreview: async (dto: CalculateInvoiceDto): Promise<CalculateInvoiceResult> => {
    const res = await apiClient.post<CalculateInvoiceResult>('/api/v1/outward-invoices/calculate', dto);
    const data = (res as unknown as { data?: CalculateInvoiceResult })?.data || res;
    return data as CalculateInvoiceResult;
  },

  getAll: async (params?: { startDate?: string; endDate?: string; search?: string; inward_challan_id?: string }): Promise<OutwardInvoiceApiItem[]> => {
    const res = await apiClient.get<OutwardInvoiceApiItem[]>('/api/v1/outward-invoices', { params });
    const data = (res as unknown as { data?: OutwardInvoiceApiItem[] })?.data || res;
    return (data as OutwardInvoiceApiItem[]) || [];
  },

  getById: async (id: string): Promise<OutwardInvoiceApiItem> => {
    const res = await apiClient.get<OutwardInvoiceApiItem>(`/api/v1/outward-invoices/${id}`);
    const data = (res as unknown as { data?: OutwardInvoiceApiItem })?.data || res;
    return data as OutwardInvoiceApiItem;
  },

  create: async (dto: CreateOutwardInvoiceDto): Promise<OutwardInvoiceApiItem> => {
    const res = await apiClient.post<OutwardInvoiceApiItem>('/api/v1/outward-invoices', dto);
    const data = (res as unknown as { data?: OutwardInvoiceApiItem })?.data || res;
    return data as OutwardInvoiceApiItem;
  },

  getPdfUrl: (id: string): string => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/v1/outward-invoices/${id}/pdf`;
  },

  downloadPdf: async (id: string, invoiceNo: string): Promise<void> => {
    const response = await apiClient.get<BlobPart>(`/api/v1/outward-invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    const rawData = response instanceof Blob ? response : ((response as { data?: BlobPart })?.data instanceof Blob ? (response as { data: Blob }).data : (response as unknown as BlobPart));
    const blob = new Blob([rawData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${invoiceNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  },

  update: async (id: string, dto: Partial<CreateOutwardInvoiceDto>): Promise<OutwardInvoiceApiItem> => {
    const res = await apiClient.put<OutwardInvoiceApiItem>(`/api/v1/outward-invoices/${id}`, dto);
    const data = (res as unknown as { data?: OutwardInvoiceApiItem })?.data || res;
    return data as OutwardInvoiceApiItem;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/outward-invoices/${id}`);
  },
};
