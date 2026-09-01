'use client';

import React from 'react';
import { FortnightHisab, Karigar } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { formatINR, formatNumber } from '@/lib/utils';
import { Printer, Share2 } from 'lucide-react';

interface FortnightHisabProps {
  hisab: FortnightHisab;
  karigar: Karigar;
  onPrint?: () => void;
  onShareWhatsApp?: () => void;
}

export const FortnightHisabSlip: React.FC<FortnightHisabProps> = ({
  hisab,
  karigar,
  onPrint,
  onShareWhatsApp,
}) => {
  const { activeCompany } = useAuth();

  const currentCompany = {
    name: activeCompany?.name || 'SURAT EMBROIDERY INDUSTRIAL UNIT',
    address: activeCompany?.address || 'PLOT 14-B, GIDC INDUSTRIAL ESTATE, SURAT - 395008',
  };

  return (
    <div
      className="bg-[#FAFAF9] text-[#1C1917] p-6 sm:p-8 border border-[#E7E5E4] rounded-2xl max-w-2xl mx-auto space-y-5 font-sans shadow-md print:shadow-none print:border-black print:p-4 print:max-w-none print:w-full print:rounded-none"
    >
      {/* Factory & Document Header */}
      <div className="border-b border-[#E7E5E4] pb-4 flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <span className="badge-pastel-green px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase tracking-wider inline-block mb-1.5">
            Fortnight Wage Settlement Voucher
          </span>
          <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
            {currentCompany.name.split('(')[0]}
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">{currentCompany.address}</p>
        </div>

        <div className="sm:text-right text-xs space-y-1 font-mono">
          <div className="font-bold text-[#1C1917]">Slip #{hisab.id}</div>
          <div className="text-[0.6875rem] text-[#78716C]">
            Period: <span className="font-semibold text-[#1C1917]">{hisab.periodStart}</span> to <span className="font-semibold text-[#1C1917]">{hisab.periodEnd}</span>
          </div>
          <div className="text-[0.6875rem] text-[#A8A29E]">
            Issued: {new Date().toISOString().split('T')[0]}
          </div>
        </div>
      </div>

      {/* Karigar Specimen */}
      <div className="bg-[#F5F5F4] p-4 rounded-xl border border-[#E7E5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[0.6875rem] text-[#78716C] uppercase font-semibold block">Operating Karigar</span>
          <div className="font-bold text-base text-[#1C1917]">{karigar.name}</div>
          <div className="text-xs text-[#78716C] font-mono mt-0.5">Phone: {karigar.phone} • ID: {karigar.id}</div>
        </div>
        <div className="sm:text-right font-mono">
          <span className="text-[0.6875rem] text-[#78716C] uppercase font-semibold block">Shifts Logged</span>
          <span className="font-bold text-sm text-[#1C1917]">
            {hisab.totalShifts} Shifts ({hisab.dayShifts} Day / {hisab.nightShifts} Night)
          </span>
        </div>
      </div>

      {/* Accounting Breakdown Matrix */}
      <div className="border border-[#E7E5E4] rounded-xl overflow-hidden text-xs shadow-xs">
        <table className="w-full text-left">
          <thead className="bg-[#F5F5F4] text-[#78716C] font-semibold border-b border-[#E7E5E4] uppercase text-[0.6875rem]">
            <tr>
              <th className="p-3">Accounting Particulars</th>
              <th className="p-3 text-right">Value / Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4] font-sans">
            <tr>
              <td className="p-3 font-medium text-[#1C1917]">Total Stitches Count</td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                {formatNumber(hisab.totalStitches)} Stitches
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-[#1C1917]">Total Fabric Meters</td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                {formatNumber(hisab.totalMeters)} m
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-[#1C1917]">Piece-Rate (per 1k Stitches / Meter)</td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                ₹{Number(karigar.ratePerThousand || 0).toFixed(2)}
              </td>
            </tr>
            <tr className="bg-[#F5F5F4]/70 font-semibold">
              <td className="p-3 text-[#1C1917]">Gross Wage Earnings</td>
              <td className="p-3 text-right font-mono text-[#1C1917] text-sm font-bold tabular-nums">
                {formatINR(hisab.grossEarnings)}
              </td>
            </tr>
            <tr className="bg-rose-50/70 dark:bg-rose-950/20 text-[#1C1917]">
              <td className="p-3 font-semibold text-rose-800">Deduction: Uchapat Cash Advances</td>
              <td className="p-3 text-right font-mono font-bold text-sm text-rose-700 tabular-nums">
                - {formatINR(hisab.totalAdvanceDeducted)}
              </td>
            </tr>
            <tr className="bg-[#1C1917] text-white font-bold text-sm">
              <td className="p-3.5 uppercase tracking-wide">Net Payable Disbursement</td>
              <td className="p-3.5 text-right font-mono text-base font-bold text-white tabular-nums">
                {formatINR(hisab.netPayable)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dual Signature & Timestamp Strip */}
      <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-[#1C1917]">
        <div className="border-t border-[#D6D3D1] pt-2 text-center">
          <span className="font-semibold block uppercase text-[0.6875rem]">Karigar Signature / Thumb</span>
          <span className="text-[0.6875rem] text-[#78716C]">Acknowledged & Received</span>
        </div>
        <div className="border-t border-[#D6D3D1] pt-2 text-center">
          <span className="font-semibold block uppercase text-[0.6875rem]">Factory Manager Signature</span>
          <span className="text-[0.6875rem] text-[#78716C]">For {currentCompany.name.split('(')[0]}</span>
        </div>
      </div>

      {/* Actions (Hidden on Thermal/A4 Print) */}
      <div className="pt-3 flex justify-end gap-2.5 print:hidden">
        {onShareWhatsApp && (
          <button
            onClick={onShareWhatsApp}
            className="px-4 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] font-semibold text-xs flex items-center gap-1.5 cursor-pointer rounded-lg transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Share WhatsApp</span>
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center gap-1.5 cursor-pointer rounded-lg transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Hisab Slip</span>
          </button>
        )}
      </div>
    </div>
  );
};


