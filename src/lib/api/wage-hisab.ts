import { apiClient } from '../api-client';

export interface CalculateWageHisabDto {
  karigar_id: string;
  startDate: string;
  endDate: string;
  deductions?: number;
  deduction_reason?: string;
}

export interface WageHisabCalculationResult {
  karigar_id: string;
  karigar_name: string;
  wage_type: string;
  startDate: string;
  endDate: string;
  total_shifts: number;
  total_meters: number;
  total_stitches?: number;
  rate_per_meter: number;
  base_salary?: number;
  incentive_commission?: number;
  gross_earnings: number;
  total_uchapat_advances: number;
  deductions: number;
  deduction_reason?: string;
  net_payable: number;
  attendance?: {
    total_period_days: number;
    attended_days: number;
    absent_days: number;
    daily_base_salary: number;
    suggested_absent_deduction: number;
  };
  shifts?: Array<{
    id: string;
    shift_date: string;
    shift_type: string;
    machine_no: string;
    design_no?: string;
    total_meters: number;
    total_stitches: number;
    stitch_count?: number;
    commission_rate?: number;
    commission_type?: string;
    applied_basis?: string;
    shift_earnings?: number;
    shift_base_salary?: number;
    shift_incentive?: number;
  }>;
  uchapats?: Array<{
    id: string;
    date: string;
    amount: number;
    reason?: string;
    payment_mode?: string;
  }>;
  karigar?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  included_advance_ids?: string[];
}

export interface SettleWageHisabDto {
  karigar_id: string;
  startDate: string;
  endDate: string;
  gross_earnings: number;
  total_uchapat_advances: number;
  deductions?: number;
  deduction_reason?: string;
  net_payable: number;
  payment_mode?: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  notes?: string;
}

export const WageHisabApi = {
  calculate: async (dto: CalculateWageHisabDto): Promise<WageHisabCalculationResult> => {
    const res = await apiClient.post<Record<string, unknown>>('/api/v1/wage-hisab/calculate', dto) as unknown as Record<string, unknown>;
    const raw = (res?.data as Record<string, unknown>) || res;

    const karigar = (raw?.karigar as Record<string, unknown>) || {};
    const period = (raw?.period as Record<string, unknown>) || {};
    const summary = (raw?.summary as Record<string, unknown>) || {};

    const totalMeters = Number(raw?.total_meters ?? summary?.totalMeters ?? 0);
    const totalStitches = Number(raw?.total_stitches ?? summary?.totalStitches ?? 0);
    const baseSalary = Number(raw?.base_salary ?? summary?.baseSalary ?? 0);
    const incentiveCommission = Number(raw?.incentive_commission ?? summary?.incentiveCommission ?? 0);
    const grossEarnings = Number(raw?.gross_earnings ?? summary?.grossEarnings ?? 0);
    const totalUchapat = Number(raw?.total_uchapat_advances ?? summary?.totalUchapatAdvances ?? 0);
    const deductions = Number(raw?.deductions ?? summary?.deductions ?? 0);
    const netPayable = Number(raw?.net_payable ?? summary?.netPayable ?? (grossEarnings - totalUchapat - deductions));

    return {
      karigar_id: (raw?.karigar_id as string) || (karigar?.id as string) || dto.karigar_id,
      karigar_name: (raw?.karigar_name as string) || (karigar?.name as string) || 'Karigar',
      wage_type: (raw?.wage_type as string) || (karigar?.wage_type as string) || 'PIECE_RATE',
      startDate: (raw?.startDate as string) || (period?.startDate as string) || dto.startDate,
      endDate: (raw?.endDate as string) || (period?.endDate as string) || dto.endDate,
      total_shifts: Number(raw?.total_shifts ?? summary?.shiftsCount ?? 0),
      total_meters: totalMeters,
      total_stitches: totalStitches,
      rate_per_meter: Number(raw?.rate_per_meter ?? karigar?.rate_per_meter ?? 1.2),
      base_salary: baseSalary,
      incentive_commission: incentiveCommission,
      gross_earnings: grossEarnings,
      total_uchapat_advances: totalUchapat,
      deductions: deductions,
      deduction_reason: (raw?.deduction_reason as string) || (summary?.deduction_reason as string) || dto.deduction_reason || '',
      net_payable: netPayable,
      attendance: raw?.attendance as WageHisabCalculationResult['attendance'],
      shifts: (raw?.shifts as WageHisabCalculationResult['shifts']) || [],
      uchapats: (raw?.uchapats as WageHisabCalculationResult['uchapats']) || [],
      karigar,
      summary,
      included_advance_ids: (raw?.included_advance_ids as string[]) || [],
    };
  },

  settle: async (dto: SettleWageHisabDto): Promise<{ success?: boolean; settlement_id?: string }> => {
    const res = await apiClient.post<{ success?: boolean; data?: { success?: boolean; settlement_id?: string } }>('/api/v1/wage-hisab/settle', dto) as unknown as { success?: boolean; data?: { success?: boolean; settlement_id?: string } };
    return res?.data || {};
  },

  downloadPdf: async (dto: CalculateWageHisabDto, karigarName: string): Promise<void> => {
    const response = await apiClient.post('/api/v1/wage-hisab/pdf', dto, {
      responseType: 'blob',
    });
    const blob = new Blob([response as unknown as BlobPart], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hisab_Slip_${karigarName.replace(/\s+/g, '_')}_${dto.startDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
