'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { offlineStore } from '@/lib/offline-store';
import { MOCK_INVOICES } from '@/lib/mock-data';
import { InvoiceSAC9988 } from '@/lib/types';
import { InvoicePrintTemplate } from '@/components/InvoicePrintTemplate';
import { ThermalPrintTemplate } from '@/components/ThermalPrintTemplate';
import {
  Share2,
  Printer,
  ArrowLeft,
  Smartphone,
  Copy,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeCompany } = useAuth();

  const currentCompany = {
    name: activeCompany?.name || 'SURAT EMBROIDERY UNIT',
    upiVpa: activeCompany?.upiVpa || 'factoryops@upi',
  };

  const invoiceId = params?.id as string;
  const [invoice, setInvoice] = useState<InvoiceSAC9988 | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    // Check local store first, then mock data
    const localInvoices = offlineStore.getInvoices();
    const found =
      localInvoices.find((i) => i.id === invoiceId) ||
      MOCK_INVOICES.find((i) => i.id === invoiceId) ||
      MOCK_INVOICES[0];

    setInvoice(found);
  }, [invoiceId]);

  if (!invoice) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono">
        {"/// LOADING INVOICE RECORD..."}
      </div>
    );
  }

  // WhatsApp Message Composer
  const cleanPhone = (invoice.traderMobile || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const messageText = `*${currentCompany.name.split('(')[0].trim()}*
*GST TAX INVOICE (SAC 9988)*
--------------------------------
📄 *Invoice No:* ${invoice.invoiceNumber}
📅 *Date:* ${invoice.invoiceDate}
📦 *Lot No:* ${invoice.lotNumber}
🧵 *Stitches:* ${(invoice.totalStitches || 0).toLocaleString('en-IN')} Stitches (${invoice.headCount || 0} Heads)
👗 *Fabric:* ${invoice.fabricQuality} (${invoice.numberOfTakas || 0} Thans / ${invoice.meters || 0}m)
--------------------------------
💰 *Taxable Base:* ₹${invoice.baseAmount.toFixed(2)}
📊 *GST (5%):* ₹${(invoice.cgstAmount + invoice.sgstAmount + (invoice.igstAmount || 0)).toFixed(2)}
💵 *TOTAL AMOUNT:* ₹${invoice.totalAmount.toFixed(2)}
--------------------------------
UPI Pay: ${currentCompany.upiVpa || 'factoryops@upi'}`;

  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank');
    toast.success('[DISPATCHED] WhatsApp client opened');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    toast.success('[COPIED] Invoice text copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[var(--text-main)]">
                {invoice.invoiceNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                  invoice.paymentStatus === 'paid'
                    ? 'badge-pastel-green'
                    : 'badge-pastel-yellow'
                }`}
              >
                {invoice.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Trader: <strong className="text-[var(--text-main)]">{invoice.traderName}</strong> • Lot: {invoice.lotNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Switcher */}
          <div className="inline-flex bg-[var(--bg-surface-elevated)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                printFormat === 'a4'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>A4 Print</span>
            </button>
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                printFormat === 'thermal'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm Thermal</span>
            </button>
          </div>

          <button
            onClick={handleOpenWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Message Quick Preview Bar (Hidden in Print) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2 text-[var(--text-muted)] truncate">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate font-mono text-xs">
            Target: wa.me/{waPhone}?text={invoice.invoiceNumber}...
          </span>
        </div>
        <button
          onClick={handleCopyText}
          className="px-3 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-medium text-xs rounded-md flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Text</span>
        </button>
      </div>

      {/* Render Selected Print Preview */}
      <div className="py-2">
        {printFormat === 'a4' ? (
          <InvoicePrintTemplate invoice={invoice} />
        ) : (
          <ThermalPrintTemplate invoice={invoice} />
        )}
      </div>
    </div>
  );
}

