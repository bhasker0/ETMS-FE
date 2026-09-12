import { apiClient } from '../api-client';

export interface SendWhatsappDocumentDto {
  phone: string;
  filename: string;
  document_base64: string;
  caption?: string;
}

export interface SendInvoiceWhatsappDto {
  phone?: string;
  caption?: string;
}

export interface WhatsappSendResult {
  success?: boolean;
  message?: string;
  isFallback?: boolean;
  fallbackUrl?: string;
  recipient?: {
    phone?: string;
    name?: string;
    [key: string]: unknown;
  };
  data?: unknown;
  [key: string]: unknown;
}

export const WhatsappApi = {
  sendDocument: async (dto: SendWhatsappDocumentDto) => {
    const res = await apiClient.post<WhatsappSendResult>('/api/v1/whatsapp/send-document', dto);
    return res?.data || res;
  },

  sendInvoicePdf: async (invoiceId: string, dto?: SendInvoiceWhatsappDto) => {
    const res = await apiClient.post<WhatsappSendResult>(`/api/v1/whatsapp/invoices/${invoiceId}/send`, dto || {});
    return res?.data || res;
  },

  sendChallanPdf: async (challanId: string, dto?: { phone?: string; caption?: string }) => {
    const res = await apiClient.post<WhatsappSendResult>(`/api/v1/whatsapp/challans/${challanId}/send`, dto || {});
    return res?.data || res;
  },

  sendPartyStatementPdf: async (
    partyId: string,
    dto?: { phone?: string; startDate?: string; endDate?: string; caption?: string },
  ) => {
    const res = await apiClient.post<WhatsappSendResult>(`/api/v1/whatsapp/parties/${partyId}/statement/send`, dto || {});
    return res?.data || res;
  },
};
