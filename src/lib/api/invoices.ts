import { apiClient } from '../api-client';

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
  inward_challan?: any;
  trader_name: string;
  trader_gstin?: string;
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
  is_tally_synced: boolean;
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
  notes?: string;
}

export const OutwardInvoicesApi = {
  calculatePreview: async (dto: CalculateInvoiceDto): Promise<CalculateInvoiceResult> => {
    const res: any = await apiClient.post('/api/v1/outward-invoices/calculate', dto);
    return res?.data;
  },

  getAll: async (params?: { startDate?: string; endDate?: string }): Promise<OutwardInvoiceApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/outward-invoices', { params });
    return res?.data || [];
  },

  getById: async (id: string): Promise<OutwardInvoiceApiItem> => {
    const res: any = await apiClient.get(`/api/v1/outward-invoices/${id}`);
    return res?.data;
  },

  create: async (dto: CreateOutwardInvoiceDto): Promise<OutwardInvoiceApiItem> => {
    const res: any = await apiClient.post('/api/v1/outward-invoices', dto);
    return res?.data;
  },

  getPdfUrl: (id: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${baseUrl}/api/v1/outward-invoices/${id}/pdf`;
  },

  downloadPdf: async (id: string, invoiceNo: string): Promise<void> => {
    const response = await apiClient.get(`/api/v1/outward-invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response as any], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${invoiceNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/outward-invoices/${id}`);
  },
};
