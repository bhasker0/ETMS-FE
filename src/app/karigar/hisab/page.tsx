'use client';

import React, { useState, useEffect } from 'react';
import { WageHisabApi, WageHisabCalculationResult } from '@/lib/api/wage-hisab';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  Calculator,
  Download,
  CheckCircle2,
  Plus,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WageHisabPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-15');
  const [deductions, setDeductions] = useState(0);
  const [deductionReason, setDeductionReason] = useState('');

  const [calculationResult, setCalculationResult] = useState<WageHisabCalculationResult | null>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const fetchKarigars = async () => {
      try {
        const list = await KarigarsApi.getAll();
        setKarigars(list);
        if (list.length > 0) {
          setSelectedKarigarId(list[0].id);
        }
      } catch (e) {
        console.warn('Hisab fetch karigars error:', e);
      }
    };
    fetchKarigars();
  }, [activeCompany?.id]);

  const handleOpenComputeDrawer = () => {
    openDrawer(
      'COMPUTE_HISAB',
      { karigarId: selectedKarigarId, startDate, endDate },
      (result) => {
        if (result) {
          setCalculationResult(result);
          setSelectedKarigarId(result.karigar_id);
          setStartDate(result.startDate);
          setEndDate(result.endDate);
          setDeductions(result.deductions || 0);
          setDeductionReason(result.deduction_reason || '');
        }
      }
    );
  };

  const handleSettle = async () => {
    if (!calculationResult) return;
    if (!confirm(`Finalize and settle hisab of ${formatINR(calculationResult.net_payable)} for ${calculationResult.karigar_name}? This will mark all advances as settled.`)) return;

    setSettling(true);
    try {
      await WageHisabApi.settle({
        karigar_id: calculationResult.karigar_id,
        startDate: calculationResult.startDate,
        endDate: calculationResult.endDate,
        gross_earnings: calculationResult.gross_earnings,
        total_uchapat_advances: calculationResult.total_uchapat_advances,
        deductions: Number(calculationResult.deductions || deductions),
        deduction_reason: calculationResult.deduction_reason || deductionReason,
        net_payable: calculationResult.net_payable,
      });
      toast.success('[SETTLED] Wage Hisab finalized & advances marked settled');
      const updated = await WageHisabApi.calculate({
        karigar_id: calculationResult.karigar_id,
        startDate: calculationResult.startDate,
        endDate: calculationResult.endDate,
      });
      setCalculationResult(updated);
    } catch (err: any) {
      toast.error('Settlement failed: ' + err.message);
    } finally {
      setSettling(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!calculationResult) return;
    try {
      await WageHisabApi.downloadPdf(
        {
          karigar_id: calculationResult.karigar_id,
          startDate: calculationResult.startDate,
          endDate: calculationResult.endDate,
          deductions: Number(calculationResult.deductions || deductions),
          deduction_reason: calculationResult.deduction_reason || deductionReason,
        },
        calculationResult.karigar_name
      );
      toast.success('Downloaded official payslip PDF');
    } catch (err: any) {
      toast.error('PDF download error: ' + err.message);
    }
  };

  const handleWhatsAppDispatch = () => {
    if (!calculationResult) return;
    const msg =
      `*${activeCompany?.name || 'Embroidery Factory'} - પાક્ષિક પગાર હિસાબ સ્લિપ*\n\n` +
      `👤 *કારીગર:* ${calculationResult.karigar_name}\n` +
      `📅 *સમયગાળો:* ${calculationResult.startDate} થી ${calculationResult.endDate}\n` +
      `🧵 *કુલ ઉત્પાદન:* ${calculationResult.total_meters} મીટર (${calculationResult.total_shifts} શિફ્ટ)\n` +
      `💰 *કુલ મજૂરી:* ₹${Number(calculationResult.gross_earnings || 0).toFixed(2)}\n` +
      `🔻 *બાદ ઉપાડ (Uchapat):* -₹${Number(calculationResult.total_uchapat_advances || 0).toFixed(2)}\n` +
      (calculationResult.deductions > 0
        ? `🔻 *અન્ય કપાત:* -₹${Number(calculationResult.deductions || 0).toFixed(2)}\n`
        : '') +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💵 *ચૂકવવાપાત્ર ચોખ્ખી રકમ:* *₹${Number(calculationResult.net_payable || 0).toFixed(2)}*\n\n` +
      `સુરત એમ્બ્રોઇડરી મેનેજમેન્ટ સિસ્ટમ (ETMS)`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success(`Prepared WhatsApp payslip slip for ${calculationResult.karigar_name}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Calculator className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Fortnightly Payroll • Piece-Rate Settlement</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Fortnight Hisab & Wage Ledger
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Automated piece-rate calculation, Uchapat deductions, and Swiss payslip generation
            </p>
          </div>

          <button
            onClick={handleOpenComputeDrawer}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Compute Hisab Period</span>
          </button>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Registered Operators
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {karigars.length} <span className="text-xs font-normal text-[var(--text-muted)]">Karigars</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Settlement Cadence
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              Fortnight <span className="text-xs font-normal text-[var(--text-muted)]">(15-Day Cycle)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {calculationResult ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-3">
              <div>
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Calculated Payslip</span>
                <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                  {calculationResult.karigar_name}
                </h2>
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  Period: {calculationResult.startDate} → {calculationResult.endDate} • {calculationResult.total_shifts} shifts logged
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenComputeDrawer}
                  className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium rounded-md transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recompute</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium rounded-md transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Payslip</span>
                </button>

                <button
                  onClick={handleWhatsAppDispatch}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs font-medium rounded-md transition cursor-pointer flex items-center gap-1.5"
                  title="Send WhatsApp Slip"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="px-3.5 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center gap-1.5 shadow-sm rounded-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Commit & Settle</span>
                </button>
              </div>
            </div>

            {/* Wage Model & Telemetry Bar */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[var(--text-muted)] font-semibold uppercase text-[0.6875rem]">Wage Model</span>
                <div className="font-bold text-[var(--text-main)] text-sm">
                  {calculationResult.wage_type.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[var(--bg-surface)] px-4 py-2 rounded-lg border border-[var(--border)] shrink-0">
                <div className="text-center">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold">Meters</div>
                  <div className="font-mono font-bold text-[var(--text-main)] tabular-nums">{formatNumber(calculationResult.total_meters)} m</div>
                </div>
                <div className="w-px h-6 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold">Stitches</div>
                  <div className="font-mono font-bold text-[var(--text-main)] tabular-nums">{formatNumber(calculationResult.total_stitches || 0)}</div>
                </div>
                <div className="w-px h-6 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold">Shifts</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{calculationResult.total_shifts}</div>
                </div>
              </div>
            </div>

            {/* Wage Calculation Matrix */}
            <div className="border border-[var(--border)] rounded-xl overflow-hidden text-xs shadow-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-[var(--border)] font-sans">
                  <tr className="hover:bg-[var(--bg-surface-elevated)]/50">
                    <td className="p-3.5 text-[var(--text-muted)] font-medium">Production Metric</td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[var(--text-main)] tabular-nums">
                      {formatNumber(calculationResult.total_meters)} Meters ({formatNumber(calculationResult.total_stitches || 0)} stitches)
                    </td>
                  </tr>

                  {calculationResult.base_salary !== undefined && calculationResult.base_salary > 0 && (
                    <tr className="hover:bg-[var(--bg-surface-elevated)]/50">
                      <td className="p-3.5 text-[var(--text-muted)] font-medium">Base Monthly Salary</td>
                      <td className="p-3.5 text-right font-mono text-[var(--text-main)] font-semibold tabular-nums">
                        {formatINR(calculationResult.base_salary)}
                      </td>
                    </tr>
                  )}

                  {calculationResult.incentive_commission !== undefined && calculationResult.incentive_commission > 0 && (
                    <tr className="hover:bg-[var(--bg-surface-elevated)]/50">
                      <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-medium">Incentive Commission Bonus</td>
                      <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        + {formatINR(calculationResult.incentive_commission)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-[var(--bg-surface-elevated)]/60 font-semibold">
                    <td className="p-3.5 text-[var(--text-main)]">Gross Production Earnings</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)] text-sm tabular-nums">
                      {formatINR(calculationResult.gross_earnings)}
                    </td>
                  </tr>

                  <tr className="bg-rose-50/50 dark:bg-rose-950/20">
                    <td className="p-3.5 text-rose-800 dark:text-rose-300 font-medium">
                      Deduction: Uchapat Advance Cash
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700 dark:text-rose-400 text-sm tabular-nums">
                      - {formatINR(calculationResult.total_uchapat_advances)}
                    </td>
                  </tr>

                  {calculationResult.deductions > 0 && (
                    <tr className="bg-rose-50/30 dark:bg-rose-950/10">
                      <td className="p-3.5 text-rose-800 dark:text-rose-300 font-medium">
                        Other Deduction ({calculationResult.deduction_reason || 'Misc'})
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                        - {formatINR(calculationResult.deductions)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-[var(--text-main)] text-[var(--bg-surface)] font-bold">
                    <td className="p-4 text-xs uppercase tracking-wide">
                      Net Payable Cash Disbursement
                    </td>
                    <td className="p-4 text-right font-mono text-lg font-bold tabular-nums">
                      {formatINR(calculationResult.net_payable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Shift & Design Breakdown */}
            {calculationResult.shifts && calculationResult.shifts.length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden text-xs shadow-xs space-y-2">
                <div className="px-4 py-3 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] font-bold text-[var(--text-main)] flex items-center justify-between">
                  <span>Shift Specification Breakdown</span>
                  <span className="text-[0.6875rem] font-mono text-[var(--text-muted)] font-normal">{calculationResult.shifts.length} Shifts</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Shift & Machine</th>
                        <th className="p-3">Design</th>
                        <th className="p-3 text-right">Stitches</th>
                        <th className="p-3 text-right">Meters</th>
                        <th className="p-3 text-right">Applied Basis</th>
                        <th className="p-3 text-right">Wage Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {calculationResult.shifts.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                          <td className="p-3 font-mono font-medium text-[var(--text-main)]">{s.shift_date}</td>
                          <td className="p-3 text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text-main)]">{s.shift_type}</span> • {s.machine_no}
                          </td>
                          <td className="p-3">
                            <span className="badge-pastel-blue px-2 py-0.5 rounded text-[0.6875rem] font-mono font-semibold">
                              {s.design_no || 'Standard'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums text-[var(--text-main)]">{formatNumber(s.total_stitches)}</td>
                          <td className="p-3 text-right font-mono font-semibold text-[var(--text-main)] tabular-nums">{formatNumber(s.total_meters)} m</td>
                          <td className="p-3 text-right text-[var(--text-muted)] text-[0.6875rem]">
                            {s.applied_basis || 'Default Rate'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatINR(s.shift_earnings || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-xl p-12 text-center text-[var(--text-muted)] space-y-3">
            <Calculator className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <div className="text-sm font-bold text-[var(--text-main)]">
              No Hisab Calculation Loaded
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Select an operator and trigger fortnightly compute to audit piece-rates and Uchapat advances
            </p>
            <button
              onClick={handleOpenComputeDrawer}
              className="px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs inline-flex items-center gap-1.5 transition rounded-md shadow-sm mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Compute Hisab Period</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

