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
    return res?.data;
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
