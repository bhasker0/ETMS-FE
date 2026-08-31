export type Language = 'en' | 'gu' | 'hi' | 'mr' | 'ta' | 'te' | 'kn' | 'bn';
export type UserRole = 'shopfloor' | 'owner' | 'munim';

export type ShiftType = 'day' | 'night';
export type MachineStatus = 'running' | 'idle' | 'maintenance';
export type ChallanStatus = 'in_production' | 'completed' | 'dispatched';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Machine {
  id: string;
  name: string; // e.g. "મશીન 1"
  nameEn: string; // "Machine 1"
  headCount: number; // e.g. 24, 32, 33
  rpm: number; // e.g. 850
  status: MachineStatus;
  currentKarigar?: string;
  activeLot?: string;
  activeFabric?: string;
  todayStitches: number;
  todayMeters: number;
  lastShiftTime: string;
}

export interface Karigar {
  id: string;
  name: string; // e.g. "મહેશભાઈ"
  nameEn: string; // "Maheshbhai"
  phone: string;
  avatar: string;
  assignedMachineId?: string;
  totalShifts: number;
  currentMonthStitches: number;
  currentBalanceUchapat: number; // Cash advance balance
  ratePerThousand: number;
}

export interface ShiftEntry {
  id: string;
  machineId: string;
  machineName: string;
  shiftType: ShiftType;
  inwardLotId: string;
  lotNumber: string;
  fabricQuality: string;
  startCounter: number;
  endCounter: number;
  netStitches: number;
  metersProduced: number;
  karigarId: string;
  karigarName: string;
  timestamp: string;
  ratePerThousand: number;
  syncedToBackend: boolean;
  operatorNotes?: string;
}

export interface InwardChallan {
  id: string;
  challanNumber: string;
  lotNumber: string;
  traderName: string;
  traderMobile: string;
  traderGstin: string;
  inwardDate: string;
  numberOfTakas: number;
  fabricQuality: string;
  inwardGrayMeters: number;
  outwardFinishedMeters?: number;
  ratePerThousand: number;
  status: ChallanStatus;
  shrinkagePercent?: number;
  shrinkageExceeded?: boolean; // True if > 3%
  shrinkageReason?: string;
  createdAt: string;
}

export interface InvoiceSAC9988 {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-089"
  invoiceDate: string;
  challanId?: string;
  lotNumber: string;
  traderName: string;
  traderGstin: string;
  traderMobile: string;
  traderAddress: string;
  sacCode: string; // Always "9988" for Embroidery Job Work
  fabricQuality: string;
  numberOfTakas: number;
  totalStitches: number;
  headCount: number;
  ratePerThousand: number; // Rate per 1000 stitches
  meters: number;
  baseAmount: number;
  gstRate: number; // 5%
  cgstAmount: number; // 2.5%
  sgstAmount: number; // 2.5%
  igstAmount: number; // 5% if interstate
  isInterstate: boolean;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  whatsappDispatched: boolean;
  tallySynced: boolean;
  termsCondition: string;
}

export interface UchapatTransaction {
  id: string;
  karigarId: string;
  karigarName: string;
  date: string;
  amount: number;
  type: 'advance' | 'settlement' | 'wage_credit';
  note: string;
  voucherNo: string;
}

export interface FortnightHisab {
  id: string;
  karigarId: string;
  karigarName: string;
  periodStart: string;
  periodEnd: string;
  totalShifts: number;
  dayShifts: number;
  nightShifts: number;
  totalStitches: number;
  totalMeters: number;
  grossEarnings: number;
  totalAdvanceDeducted: number;
  netPayable: number;
  isSettled: boolean;
  settlementDate?: string;
}

export interface CompanyTenant {
  id: string;
  name: string;
  gstin: string;
  address: string;
  phone: string;
  totalMachines: number;
  activeJobsCount: number;
  munimAccessStatus: 'connected' | 'pending' | 'rejected';
  lastReconciledDate: string;
}

export interface ConnectionRequest {
  id: string;
  companyName: string;
  gstin: string;
  phone: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ClientLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  userRole?: string;
  companyId?: string;
  userAgent?: string;
  offline?: boolean;
}
