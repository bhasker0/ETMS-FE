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
    name: activeCompany?.name || 'Company Name',
    upiVpa: activeCompany?.upiVpa || '',
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
      <div className="p-8 text-center text-slate-400">
        ઇનવોઇસ લોડ થઈ રહ્યું છે...
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
UPI Pay: ${currentCompany.upiVpa || 'Contact us for payment details'}
જય શ્રી કૃષ્ણ 🙏`;

  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank');
    toast.success('WhatsApp ચેટ ઓપન થઈ!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    toast.success('ઇનવોઇસ સમરી કોપી થઈ ગઈ!');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-slate-900 border-2 border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                {invoice.invoiceNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                  invoice.paymentStatus === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {invoice.paymentStatus === 'paid' ? 'ચુકવાઈ ગયું (PAID)' : 'બાકી (UNPAID)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              વેપારી: <strong>{invoice.traderName}</strong> • {invoice.lotNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Switcher */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                printFormat === 'a4'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>A4 ટેક્સ ઇનવોઇસ</span>
            </button>
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                printFormat === 'thermal'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>૩-ઇંચ થર્મલ સ્લિપ</span>
            </button>
          </div>

          <button
            onClick={handleOpenWhatsApp}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp પર મોકલો</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>પ્રિન્ટ કરો</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Message Quick Preview Bar (Hidden in Print) */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2 text-slate-300 truncate">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate font-mono">
            WhatsApp લિંક: wa.me/{waPhone}?text={invoice.invoiceNumber}...
          </span>
        </div>
        <button
          onClick={handleCopyText}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg font-bold text-2xs flex items-center gap-1 shrink-0"
        >
          <Copy className="w-3 h-3" />
          <span>કોપી ટેક્સ્ટ</span>
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
