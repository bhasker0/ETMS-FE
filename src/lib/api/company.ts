import { apiClient } from '../api-client';

export const DEFAULT_DASHBOARD_CARDS = [
  'fleet_status',
  'production_output',
  'sac_billing',
  'inward_lots',
];

export interface DashboardLayoutResponse {
  card_order?: string[];
  [key: string]: unknown;
}

export const CompanyApi = {
  getDashboardLayout: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<DashboardLayoutResponse>('/api/v1/company/current/dashboard-layout');
      const data = (res as unknown as { data?: DashboardLayoutResponse })?.data || (res as unknown as DashboardLayoutResponse);
      const order = data?.card_order;
      if (Array.isArray(order) && order.length > 0) {
        return order;
      }
      return DEFAULT_DASHBOARD_CARDS;
    } catch (_e) {
      return DEFAULT_DASHBOARD_CARDS;
    }
  },

  updateDashboardLayout: async (cardOrder: string[]): Promise<string[]> => {
    const res = await apiClient.put<DashboardLayoutResponse>('/api/v1/company/current/dashboard-layout', {
      card_order: cardOrder,
    });
    const data = (res as unknown as { data?: DashboardLayoutResponse })?.data || (res as unknown as DashboardLayoutResponse);
    return data?.card_order || cardOrder;
  },
};