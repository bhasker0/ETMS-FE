import { apiClient } from '../api-client';

export const TallyApi = {
  downloadInvoicesXml: async (params?: { startDate?: string; endDate?: string; onlyUnsynced?: boolean }): Promise<void> => {
    const response = await apiClient.get('/api/v1/tally/export/invoices', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response as unknown as BlobPart], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TallyPrime_Sales_SAC9988_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  markAsSynced: async (invoiceIds: string[]): Promise<{ updatedCount?: number }> => {
    const res = await apiClient.post<{ success?: boolean; data?: { updatedCount?: number } }>('/api/v1/tally/sync-status', { invoiceIds }) as unknown as { success?: boolean; data?: { updatedCount?: number } };
    return res?.data || {};
  },
};
