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

export const MunimApi = {
  getApprovedCompanies: async (): Promise<MunimClientCompany[]> => {
    const res: any = await apiClient.get('/api/v1/munim/companies');
    return res?.data || [];
  },

  getConsolidatedDaybook: async (date?: string): Promise<ConsolidatedDaybook> => {
    const res: any = await apiClient.get('/api/v1/munim/consolidated-daybook', {
      params: date ? { date } : undefined,
    });
    return res?.data;
  },

  getMyRequests: async (): Promise<MunimRequestApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/munim/my-requests');
    return res?.data || [];
  },

  getCompanyRequests: async (): Promise<MunimRequestApiItem[]> => {
    const res: any = await apiClient.get('/api/v1/munim/company-requests');
    return res?.data || [];
  },

  munimInviteCompany: async (payload: { gstin?: string; mobile?: string; companyMobile?: string; notes?: string }): Promise<any> => {
    const res: any = await apiClient.post('/api/v1/munim/invite-company', {
      gstin: payload.gstin,
      companyMobile: payload.companyMobile || payload.mobile,
      notes: payload.notes,
    });
    return res?.data;
  },

  companyInviteMunim: async (payload: { munim_mobile?: string; munimMobile?: string; notes?: string }): Promise<any> => {
    const res: any = await apiClient.post('/api/v1/munim/company-invite-munim', {
      munimMobile: payload.munimMobile || payload.munim_mobile,
      notes: payload.notes,
    });
    return res?.data;
  },

  respondToRequest: async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'REVOKE'): Promise<any> => {
    const statusMap: Record<string, string> = {
      ACCEPT: 'ACCEPTED',
      REJECT: 'REJECTED',
      REVOKE: 'REVOKED',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      REVOKED: 'REVOKED',
    };
    const res: any = await apiClient.patch(`/api/v1/munim/requests/${requestId}/respond`, {
      status: statusMap[action] || action,
    });
    return res?.data;
  },
};
