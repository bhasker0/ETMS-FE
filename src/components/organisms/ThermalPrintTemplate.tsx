'use client';

import React from 'react';
import { InvoiceSAC9988 } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { formatNumber } from '@/lib/utils';

interface ThermalPrintProps {
  invoice: InvoiceSAC9988;
}

export const ThermalPrintTemplate: React.FC<ThermalPrintProps> = ({ invoice }) => {
  const { activeCompany } = useAuth();

  const currentCompany = {
    name: activeCompany?.name || 'Company Name',
    gstin: activeCompany?.gstin || '',
    address: activeCompany?.address || '',
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm 2mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .thermal-receipt-container {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            border: none !important;
            box-shadow: none !important;
            font-variant-numeric: tabular-nums;
          }
        }
      `}</style>
      <div className="thermal-receipt-container w-[80mm] max-w-[80mm] mx-auto bg-white text-black p-3 font-mono text-xs leading-tight border border-dashed border-slate-400 shadow-sm print:border-none print:shadow-none print:m-0 print:p-1">
      {/* Header */}
      <div className="text-center border-b border-black pb-2 mb-2 space-y-0.5">
        <div className="font-extrabold text-sm uppercase tracking-tight">
          {currentCompany.name.split('(')[0]}
        </div>
        <div className="text-2xs">{currentCompany.address}</div>
        <div className="text-2xs font-bold">GSTIN: {currentCompany.gstin}</div>
        <div className="text-2xs font-bold">SAC 9988 - જોબવર્ક કાપલી</div>
      </div>

      {/* Invoice Meta */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 space-y-0.5 text-2xs">
        <div className="flex justify-between">
          <span>બીલ નં (INV):</span>
          <span className="font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>તારીખ (Date):</span>
          <span>{invoice.invoiceDate}</span>
        </div>
        <div className="flex justify-between">
          <span>લોટ નં (Lot):</span>
          <span className="font-bold">{invoice.lotNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>વેપારી (Trader):</span>
          <span className="font-bold truncate max-w-[120px]">{invoice.traderName}</span>
        </div>
        <div className="flex justify-between">
          <span>ફેબ્રિક (Fabric):</span>
          <span className="truncate max-w-[120px]">{invoice.fabricQuality}</span>
        </div>
      </div>

      {/* Production Details */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 space-y-0.5 text-2xs">
        <div className="flex justify-between">
          <span>તાકા સંખ્યા:</span>
          <span>{invoice.numberOfTakas} Thans</span>
        </div>
        <div className="flex justify-between">
          <span>તૈયાર મીટર:</span>
          <span>{formatNumber(invoice.meters)} MTR</span>
        </div>
        <div className="flex justify-between">
          <span>ટાંકા (Stitches):</span>
          <span>{formatNumber(invoice.totalStitches)}</span>
        </div>
        <div className="flex justify-between">
          <span>ભાવ (Rate/1k):</span>
          <span>₹{invoice.ratePerThousand.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>હેડ (Heads):</span>
          <span>{invoice.headCount}</span>
        </div>
      </div>

      {/* Amount Breakup */}
      <div className="border-b-2 border-black pb-1.5 mb-2 space-y-0.5 text-2xs">
        <div className="flex justify-between">
          <span>ટેક્સેબલ રકમ:</span>
          <span>₹{invoice.baseAmount.toFixed(2)}</span>
        </div>
        {invoice.cgstAmount > 0 && (
          <div className="flex justify-between">
            <span>CGST (2.5%):</span>
            <span>₹{invoice.cgstAmount.toFixed(2)}</span>
          </div>
        )}
        {invoice.sgstAmount > 0 && (
          <div className="flex justify-between">
            <span>SGST (2.5%):</span>
            <span>₹{invoice.sgstAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black border-t border-black pt-1">
          <span>કુલ રકમ (TOTAL):</span>
          <span>₹{invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Barcode / Stamp */}
      <div className="text-center space-y-2 pt-1 text-2xs">
        <div className="tracking-widest font-black text-xs py-1 border border-black bg-slate-100">
          * {invoice.invoiceNumber} *
        </div>
        <div className="text-2xs text-slate-700">
          સુરત જીઆઇડીસી ગેટ પાસ અને ડિસ્પેચ સ્લિપ
        </div>
        <div className="pt-4 flex justify-between text-2xs">
          <span>માલ લેનાર સહી</span>
          <span>ઓપરેટર સહી</span>
        </div>
      </div>
    </div>
    </>
  );
};
