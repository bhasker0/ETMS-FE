'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { WageHisabApi, WageHisabCalculationResult } from '@/lib/api/wage-hisab';
import { formatNumber, formatINR } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Calculator,
  Download,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 5. Hisab Drawer Form (Compute Fortnight Settlement & Disburse Salary)      */
/* -------------------------------------------------------------------------- */
export const HisabDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const todayStr = new Date().toISOString().split('T')[0];
  const fortnightAgoStr = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState(instance.payload?.karigarId || '');
  const [startDate, setStartDate] = useState(instance.payload?.startDate || fortnightAgoStr);
  const [endDate, setEndDate] = useState(instance.payload?.endDate || todayStr);
  const [deductions, setDeductions] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [settling, setSettling] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [step, setStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [computedHisab, setComputedHisab] = useState<WageHisabCalculationResult | null>(null);
  const [settlePaymentMode, setSettlePaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [settleNotes, setSettleNotes] = useState('');
  const [showShiftsTable, setShowShiftsTable] = useState(false);
  const [showUchapatsTable, setShowUchapatsTable] = useState(false);

  const [attendancePreview, setAttendancePreview] = useState<{
    total_period_days: number;
    attended_days: number;
    absent_days: number;
    daily_base_salary: number;
    suggested_absent_deduction: number;
  } | null>(null);

  useEffect(() => {
    KarigarsApi.getAll()
      .then((data) => {
        setKarigars(data);
        if (!selectedKarigarId && data.length > 0) {
          setSelectedKarigarId(data[0].id);
        }
      })
      .catch((e) => console.warn('Failed to load karigars in hisab drawer:', e));
  }, []);

  // Fetch attendance preview when karigar or dates change
  useEffect(() => {
    if (!selectedKarigarId || !startDate || !endDate) return;
    WageHisabApi.calculate({
      karigar_id: selectedKarigarId,
      startDate,
      endDate,
    })
      .then((res) => {
        if (res.attendance) {
          setAttendancePreview(res.attendance);
        } else {
          setAttendancePreview(null);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch hisab attendance preview:', err);
        setAttendancePreview(null);
      });
  }, [selectedKarigarId, startDate, endDate]);

  const handleCompute = async () => {
    if (!selectedKarigarId) {
      toast.error('Please select a karigar');
      return;
    }
    if (endDate > todayStr) {
      toast.error(t.hisab_errEndDateFuture || "Hisab calculation end date cannot be greater than today's date");
      return;
    }
    setCalculating(true);
    try {
      const result = await WageHisabApi.calculate({
        karigar_id: selectedKarigarId,
        startDate,
        endDate,
        deductions: deductions > 0 ? deductions : undefined,
        deduction_reason: deductions > 0 ? deductionReason : undefined,
      });

      setComputedHisab(result);
      setStep('PREVIEW');
      toast.success(`Hisab computed: Net Payable ₹${result.net_payable.toLocaleString('en-IN')}`);
    } catch (err: any) {
      toast.error('Failed to compute hisab: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleSettle = async () => {
    if (!computedHisab) return;
    setSettling(true);
    try {
      const result = await WageHisabApi.settle({
        karigar_id: selectedKarigarId,
        startDate,
        endDate,
        gross_earnings: computedHisab.gross_earnings,
        total_uchapat_advances: computedHisab.total_uchapat_advances,
        deductions: computedHisab.deductions,
        deduction_reason: computedHisab.deduction_reason,
        net_payable: computedHisab.net_payable,
        payment_mode: settlePaymentMode,
        notes: settleNotes || `Settled via ${settlePaymentMode}`,
      });

      toast.success(
        `Wage Hisab settled! ₹${computedHisab.net_payable.toLocaleString('en-IN')} added to Expenses as Salary.`,
        { duration: 5000 }
      );
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to settle hisab: ' + err.message);
    } finally {
      setSettling(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!computedHisab) return;
    setDownloadingPdf(true);
    try {
      await WageHisabApi.downloadPdf(
        {
          karigar_id: selectedKarigarId,
          startDate,
          endDate,
          deductions: computedHisab.deductions,
          deduction_reason: computedHisab.deduction_reason,
        },
        computedHisab.karigar_name
      );
      toast.success('Downloaded Hisab payslip PDF');
    } catch (err: any) {
      toast.error('Failed to download PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const selectedKarigar = karigars.find((k) => k.id === selectedKarigarId);

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={
        step === 'PREVIEW' && computedHisab
          ? `Wage Settlement: ${computedHisab.karigar_name}`
          : t.hisab_drawerTitle
      }
      subtitle={
        step === 'PREVIEW' && computedHisab
          ? `Period: ${startDate} to ${endDate} • ${computedHisab.wage_type === 'PIECE_RATE' ? 'Piece-Rate' : 'Fixed Monthly'}`
          : t.hisab_drawerSubtitle
      }
      icon={<Calculator className="w-4 h-4 text-[var(--text-main)]" />}
      size={step === 'PREVIEW' ? 'lg' : 'md'}
      footer={
        step === 'CONFIG' ? (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={closeDrawer}
              className="w-1/2 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)] rounded-md text-xs font-semibold transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleCompute}
              disabled={calculating}
              className="w-1/2 py-2 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold rounded-md text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{calculating ? 'Computing Hisab...' : 'Compute Hisab & Preview'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep('CONFIG')}
                className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Parameters</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                title="Download PDF Hisab Slip"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Downloading...' : 'PDF Slip'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSettle}
              disabled={settling}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold rounded-md text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {settling
                  ? 'Settling & Recording...'
                  : `Settle Wage (${formatINR(computedHisab?.net_payable || 0)})`}
              </span>
            </button>
          </div>
        )
      }
    >
      {step === 'CONFIG' ? (
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">
              {t.uchapat_labelBeneficiary} *
            </label>
            <select
              value={selectedKarigarId}
              onChange={(e) => setSelectedKarigarId(e.target.value)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-main)] font-medium focus:outline-hidden"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.wage_type === 'PIECE_RATE' ? t.karigar_typePieceRate : t.karigar_typeFixedMonthly})
                </option>
              ))}
            </select>
          </div>

          {selectedKarigar && (
            <div className="p-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs text-[var(--text-muted)] flex justify-between">
              <span>Wage Model: <strong className="text-[var(--text-main)]">{selectedKarigar.wage_type}</strong></span>
              <span>Mobile: <strong className="text-[var(--text-main)] font-mono">{selectedKarigar.mobile}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">
                {t.hisab_labelStartDate} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] font-mono focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">
                {t.hisab_labelEndDate} *
              </label>
              <input
                type="date"
                value={endDate}
                max={todayStr}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-main)] font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
                {t.hisab_labelCustomDeductions}
              </label>
              {attendancePreview && attendancePreview.absent_days > 0 && attendancePreview.daily_base_salary > 0 && (
                <div className="flex items-center gap-1.5 text-2xs font-semibold text-rose-600 dark:text-rose-400">
                  <span>
                    Absent: {attendancePreview.absent_days}d ({formatINR(attendancePreview.suggested_absent_deduction)})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeductions(attendancePreview.suggested_absent_deduction);
                      setDeductionReason(`Absent: ${attendancePreview.absent_days} days (${startDate} to ${endDate})`);
                    }}
                    className="px-1.5 py-0.5 text-3xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded cursor-pointer"
                    title="Auto-fill absent deduction"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              min="0"
              value={deductions}
              onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs font-mono text-[var(--text-main)] focus:outline-hidden"
              placeholder="0"
            />
          </div>

          {deductions > 0 && (
            <div className="space-y-1">
              <label className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">
                {t.hisab_labelDeductionReason}
              </label>
              <input
                type="text"
                placeholder="e.g. Broken Needle Penalty, Cloth Damage"
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
                className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-hidden"
              />
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: Full Computed Breakdown & Salary Disbursal Preview */
        computedHisab && (
          <div className="space-y-3.5">
            {/* Header info badge */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Karigar Beneficiary</span>
                <span className="font-bold text-xs text-[var(--text-main)]">{computedHisab.karigar_name}</span>
                <span className="text-[var(--text-muted)] font-mono text-2xs ml-1.5">({computedHisab.wage_type === 'PIECE_RATE' ? 'Piece-Rate' : 'Fixed Monthly'})</span>
              </div>
              <div className="text-right">
                <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Fortnight Period</span>
                <span className="font-mono text-[var(--text-main)] text-2xs font-semibold">{computedHisab.startDate} to {computedHisab.endDate}</span>
              </div>
            </div>

            {/* Financial Summary Bento Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] p-2.5 rounded-lg">
                <span className="text-[0.625rem] uppercase font-semibold text-[var(--text-muted)] block">1. Gross Earnings</span>
                <span className="text-sm font-bold font-mono tabular-nums text-[var(--text-main)] mt-0.5 block">
                  {formatINR(computedHisab.gross_earnings)}
                </span>
                <span className="text-3xs text-[var(--text-muted)] mt-0.5 block truncate">
                  {computedHisab.total_shifts} shifts • {formatNumber(computedHisab.total_meters)}m
                </span>
              </div>

              <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 p-2.5 rounded-lg">
                <span className="text-[0.625rem] uppercase font-semibold text-rose-700 dark:text-rose-400 block">2. Uchapat Advances</span>
                <span className="text-sm font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
                  - {formatINR(computedHisab.total_uchapat_advances)}
                </span>
                <span className="text-3xs text-[var(--text-muted)] mt-0.5 block truncate">
                  {computedHisab.uchapats?.length || 0} advances
                </span>
              </div>

              <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 p-2.5 rounded-lg">
                <span className="text-[0.625rem] uppercase font-semibold text-amber-700 dark:text-amber-400 block">3. Deductions</span>
                <span className="text-sm font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 block">
                  - {formatINR(computedHisab.deductions)}
                </span>
                <span className="text-3xs text-[var(--text-muted)] mt-0.5 block truncate" title={computedHisab.deduction_reason || 'None'}>
                  {computedHisab.deduction_reason || 'None'}
                </span>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-lg">
                <span className="text-[0.625rem] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Net Salary Payable
                </span>
                <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                  {formatINR(computedHisab.net_payable)}
                </span>
                <span className="text-3xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 block">
                  Disbursable amount
                </span>
              </div>
            </div>

            {/* Attendance note if monthly */}
            {computedHisab.attendance && (
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md px-3 py-2 text-2xs flex items-center justify-between text-[var(--text-muted)]">
                <span>Attendance Log: <strong className="text-[var(--text-main)]">{computedHisab.attendance.attended_days} days attended</strong> / {computedHisab.attendance.total_period_days} period days</span>
                {computedHisab.attendance.absent_days > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">({computedHisab.attendance.absent_days}d absent)</span>
                )}
              </div>
            )}

            {/* Collapsible Shift Breakdown */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface)]">
              <button
                type="button"
                onClick={() => setShowShiftsTable(!showShiftsTable)}
                className="w-full px-3 py-2 bg-[var(--bg-surface-elevated)] flex items-center justify-between text-xs font-semibold text-[var(--text-main)] cursor-pointer"
              >
                <span>Production Breakdown ({computedHisab.shifts?.length || 0} shifts logged)</span>
                {showShiftsTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showShiftsTable && (
                <div className="max-h-52 overflow-y-auto border-t border-[var(--border)]">
                  <table className="w-full text-2xs">
                    <thead className="bg-[var(--bg-surface-elevated)] text-[0.625rem] uppercase font-semibold text-[var(--text-muted)] sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1.5 text-left">Date</th>
                        <th className="px-2 py-1.5 text-left">Machine</th>
                        <th className="px-2 py-1.5 text-left">Shift</th>
                        <th className="px-2 py-1.5 text-right">Meters</th>
                        <th className="px-2 py-1.5 text-right">Stitches</th>
                        <th className="px-2.5 py-1.5 text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-mono">
                      {computedHisab.shifts && computedHisab.shifts.length > 0 ? (
                        computedHisab.shifts.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-[var(--bg-surface-elevated)]/50">
                            <td className="px-2.5 py-1.5 text-[var(--text-muted)]">{s.shift_date}</td>
                            <td className="px-2 py-1.5 font-sans text-[var(--text-main)] font-medium">#{s.machine_no}</td>
                            <td className="px-2 py-1.5 text-[var(--text-muted)]">{s.shift_type}</td>
                            <td className="px-2 py-1.5 text-right text-[var(--text-main)]">{formatNumber(s.total_meters)}m</td>
                            <td className="px-2 py-1.5 text-right text-[var(--text-muted)]">{formatNumber(s.total_stitches)}</td>
                            <td className="px-2.5 py-1.5 text-right font-bold text-[var(--text-main)]">{formatINR(s.shift_earnings || 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-[var(--text-muted)] font-sans">No shifts recorded for this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Collapsible Uchapat Breakdown */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface)]">
              <button
                type="button"
                onClick={() => setShowUchapatsTable(!showUchapatsTable)}
                className="w-full px-3 py-2 bg-[var(--bg-surface-elevated)] flex items-center justify-between text-xs font-semibold text-[var(--text-main)] cursor-pointer"
              >
                <span>Recovered Advances ({computedHisab.uchapats?.length || 0} advances totaling {formatINR(computedHisab.total_uchapat_advances)})</span>
                {showUchapatsTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showUchapatsTable && (
                <div className="max-h-40 overflow-y-auto border-t border-[var(--border)]">
                  <table className="w-full text-2xs">
                    <thead className="bg-[var(--bg-surface-elevated)] text-[0.625rem] uppercase font-semibold text-[var(--text-muted)] sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1.5 text-left">Date</th>
                        <th className="px-2 py-1.5 text-left">Reason</th>
                        <th className="px-2 py-1.5 text-left">Mode</th>
                        <th className="px-2.5 py-1.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-mono">
                      {computedHisab.uchapats && computedHisab.uchapats.length > 0 ? (
                        computedHisab.uchapats.map((u, idx) => (
                          <tr key={u.id || idx} className="hover:bg-[var(--bg-surface-elevated)]/50">
                            <td className="px-2.5 py-1.5 text-[var(--text-muted)]">{u.date}</td>
                            <td className="px-2 py-1.5 font-sans text-[var(--text-main)]">{u.reason || 'Karigar Advance'}</td>
                            <td className="px-2 py-1.5 text-[var(--text-muted)]">{u.payment_mode || 'CASH'}</td>
                            <td className="px-2.5 py-1.5 text-right font-bold text-rose-600 dark:text-rose-400">{formatINR(u.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-[var(--text-muted)] font-sans">Zero uchapat advances in this period</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Settlement & Salary Disbursal Controls */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-main)]">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Salary Disbursal & Voucher Recording</span>
              </div>
              <p className="text-2xs text-[var(--text-muted)]">
                Settling will mark all included advances settled and record an <strong>Indirect Salary Expense</strong> for {formatINR(computedHisab.net_payable)}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div>
                  <label className="block text-[0.625rem] font-semibold uppercase text-[var(--text-muted)] mb-1 tracking-wider">
                    Payment Mode
                  </label>
                  <select
                    value={settlePaymentMode}
                    onChange={(e) => setSettlePaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs font-semibold text-[var(--text-main)] focus:outline-hidden"
                  >
                    <option value="CASH">Cash Counter</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.625rem] font-semibold uppercase text-[var(--text-muted)] mb-1 tracking-wider">
                    Voucher Note / Remarks
                  </label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="e.g. Fortnight wage paid in cash"
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </Drawer>
  );
};
