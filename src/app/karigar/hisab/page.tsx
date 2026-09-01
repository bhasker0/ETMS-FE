'use client';

import React, { useState, useEffect } from 'react';
import { WageHisabApi, WageHisabCalculationResult } from '@/lib/api/wage-hisab';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
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
  const { t } = useI18n();
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
      toast.success('Wage Hisab finalized & advances marked settled in database!');
      // Re-calculate to show updated balance
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.uchapat_btnFortnightHisab}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.settleHisab}
            </h1>
            <p className="text-xs text-slate-500">
              {t.hisab_formulaSubtitle}
            </p>
          </div>

          <button
            onClick={handleOpenComputeDrawer}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t.hisab_btnCompute}</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Calculator className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.navKarigars}: <strong className="font-bold text-slate-900">{karigars.length}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span>{t.customFortnight}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {calculationResult ? (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-3 gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {calculationResult.karigar_name}
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                  {t.slip_period} {calculationResult.startDate} {t.slip_to} {calculationResult.endDate} • {calculationResult.total_shifts} {t.shift_shifts}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenComputeDrawer}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Calculator className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.hisab_btnCompute}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.hisab_btnDownloadPdf}</span>
                </button>

                <button
                  onClick={handleWhatsAppDispatch}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  title="Send WhatsApp Slip"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.hisab_btnWhatsApp}</span>
                </button>

                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.hisab_btnSettle}</span>
                </button>
              </div>
            </div>

            {/* Wage Model & Calculation Basis Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-2xs">{t.karigar_labelWageStructure}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {calculationResult.wage_type === 'FIXED_PLUS_INCENTIVE'
                      ? t.karigar_typeFixedIncentive
                      : calculationResult.wage_type === 'FIXED_MONTHLY'
                      ? t.karigar_typeFixedMonthly
                      : t.karigar_typePieceRate}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-cyan-100 text-cyan-800">
                    {calculationResult.wage_type}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  {calculationResult.wage_type === 'FIXED_PLUS_INCENTIVE'
                    ? `${t.customFortnight}: ₹${formatNumber(calculationResult.base_salary || 0)} + ${t.karigar_labelIncentiveBonusRate}: ₹${formatNumber(calculationResult.incentive_commission || 0)}`
                    : calculationResult.wage_type === 'FIXED_MONTHLY'
                    ? `${t.karigar_labelMonthlySalary}: ₹${formatNumber((calculationResult.base_salary || 0) * 2)} / ${t.karigar_perMonth}`
                    : `${t.karigar_typePieceRate}`}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
                <div className="text-center">
                  <div className="text-2xs text-slate-500">{t.karigar_unitMeters}</div>
                  <div className="font-mono font-bold text-slate-900">{formatNumber(calculationResult.total_meters)} m</div>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xs text-slate-500">{t.hisab_stitchesCount}</div>
                  <div className="font-mono font-bold text-slate-900">{formatNumber(calculationResult.total_stitches || 0)}</div>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xs text-slate-500">{t.shift_shifts}</div>
                  <div className="font-mono font-bold text-slate-900">{calculationResult.total_shifts}</div>
                </div>
              </div>
            </div>

            {/* Wage Calculation Summary Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-600 font-medium">{t.hisab_metersCount}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      {formatNumber(calculationResult.total_meters)} {t.karigar_unitMeters} ({formatNumber(calculationResult.total_stitches || 0)} {t.karigar_unitStitches})
                    </td>
                  </tr>

                  {calculationResult.base_salary !== undefined && calculationResult.base_salary > 0 && (
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-600 font-medium">{t.karigar_labelMonthlySalary}</td>
                      <td className="p-3 text-right font-mono text-slate-900 font-semibold">
                        {formatINR(calculationResult.base_salary)}
                      </td>
                    </tr>
                  )}

                  {calculationResult.incentive_commission !== undefined && calculationResult.incentive_commission > 0 && (
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 text-cyan-700 font-medium">{t.karigar_labelIncentiveBonusRate}</td>
                      <td className="p-3 text-right font-mono text-cyan-800 font-bold">
                        + {formatINR(calculationResult.incentive_commission)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-50/80 font-semibold">
                    <td className="p-3 text-slate-900">{t.hisab_grossEarnings}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(calculationResult.gross_earnings)}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 text-rose-600 font-medium">
                      {t.hisab_totalUchapatDeductions}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                      - {formatINR(calculationResult.total_uchapat_advances)}
                    </td>
                  </tr>

                  {calculationResult.deductions > 0 && (
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-600 font-medium">
                        {t.hisab_customDeductions} ({calculationResult.deduction_reason || '-'})
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        - {formatINR(calculationResult.deductions)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                    <td className="p-4 text-xs text-slate-900 uppercase">
                      {t.hisab_netPayable} (₹)
                    </td>
                    <td className="p-4 text-right font-mono text-base text-slate-900 font-black">
                      {formatINR(calculationResult.net_payable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Shift & Design Production Breakdown */}
            {calculationResult.shifts && calculationResult.shifts.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs space-y-2">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center justify-between">
                  <span>{t.shift_shiftRecords}</span>
                  <span className="text-2xs font-mono font-normal text-slate-500">{calculationResult.shifts.length} {t.shift_shifts}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">{t.uchapat_thDate}</th>
                        <th className="p-2.5">{t.shift_thShiftMachine}</th>
                        <th className="p-2.5">{t.shift_thDesign}</th>
                        <th className="p-2.5 text-right">{t.shift_thStitches}</th>
                        <th className="p-2.5 text-right">{t.shift_thMeters}</th>
                        <th className="p-2.5 text-right">{t.karigar_thRateSalary}</th>
                        <th className="p-2.5 text-right">{t.shift_thWageEarned}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {calculationResult.shifts.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-800 font-medium">{s.shift_date}</td>
                          <td className="p-2.5 text-slate-600">
                            <span className="font-sans font-semibold text-slate-800">{s.shift_type}</span> • {s.machine_no}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-[#0099B8] bg-cyan-50 px-2 py-0.5 rounded text-2xs border border-cyan-200">
                              {s.design_no || 'Standard'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-slate-700">{formatNumber(s.total_stitches)}</td>
                          <td className="p-2.5 text-right text-slate-900 font-semibold">{formatNumber(s.total_meters)} m</td>
                          <td className="p-2.5 text-right text-slate-600 text-2xs font-sans">
                            <div className="font-medium text-slate-800">{s.applied_basis || 'Default Rate'}</div>
                            {s.shift_base_salary !== undefined && s.shift_base_salary > 0 && (
                              <div className="text-3xs text-slate-400 font-mono">
                                Base: {formatINR(s.shift_base_salary)}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-right text-emerald-700 font-bold">
                            <div>{formatINR(s.shift_earnings || 0)}</div>
                            {s.shift_base_salary !== undefined && s.shift_base_salary > 0 && (
                              <div className="text-3xs text-slate-500 font-normal font-sans">
                                Total: {formatINR((s.shift_earnings || 0) + s.shift_base_salary)}
                              </div>
                            )}
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
          <div className="bg-slate-50/70 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 space-y-3">
            <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-medium text-slate-600">
              {t.hisab_noCalculationYet}
            </div>
            <p className="text-2xs text-slate-400 max-w-sm mx-auto">
              {t.hisab_formulaSubtitle}
            </p>
            <button
              onClick={handleOpenComputeDrawer}
              className="px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5 transition shadow-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ {t.hisab_btnCompute}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
