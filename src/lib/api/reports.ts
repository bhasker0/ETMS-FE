import { apiClient } from '../api-client';

export interface ProductionReportItem {
  id: string;
  date: string;
  shift: string;
  machine_no: string;
  karigar_name: string;
  design_no: string;
  stitches: number;
  meters: number;
  start_counter: number;
  end_counter: number;
  rate_per_meter: number;
  wages: number;
  downtime_minutes: number;
  downtime_reason: string;
}

export interface SalesReportItem {
  id: string;
  invoice_no: string;
  date: string;
  party_name: string;
  party_gstin: string;
  design_no: string;
  stitches: number;
  meters: number;
  rate: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
  payment_status: string;
  tally_synced: string;
}

export interface ChallanReportItem {
  id: string;
  challan_no: string;
  lot_no: string;
  date: string;
  party_name: string;
  party_gstin: string;
  fabric_quality: string;
  thans: number;
  meters: number;
  design_no: string;
  stitch_count: number;
  rate: number;
  status: string;
}

export interface ExpenseReportItem {
  id: string;
  date: string;
  category: string;
  type: string;
  payee_name: string;
  amount: number;
  payment_mode: string;
  reference_no: string;
  gst_amount: number;
  description: string;
}

export interface PurchaseReportItem {
  id: string;
  date: string;
  invoice_no: string;
  supplier_name: string;
  supplier_gstin: string;
  category: string;
  subtotal: number;
  gst_amount: number;
  net_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  payment_mode: string;
  items_count: number;
  notes: string;
}

export interface PnlReportResult {
  report: string;
  period: { startDate: string; endDate: string };
  revenue: { jobwork_billing: number; invoices_count: number };
  direct_costs: {
    karigar_wages: number;
    yarn_purchases: number;
    spare_parts_purchases: number;
    electricity_power: number;
    machine_repairs: number;
    other_direct_expenses: number;
    total_direct_cost: number;
  };
  gross_profit: number;
  indirect_costs: {
    factory_rent: number;
    staff_salaries: number;
    karigar_advances: number;
    other_indirect_expenses: number;
    total_indirect_cost: number;
  };
  net_profit: number;
  profit_margin_percent: number;
}

export interface ReportDataWithSummary<T, S = Record<string, unknown>> {
  summary: S;
  data: T[];
}

export const ReportsApi = {
  getProduction: async (params?: {
    startDate?: string;
    endDate?: string;
    machineId?: string;
    karigarId?: string;
    designNo?: string;
    shiftType?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ summary: any; data: ProductionReportItem[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/production', { params });
    return res?.data || res;
  },

  getSales: async (params?: {
    startDate?: string;
    endDate?: string;
    partyName?: string;
    designNo?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ summary: any; data: SalesReportItem[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/sales', { params });
    return res?.data || res;
  },

  getChallans: async (params?: {
    startDate?: string;
    endDate?: string;
    partyName?: string;
    fabricQuality?: string;
    status?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ summary: any; data: ChallanReportItem[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/challans', { params });
    return res?.data || res;
  },

  getExpenses: async (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    expenseType?: string;
    paymentMode?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ summary: any; data: ExpenseReportItem[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/expenses', { params });
    return res?.data || res;
  },

  getPurchases: async (params?: {
    startDate?: string;
    endDate?: string;
    supplierName?: string;
    category?: string;
    paymentStatus?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ summary: any; data: PurchaseReportItem[] }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/purchases', { params });
    return res?.data || res;
  },

  getPnl: async (params?: { startDate?: string; endDate?: string }): Promise<PnlReportResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.get<any>('/api/v1/reports/pnl', { params });
    return res?.data || res;
  },
};
