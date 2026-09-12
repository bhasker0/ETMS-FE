import { apiClient } from '../api-client';

export type ExpenseCategory = 'DIRECT' | 'INDIRECT';

export interface ExpenseApiItem {
  id: string;
  company_id: string;
  category: ExpenseCategory;
  expense_type: string;
  payee_name: string;
  expense_date: string;
  amount: number;
  payment_mode: string;
  reference_no?: string;
  is_gst_applicable: boolean;
  gst_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  category: ExpenseCategory;
  expense_type: string;
  payee_name: string;
  expense_date: string;
  amount: number;
  payment_mode?: string;
  reference_no?: string;
  is_gst_applicable?: boolean;
  gst_amount?: number;
  description?: string;
}

export interface ExpensesSummary {
  count: number;
  total_direct: number;
  total_indirect: number;
  grand_total: number;
  total_gst: number;
  direct_by_type: Record<string, number>;
  indirect_by_type: Record<string, number>;
}

export const ExpensesApi = {
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    expenseType?: string;
    paymentMode?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ expenses: ExpenseApiItem[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get<{ expenses: ExpenseApiItem[]; total: number; page: number; totalPages: number }>('/api/v1/expenses', { params });
    const data = (res as unknown as { data?: { expenses: ExpenseApiItem[]; total: number; page: number; totalPages: number } })?.data || res;
    return (data as { expenses: ExpenseApiItem[]; total: number; page: number; totalPages: number }) || { expenses: [], total: 0, page: 1, totalPages: 1 };
  },

  getSummary: async (params?: { startDate?: string; endDate?: string }): Promise<ExpensesSummary> => {
    const res = await apiClient.get<ExpensesSummary>('/api/v1/expenses/summary', { params });
    const data = (res as unknown as { data?: ExpensesSummary })?.data || res;
    return (
      (data as ExpensesSummary) || {
        count: 0,
        total_direct: 0,
        total_indirect: 0,
        grand_total: 0,
        total_gst: 0,
        direct_by_type: {},
        indirect_by_type: {},
      }
    );
  },

  getById: async (id: string): Promise<ExpenseApiItem> => {
    const res = await apiClient.get<ExpenseApiItem>(`/api/v1/expenses/${id}`);
    const data = (res as unknown as { data?: ExpenseApiItem })?.data || res;
    return data as ExpenseApiItem;
  },

  create: async (dto: CreateExpenseDto): Promise<ExpenseApiItem> => {
    const res = await apiClient.post<ExpenseApiItem>('/api/v1/expenses', dto);
    const data = (res as unknown as { data?: ExpenseApiItem })?.data || res;
    return data as ExpenseApiItem;
  },

  update: async (id: string, dto: Partial<CreateExpenseDto>): Promise<ExpenseApiItem> => {
    const res = await apiClient.put<ExpenseApiItem>(`/api/v1/expenses/${id}`, dto);
    const data = (res as unknown as { data?: ExpenseApiItem })?.data || res;
    return data as ExpenseApiItem;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/expenses/${id}`);
    const data = (res as unknown as { data?: { success: boolean; message: string } })?.data || res;
    return data as { success: boolean; message: string };
  },
};
