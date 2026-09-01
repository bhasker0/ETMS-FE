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
    name: activeCompany?.name || 'SURAT EMBROIDERY UNIT',
    gstin: activeCompany?.gstin || '24AAACE0000A1Z5',
    address: activeCompany?.address || 'Plot 42, Sachin GIDC, Surat',
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
      <div
        className="thermal-receipt-container w-[80mm] max-w-[80mm] mx-auto p-4 font-mono text-xs leading-tight border border-black/30 rounded-lg shadow-sm print:border-none print:shadow-none print:m-0 print:p-1"
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        {/* Header */}
        <div className="text-center pb-2 mb-2 space-y-0.5">
          <div className="font-bold text-sm uppercase tracking-tight">
            {currentCompany.name.split('(')[0]}
          </div>
          <div className="text-[0.625rem] text-black/80">{currentCompany.address}</div>
          <div className="text-[0.625rem] font-semibold">GSTIN: {currentCompany.gstin}</div>
          <div className="text-[0.625rem] text-black/50 py-0.5">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div className="text-[0.6875rem] font-bold uppercase tracking-wider">
            Job Work Tax Slip [SAC 9988]
          </div>
          <div className="text-[0.625rem] text-black/50 py-0.5">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="pb-1.5 mb-1.5 space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-black/70">Inv No:</span>
            <span className="font-bold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Date:</span>
            <span>{invoice.invoiceDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Lot No:</span>
            <span className="font-bold">{invoice.lotNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Trader:</span>
            <span className="font-bold truncate max-w-[140px]">{invoice.traderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Quality:</span>
            <span className="truncate max-w-[140px]">{invoice.fabricQuality}</span>
          </div>
        </div>

        {/* Production Details */}
        <div className="pb-1.5 mb-1.5 space-y-0.5 text-xs">
          <div className="text-[0.625rem] text-black/50 text-center">
            --------------------------------
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Total Thans:</span>
            <span>{invoice.numberOfTakas} Thans</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Total Meters:</span>
            <span className="font-bold">{formatNumber(invoice.meters)} m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Stitch Count:</span>
            <span className="font-bold">{formatNumber(invoice.totalStitches)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Rate / 1k St.:</span>
            <span>₹{invoice.ratePerThousand.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/70">Machine Heads:</span>
            <span>{invoice.headCount} Heads</span>
          </div>
          <div className="text-[0.625rem] text-black/50 text-center">
            --------------------------------
          </div>
        </div>

        {/* Amount Breakup */}
        <div className="pb-1.5 mb-2 space-y-0.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-black/70">Taxable Base:</span>
            <span className="font-semibold">₹{invoice.baseAmount.toFixed(2)}</span>
          </div>
          {invoice.cgstAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-black/70">CGST (2.5%):</span>
              <span>₹{invoice.cgstAmount.toFixed(2)}</span>
            </div>
          )}
          {invoice.sgstAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-black/70">SGST (2.5%):</span>
              <span>₹{invoice.sgstAmount.toFixed(2)}</span>
            </div>
          )}
          {invoice.igstAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-black/70">IGST (5.0%):</span>
              <span>₹{invoice.igstAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="text-[0.625rem] text-black/50 text-center py-0.5">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
          <div className="flex justify-between text-xs font-bold pt-0.5">
            <span>Total Due:</span>
            <span>₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-[0.625rem] text-black/50 text-center py-0.5">
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </div>
        </div>

        {/* Barcode & Signatures */}
        <div className="text-center space-y-2 pt-1 text-xs">
          <div className="tracking-widest font-mono font-bold text-xs py-1 border border-black/20 rounded bg-black/5">
            * {invoice.invoiceNumber} *
          </div>
          <div className="text-[0.625rem] uppercase text-black/60">
            Official Embroidery Job Work Dispatch
          </div>
          <div className="pt-4 flex justify-between text-[0.625rem] font-semibold uppercase text-black/70">
            <span>Receiver Sign</span>
            <span>Operator Sign</span>
          </div>
        </div>
      </div>
    </>
  );
};

