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
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-15');
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
              <span>{t.generateFortnightHisab || 'Karigar Fortnightly Wage Settlement'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.settleHisab || 'Wage Hisab & Settlement'}
            </h1>
            <p className="text-xs text-slate-500">
              Formula: Net Pay = (Shift Output × Rate) − Uchapat Advances − Deductions
            </p>
          </div>

          <button
            onClick={handleOpenComputeDrawer}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t.computeHisab || 'Compute Hisab'}</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Calculator className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Karigars: <strong className="font-bold text-slate-900">{karigars.length}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span>{t.customFortnight || 'Settlement Cycle: 15-Day Fortnight'}</span>
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
                  Period: {calculationResult.startDate} to {calculationResult.endDate} • {calculationResult.total_shifts} Shifts
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenComputeDrawer}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Calculator className="w-3.5 h-3.5 text-slate-500" />
                  <span>Re-Calculate</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handleWhatsAppDispatch}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  title="Send Fortnightly Pay Slip to Karigar on WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Slip</span>
                </button>

                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finalize & Settle</span>
                </button>
              </div>
            </div>

            {/* Wage Calculation Summary Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-600 font-medium">Total Production Output</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      {formatNumber(calculationResult.total_meters)} meters
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-600 font-medium">Applied Rate / Salary Unit</td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      ₹{calculationResult.rate_per_meter} / meter
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80 font-semibold">
                    <td className="p-3 text-slate-900">Gross Wages Earned (કુલ મજૂરી)</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(calculationResult.gross_earnings)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3 text-rose-600 font-medium">
                      Less: Total Uchapat Advances (બાદ: ઉપાડ)
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 text-sm">
                      - {formatINR(calculationResult.total_uchapat_advances)}
                    </td>
                  </tr>
                  {calculationResult.deductions > 0 && (
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 text-slate-600 font-medium">
                        Less: Deductions ({calculationResult.deduction_reason || 'Damage/Penalty'})
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        - {formatINR(calculationResult.deductions)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                    <td className="p-4 text-xs text-slate-900 uppercase">
                      NET PAYABLE AMOUNT (ચૂકવવાપાત્ર ચોખ્ખો પગાર ₹)
                    </td>
                    <td className="p-4 text-right font-mono text-base text-slate-900 font-black">
                      {formatINR(calculationResult.net_payable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 space-y-3">
            <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-medium text-slate-600">
              No active settlement calculated yet.
            </div>
            <p className="text-2xs text-slate-400 max-w-sm mx-auto">
              Aggregates shift logs, deducts active cash advances, and calculates net payable wages for 15-day fortnight.
            </p>
            <button
              onClick={handleOpenComputeDrawer}
              className="px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5 transition shadow-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Compute Wage Settlement (નવો હિસાબ)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
