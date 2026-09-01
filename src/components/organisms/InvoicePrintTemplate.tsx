'use client';

import React from 'react';
import { InvoiceSAC9988 } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { formatINR, formatNumber } from '@/lib/utils';
import { QrCode } from 'lucide-react';

interface InvoicePrintProps {
  invoice: InvoiceSAC9988;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintProps> = ({ invoice }) => {
  const { activeCompany } = useAuth();
  const { t } = useI18n();

  const currentCompany = {
    name: activeCompany?.name || 'Company Name',
    gstin: activeCompany?.gstin || '',
    address: activeCompany?.address || '',
    phone: activeCompany?.phone || '',
    upiVpa: activeCompany?.upiVpa || '',
  };

  return (
    <div className="bg-white text-slate-900 p-8 max-w-4xl mx-auto rounded-xl shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:max-w-none text-sm leading-relaxed font-sans print-nums ledger-nums">
      {/* Print Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
        <div className="space-y-1 max-w-lg">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentCompany.name}
          </h1>
          <p className="text-xs text-slate-600 font-medium">{currentCompany.address}</p>
          <div className="text-xs font-bold text-slate-800 space-x-3">
            <span>GSTIN: <strong className="font-mono">{currentCompany.gstin}</strong></span>
            <span>•</span>
            <span>Ph: {currentCompany.phone}</span>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="inline-block bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded uppercase tracking-wider">
            {t.print_taxInvoice}
          </div>
          <div className="text-lg font-black text-slate-900 font-mono">
            {invoice.invoiceNumber}
          </div>
          <div className="text-xs text-slate-600">
            {t.print_date} <strong>{invoice.invoiceDate}</strong>
          </div>
        </div>
      </div>

      {/* Bill To & Supply Details */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {t.print_billedTo}
          </span>
          <div className="font-bold text-sm text-slate-900">{invoice.traderName}</div>
          <div className="text-slate-600">{invoice.traderAddress}</div>
          <div className="mt-1 font-mono font-bold text-slate-800">
            GSTIN: {invoice.traderGstin}
          </div>
          <div className="text-slate-600">Ph: {invoice.traderMobile}</div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">{t.print_sacCodeLabel}</span>
            <span className="font-bold font-mono text-slate-900">9988</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.print_lotNo}</span>
            <span className="font-bold text-slate-900">{invoice.lotNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.print_fabric}</span>
            <span className="font-bold text-slate-900">{invoice.fabricQuality}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.print_takas}</span>
            <span className="font-bold text-slate-900">{invoice.numberOfTakas} {t.print_thansUnit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.print_meters}</span>
            <span className="font-bold text-slate-900">{formatNumber(invoice.meters)} MTR</span>
          </div>
        </div>
      </div>

      {/* Calculation Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
              <th className="p-2 border-r border-slate-300">{t.print_thDescription}</th>
              <th className="p-2 border-r border-slate-300 text-right">{t.print_thStitches}</th>
              <th className="p-2 border-r border-slate-300 text-right">{t.print_thHeads}</th>
              <th className="p-2 border-r border-slate-300 text-right">{t.print_thRate}</th>
              <th className="p-2 text-right">{t.print_thTaxableValue}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2.5 border-r border-slate-300">
                <div className="font-bold text-slate-900">
                  {t.print_embroideryProcessing}
                </div>
                <div className="text-slate-500 text-2xs">
                  {invoice.fabricQuality} {t.print_designWorkOn} ({invoice.lotNumber})
                </div>
              </td>
              <td className="p-2.5 border-r border-slate-300 text-right font-mono font-bold">
                {formatNumber(invoice.totalStitches)}
              </td>
              <td className="p-2.5 border-r border-slate-300 text-right font-mono">
                {invoice.headCount}
              </td>
              <td className="p-2.5 border-r border-slate-300 text-right font-mono">
                ₹{invoice.ratePerThousand.toFixed(2)}
              </td>
              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                {formatINR(invoice.baseAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax Summary & Totals */}
      <div className="grid grid-cols-2 gap-4 mb-4 items-start">
        {/* UPI QR & Bank details */}
        <div className="border border-slate-200 p-3 rounded-lg flex items-center gap-3">
          <div className="w-20 h-20 bg-slate-900 rounded p-1 flex items-center justify-center text-white shrink-0">
            <QrCode className="w-16 h-16 text-amber-400" />
          </div>
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">{t.print_upiPayInstant}</span>
            <span className="text-2xs text-slate-600 block">Google Pay / PhonePe / Paytm</span>
            <span className="font-mono text-2xs font-bold text-slate-800">
              {currentCompany.upiVpa ? `VPA: ${currentCompany.upiVpa}` : 'UPI not configured'}
            </span>
            <span className="text-2xs text-emerald-700 font-bold block">
              {t.print_scanAndPay} ₹{invoice.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* GST Breakup */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-700">
            <span>{t.print_taxableAmount}</span>
            <span>{formatINR(invoice.baseAmount)}</span>
          </div>
          {invoice.cgstAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>CGST @ 2.5%:</span>
              <span>{formatINR(invoice.cgstAmount)}</span>
            </div>
          )}
          {invoice.sgstAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>SGST @ 2.5%:</span>
              <span>{formatINR(invoice.sgstAmount)}</span>
            </div>
          )}
          {invoice.igstAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>IGST @ 5.0%:</span>
              <span>{formatINR(invoice.igstAmount)}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between font-black text-sm text-slate-900 font-sans">
            <span>{t.print_grandTotal}</span>
            <span className="text-base text-amber-900 font-mono">
              {formatINR(invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Signatures */}
      <div className="border-t border-slate-300 pt-3 flex justify-between items-end text-2xs text-slate-600">
        <div className="max-w-md space-y-1">
          <span className="font-bold text-slate-800 uppercase block">{t.print_termsAndConditions}</span>
          <p>{invoice.termsCondition}</p>
        </div>

        <div className="text-center space-y-8">
          <span className="font-bold text-slate-800 block">
            For, {currentCompany.name}
          </span>
          <span className="block border-t border-slate-400 pt-1 font-bold text-slate-900">
            {t.print_authorisedSignatory}
          </span>
        </div>
      </div>
    </div>
  );
};
