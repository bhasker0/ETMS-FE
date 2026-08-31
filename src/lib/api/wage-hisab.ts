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
  rate_per_meter: number;
  gross_earnings: number;
  total_uchapat_advances: number;
  deductions: number;
  deduction_reason?: string;
  net_payable: number;
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
    const res: any = await apiClient.post('/api/v1/wage-hisab/calculate', dto);
    const raw = res?.data || res;

    const karigar = raw?.karigar || {};
    const period = raw?.period || {};
    const summary = raw?.summary || {};

    const totalMeters = Number(raw?.total_meters ?? summary?.totalMeters ?? 0);
    const grossEarnings = Number(raw?.gross_earnings ?? summary?.grossEarnings ?? 0);
    const totalUchapat = Number(raw?.total_uchapat_advances ?? summary?.totalUchapatAdvances ?? 0);
    const deductions = Number(raw?.deductions ?? summary?.deductions ?? 0);
    const netPayable = Number(raw?.net_payable ?? summary?.netPayable ?? (grossEarnings - totalUchapat - deductions));

    return {
      karigar_id: raw?.karigar_id || karigar?.id || dto.karigar_id,
      karigar_name: raw?.karigar_name || karigar?.name || 'Karigar',
      wage_type: raw?.wage_type || karigar?.wage_type || 'PIECE_RATE',
      startDate: raw?.startDate || period?.startDate || dto.startDate,
      endDate: raw?.endDate || period?.endDate || dto.endDate,
      total_shifts: Number(raw?.total_shifts ?? summary?.shiftsCount ?? 0),
      total_meters: totalMeters,
      rate_per_meter: Number(raw?.rate_per_meter ?? karigar?.rate_per_meter ?? 1.2),
      gross_earnings: grossEarnings,
      total_uchapat_advances: totalUchapat,
      deductions: deductions,
      deduction_reason: raw?.deduction_reason || summary?.deduction_reason || dto.deduction_reason || '',
      net_payable: netPayable,
      included_advance_ids: raw?.included_advance_ids || [],
    };
  },

  settle: async (dto: SettleWageHisabDto): Promise<any> => {
    const res: any = await apiClient.post('/api/v1/wage-hisab/settle', dto);
    return res?.data;
  },

  downloadPdf: async (dto: CalculateWageHisabDto, karigarName: string): Promise<void> => {
    const response = await apiClient.post('/api/v1/wage-hisab/pdf', dto, {
      responseType: 'blob',
    });
    const blob = new Blob([response as any], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hisab_Slip_${karigarName.replace(/\s+/g, '_')}_${dto.startDate}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
