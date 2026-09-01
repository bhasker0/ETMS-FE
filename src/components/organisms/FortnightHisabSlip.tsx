'use client';

import React from 'react';
import { FortnightHisab, Karigar } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
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
  const { t } = useI18n();

  const currentCompany = {
    name: activeCompany?.name || 'Company Name',
    address: activeCompany?.address || '',
  };

  return (
    <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl border-2 border-slate-300 max-w-2xl mx-auto space-y-4 print:shadow-none print:border-none print:p-2 print-nums ledger-nums">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {currentCompany.name.split('(')[0]}
          </h2>
          <p className="text-xs text-slate-600">{currentCompany.address}</p>
          <div className="inline-block bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded mt-1">
            {t.slip_voucherTitle}
          </div>
        </div>

        <div className="text-right text-xs space-y-0.5 font-mono">
          <div className="font-bold text-slate-800">{t.slip_hisabNo} {hisab.id}</div>
          <div className="text-slate-600">
            {t.slip_period} <strong>{hisab.periodStart}</strong> {t.slip_to} <strong>{hisab.periodEnd}</strong>
          </div>
        </div>
      </div>

      {/* Karigar Bio Card */}
      <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-200 text-slate-900 rounded-full flex items-center justify-center text-lg font-bold">
            {karigar.avatar || '👨‍🔧'}
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900">{karigar.name}</div>
            <div className="text-slate-600 font-mono">Ph: {karigar.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-2xs">{t.slip_shiftsWorked}</span>
          <span className="font-bold text-sm text-slate-900">
            {hisab.totalShifts} {t.shift_shifts} ({hisab.dayShifts} {t.slip_dayShift} / {hisab.nightShifts} {t.slip_nightShift})
          </span>
        </div>
      </div>

      {/* Production & Wage Breakdown Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-white font-bold">
            <tr>
              <th className="p-2.5">{t.slip_thParticulars}</th>
              <th className="p-2.5 text-right">{t.slip_thAmount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="p-2.5 font-medium text-slate-700">{t.hisab_stitchesCount}</td>
              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                {formatNumber(hisab.totalStitches)}
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-medium text-slate-700">{t.hisab_metersCount}</td>
              <td className="p-2.5 text-right font-mono text-slate-900">
                {formatNumber(hisab.totalMeters)} MTR
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-medium text-slate-700">{t.slip_ratePerThousand}</td>
              <td className="p-2.5 text-right font-mono text-slate-900">
                ₹{Number(karigar.ratePerThousand || 0).toFixed(2)}
              </td>
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td className="p-2.5 text-slate-900">{t.hisab_grossEarnings}</td>
              <td className="p-2.5 text-right font-mono text-slate-900 text-sm">
                {formatINR(hisab.grossEarnings)}
              </td>
            </tr>
            <tr className="text-red-700 bg-red-50/50">
              <td className="p-2.5 font-bold">{t.hisab_totalUchapatDeductions}</td>
              <td className="p-2.5 text-right font-mono font-bold text-sm">
                - {formatINR(hisab.totalAdvanceDeducted)}
              </td>
            </tr>
            <tr className="bg-emerald-100 text-emerald-950 font-black text-sm">
              <td className="p-3">{t.hisab_netPayable} (₹)</td>
              <td className="p-3 text-right font-mono text-base text-emerald-900">
                {formatINR(hisab.netPayable)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Box */}
      <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-700">
        <div className="border-t-2 border-slate-400 pt-2 text-center">
          <span className="font-bold block">{t.slip_signatureKarigar}</span>
          <span className="text-2xs text-slate-500">{t.slip_signatureReceipt}</span>
        </div>
        <div className="border-t-2 border-slate-400 pt-2 text-center">
          <span className="font-bold block">{t.slip_signatureManager}</span>
          <span className="text-2xs text-slate-500">For {currentCompany.name.split('(')[0]}</span>
        </div>
      </div>

      {/* Actions (Hidden on Print) */}
      <div className="pt-2 flex justify-end gap-2 print:hidden">
        {onShareWhatsApp && (
          <button
            onClick={onShareWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Share2 className="w-4 h-4" />
            {t.slip_btnWhatsApp}
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            {t.slip_btnPrint}
          </button>
        )}
      </div>
    </div>
  );
};

