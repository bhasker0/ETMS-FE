import { apiClient } from '../api-client';

export interface MunimClientCompany {
  id: string;
  name: string;
  gstin: string;
  address?: string;
  phone?: string;
  access_status: 'ACTIVE' | 'PENDING' | 'REVOKED';
  permissions: string[];
}

export interface MunimRequestApiItem {
  id: string;
  company_id?: string;
  company_name?: string;
  company_gstin?: string;
  munim_name?: string;
  munim_mobile?: string;
  company?: {
    id: string;
    name: string;
    gstin?: string;
    address?: string;
    phone?: string;
  };
  munimUser?: {
    id: string;
    full_name: string;
    mobile?: string;
    email?: string;
  };
  requester?: {
    id: string;
    full_name: string;
    mobile?: string;
  };
  initiator_type?: 'MUNIM_TO_COMPANY' | 'COMPANY_TO_MUNIM';
  initiated_by?: 'MUNIM' | 'COMPANY';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';
  request_notes?: string;
  created_at: string;
}

export interface ConsolidatedDaybook {
  total_active_companies: number;
  today_meters_total: number;
  today_stitches_total: number;
  total_invoices_amount: number;
  uncollected_receivables: number;
  total_uchapat_outstanding: number;
  company_breakdowns: {
    company_id: string;
    company_name: string;
    today_meters: number;
    uncollected_balance: number;
    active_machines: number;
    pending_challans: number;
  }[];
}

export interface MunimActionResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export const MunimApi = {
  getApprovedCompanies: async (): Promise<MunimClientCompany[]> => {
    const res = await apiClient.get<MunimClientCompany[]>('/api/v1/munim/companies');
    const data = (res as unknown as { data?: MunimClientCompany[] })?.data || res;
    return (data as MunimClientCompany[]) || [];
  },

  getConsolidatedDaybook: async (date?: string): Promise<ConsolidatedDaybook> => {
    const res = await apiClient.get<ConsolidatedDaybook>('/api/v1/munim/consolidated-daybook', {
      params: date ? { date } : undefined,
    });
    const data = (res as unknown as { data?: ConsolidatedDaybook })?.data || res;
    return data as ConsolidatedDaybook;
  },

  getMyRequests: async (): Promise<MunimRequestApiItem[]> => {
    const res = await apiClient.get<MunimRequestApiItem[]>('/api/v1/munim/my-requests');
    const data = (res as unknown as { data?: MunimRequestApiItem[] })?.data || res;
    return (data as MunimRequestApiItem[]) || [];
  },

  getCompanyRequests: async (): Promise<MunimRequestApiItem[]> => {
    const res = await apiClient.get<MunimRequestApiItem[]>('/api/v1/munim/company-requests');
    const data = (res as unknown as { data?: MunimRequestApiItem[] })?.data || res;
    return (data as MunimRequestApiItem[]) || [];
  },

  munimInviteCompany: async (payload: { gstin?: string; mobile?: string; companyMobile?: string; notes?: string }): Promise<MunimActionResponse> => {
    const res = await apiClient.post<MunimActionResponse>('/api/v1/munim/invite-company', {
      gstin: payload.gstin,
      companyMobile: payload.companyMobile || payload.mobile,
      notes: payload.notes,
    });
    const data = (res as unknown as { data?: MunimActionResponse })?.data || res;
    return data as MunimActionResponse;
  },

  companyInviteMunim: async (payload: { munim_mobile?: string; munimMobile?: string; notes?: string }): Promise<MunimActionResponse> => {
    const res = await apiClient.post<MunimActionResponse>('/api/v1/munim/company-invite-munim', {
      munimMobile: payload.munimMobile || payload.munim_mobile,
      notes: payload.notes,
    });
    const data = (res as unknown as { data?: MunimActionResponse })?.data || res;
    return data as MunimActionResponse;
  },

  respondToRequest: async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'REVOKE'): Promise<MunimActionResponse> => {
    const statusMap: Record<string, string> = {
      ACCEPT: 'ACCEPTED',
      REJECT: 'REJECTED',
      REVOKE: 'REVOKED',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      REVOKED: 'REVOKED',
    };
    const res = await apiClient.patch<MunimActionResponse>(`/api/v1/munim/requests/${requestId}/respond`, {
      status: statusMap[action] || action,
    });
    const data = (res as unknown as { data?: MunimActionResponse })?.data || res;
    return data as MunimActionResponse;
  },
};
