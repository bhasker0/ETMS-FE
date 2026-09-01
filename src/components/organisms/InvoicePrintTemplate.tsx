'use client';

import React from 'react';
import { InvoiceSAC9988 } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { formatINR, formatNumber } from '@/lib/utils';
import { QrCode } from 'lucide-react';

interface InvoicePrintProps {
  invoice: InvoiceSAC9988;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintProps> = ({ invoice }) => {
  const { activeCompany } = useAuth();

  const currentCompany = {
    name: activeCompany?.name || 'SURAT EMBROIDERY INDUSTRIAL UNIT',
    gstin: activeCompany?.gstin || '24AAACE0000A1Z5',
    address: activeCompany?.address || 'Plot 42-45, Sachin GIDC Industrial Area, Surat, Gujarat 394230',
    phone: activeCompany?.phone || '+91 98251 00000',
    upiVpa: activeCompany?.upiVpa || 'factoryops@upi',
  };

  return (
    <div
      className="max-w-4xl mx-auto p-6 sm:p-8 bg-[#FAFAF9] text-[#1C1917] border border-[#E7E5E4] rounded-2xl font-sans text-xs leading-normal print:border-none print:p-0 print:max-w-none print:rounded-none shadow-md print:shadow-none space-y-6"
    >
      {/* Factory & Document Type Header */}
      <div className="border-b border-[#E7E5E4] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <span className="badge-pastel-green px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase tracking-wider inline-block mb-1.5">
            Tax Invoice • SAC 9988
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            {currentCompany.name}
          </h1>
          <p className="text-xs text-[#78716C] max-w-md mt-0.5">{currentCompany.address}</p>
          <div className="text-xs space-x-3 mt-1.5 font-mono text-[#44403C]">
            <span>GSTIN: <strong className="text-[#1C1917]">{currentCompany.gstin}</strong></span>
            <span>•</span>
            <span>Phone: {currentCompany.phone}</span>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1 font-mono">
          <div className="text-base sm:text-lg font-bold text-[#1C1917]">
            Invoice #{invoice.invoiceNumber}
          </div>
          <div className="text-xs text-[#78716C]">
            Date: <strong className="text-[#1C1917]">{invoice.invoiceDate}</strong>
          </div>
          <div className="text-[0.6875rem] text-[#A8A29E]">
            Reverse Charge: No • Original for Recipient
          </div>
        </div>
      </div>

      {/* Bill To & Job Work Supply Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#E7E5E4] p-4 bg-[#F5F5F4] rounded-xl text-xs">
        <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-[#E7E5E4] pb-3 sm:pb-0 sm:pr-4">
          <span className="font-semibold text-[#78716C] uppercase tracking-wider block text-[0.6875rem]">
            Billed to Trader / Consignee
          </span>
          <div className="font-bold text-sm text-[#1C1917]">{invoice.traderName}</div>
          <div className="text-[#78716C]">{invoice.traderAddress || 'Surat Textile Market (Ring Road), Surat'}</div>
          <div className="text-xs pt-0.5 font-mono text-[#44403C]">
            GSTIN: <strong className="text-[#1C1917]">{invoice.traderGstin || 'Unregistered / Composition'}</strong>
          </div>
          <div className="text-[#78716C] font-mono">Contact: {invoice.traderMobile || '+91 98000 00000'}</div>
        </div>

        <div className="space-y-1.5 sm:pl-2">
          <span className="font-semibold text-[#78716C] uppercase tracking-wider block text-[0.6875rem]">
            Job Work Specifications
          </span>
          <div className="flex justify-between font-mono">
            <span className="text-[#78716C]">SAC Code:</span>
            <span className="font-semibold text-[#1C1917]">9988 (Textile Embroidery)</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#78716C]">Lot Number:</span>
            <span className="font-bold text-[#1C1917]">{invoice.lotNumber}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#78716C]">Fabric Quality:</span>
            <span className="font-semibold text-[#1C1917]">{invoice.fabricQuality}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#78716C]">Than Count:</span>
            <span className="font-semibold text-[#1C1917]">{invoice.numberOfTakas} Thans</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#78716C]">Net Meters:</span>
            <span className="font-bold text-[#1C1917]">{formatNumber(invoice.meters)} m</span>
          </div>
        </div>
      </div>

      {/* Itemized Calculation Matrix */}
      <div className="overflow-x-auto border border-[#E7E5E4] rounded-xl shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F5F5F4] text-[#78716C] font-semibold uppercase text-[0.6875rem] border-b border-[#E7E5E4]">
              <th className="p-3">Job Description / Process</th>
              <th className="p-3 text-right">Stitch Count</th>
              <th className="p-3 text-right">Heads</th>
              <th className="p-3 text-right">Rate / 1k St.</th>
              <th className="p-3 text-right">Taxable Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4] font-sans">
            <tr>
              <td className="p-3">
                <div className="font-semibold text-[#1C1917]">
                  Embroidery Job Work Execution
                </div>
                <div className="text-[0.6875rem] text-[#78716C] mt-0.5">
                  {invoice.fabricQuality} • Lot {invoice.lotNumber} (SAC 9988 - 5% GST Rate)
                </div>
              </td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                {formatNumber(invoice.totalStitches)}
              </td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                {invoice.headCount}
              </td>
              <td className="p-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums">
                ₹{invoice.ratePerThousand.toFixed(2)}
              </td>
              <td className="p-3 text-right font-mono font-bold text-sm text-[#1C1917] tabular-nums">
                {formatINR(invoice.baseAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tax Summary & Bank Settlement Barcode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {/* UPI QR & Bank Settlement */}
        <div className="border border-[#E7E5E4] p-4 bg-[#F5F5F4] rounded-xl flex items-center gap-3.5">
          <div className="w-16 h-16 bg-[#1C1917] p-1.5 rounded-lg flex items-center justify-center text-white shrink-0">
            <QrCode className="w-14 h-14 text-white" />
          </div>
          <div className="text-xs space-y-0.5 font-sans">
            <span className="font-semibold text-[0.6875rem] uppercase block text-[#1C1917]">Instant UPI Settlement</span>
            <span className="text-[0.6875rem] text-[#78716C] block">Direct factory ledger credit</span>
            <span className="font-mono text-xs font-semibold text-[#1C1917] block">
              {currentCompany.upiVpa ? `VPA: ${currentCompany.upiVpa}` : 'VPA: factoryops@upi'}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 pt-0.5 block">
              Amount: ₹{invoice.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* GST Breakup Matrix */}
        <div className="border border-[#E7E5E4] p-4 bg-[#F5F5F4] rounded-xl text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-[#78716C]">
            <span>Taxable Gross Value:</span>
            <span className="font-semibold text-[#1C1917] tabular-nums">{formatINR(invoice.baseAmount)}</span>
          </div>
          {invoice.cgstAmount > 0 && (
            <div className="flex justify-between text-[#78716C]">
              <span>CGST @ 2.5%:</span>
              <span className="font-semibold text-[#1C1917] tabular-nums">{formatINR(invoice.cgstAmount)}</span>
            </div>
          )}
          {invoice.sgstAmount > 0 && (
            <div className="flex justify-between text-[#78716C]">
              <span>SGST @ 2.5%:</span>
              <span className="font-semibold text-[#1C1917] tabular-nums">{formatINR(invoice.sgstAmount)}</span>
            </div>
          )}
          {invoice.igstAmount > 0 && (
            <div className="flex justify-between text-[#78716C]">
              <span>IGST @ 5.0%:</span>
              <span className="font-semibold text-[#1C1917] tabular-nums">{formatINR(invoice.igstAmount)}</span>
            </div>
          )}
          <div className="border-t border-[#D6D3D1] pt-2 flex justify-between font-bold text-sm text-[#1C1917]">
            <span className="uppercase">Total Net Payable:</span>
            <span className="text-base tabular-nums">
              {formatINR(invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Dual Signatures */}
      <div className="border-t border-[#E7E5E4] pt-4 flex flex-col sm:flex-row justify-between items-end text-xs text-[#78716C] gap-4">
        <div className="max-w-md space-y-1">
          <span className="font-semibold uppercase block text-[#1C1917] text-[0.6875rem]">Terms & Conditions</span>
          <p className="leading-relaxed text-[0.6875rem]">
            1. Goods manufactured on Job Work contract as per SAC 9988.<br />
            2. Any discrepancy must be registered within 48 hours of lot delivery.<br />
            3. Subject to Surat jurisdiction only.
          </p>
        </div>

        <div className="text-center space-y-4 shrink-0">
          <span className="font-semibold block text-[#1C1917] text-xs">
            For {currentCompany.name}
          </span>
          <span className="block border-t border-[#D6D3D1] pt-1.5 font-semibold text-[0.6875rem] uppercase text-[#78716C]">
            Authorized Signatory
          </span>
        </div>
      </div>
    </div>
  );
};

