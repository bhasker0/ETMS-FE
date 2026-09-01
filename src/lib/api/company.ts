import { apiClient } from '../api-client';

export const DEFAULT_DASHBOARD_CARDS = [
  'fleet_status',
  'production_output',
  'sac_billing',
  'inward_lots',
];

export const CompanyApi = {
  getDashboardLayout: async (): Promise<string[]> => {
    try {
      const res: any = await apiClient.get('/api/v1/company/current/dashboard-layout');
      const order = res?.data?.card_order || res?.card_order;
      if (Array.isArray(order) && order.length > 0) {
        return order;
      }
      return DEFAULT_DASHBOARD_CARDS;
    } catch (e) {
      console.warn('Could not fetch remote dashboard layout:', e);
      return DEFAULT_DASHBOARD_CARDS;
    }
  },

  updateDashboardLayout: async (cardOrder: string[]): Promise<string[]> => {
    const res: any = await apiClient.put('/api/v1/company/current/dashboard-layout', {
      card_order: cardOrder,
    });
    return res?.data?.card_order || res?.card_order || cardOrder;
  },
};