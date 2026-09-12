'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { offlineStore } from '@/lib/offline-store';
import { OutwardInvoicesApi } from '@/lib/api/invoices';
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
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { WhatsappApi } from '@/lib/api/whatsapp';

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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [sendingWa, setSendingWa] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    setNotFound(false);

    // 1. First attempt to fetch live authenticated invoice from database API
    OutwardInvoicesApi.getById(invoiceId)
      .then((apiInv) => {
        if (apiInv && apiInv.id) {
          const mapped: InvoiceSAC9988 = {
            id: apiInv.id,
            invoiceNumber: apiInv.invoice_no,
            invoiceDate: apiInv.invoice_date,
            challanId: apiInv.inward_challan_id,
            lotNumber:
              apiInv.inward_challan?.lot_no ||
              apiInv.lot_items?.[0]?.lot_no ||
              'Standard Lot',
            traderName: apiInv.trader_name,
            traderGstin: apiInv.trader_gstin || '',
            traderMobile: apiInv.trader_mobile || (apiInv as any).party?.mobile || '',
            traderAddress: (apiInv as any).party_address || (apiInv as any).party?.address || 'Surat, Gujarat',
            sacCode: apiInv.sac_code || '9988',
            fabricQuality:
              apiInv.lot_items?.[0]?.fabric_quality ||
              apiInv.inward_challan?.fabric_quality ||
              'Embroidery Job Work',
            numberOfTakas:
              apiInv.lot_items?.[0]?.thans ||
              apiInv.inward_challan?.than_count ||
              1,
            totalStitches: Number(apiInv.total_stitches || 0),
            headCount: Number(apiInv.machine_heads || 32),
            ratePerThousand: Number(apiInv.rate_per_1000 || 0.6),
            meters: Number(apiInv.outward_meters || apiInv.inward_meters || 0),
            baseAmount: Number(apiInv.gross_amount || 0),
            gstRate: 5,
            cgstAmount: Number(apiInv.cgst_amount || 0),
            sgstAmount: Number(apiInv.sgst_amount || 0),
            igstAmount: Number(apiInv.igst_amount || 0),
            isInterstate: Boolean(apiInv.is_interstate),
            totalAmount: Number(apiInv.net_amount || 0),
            paymentStatus: 'unpaid',
            whatsappDispatched: false,
            tallySynced: Boolean(apiInv.is_tally_synced),
            termsCondition:
              '1. Subject to Surat Jurisdiction. 2. Interest @ 18% p.a. will be charged after due date. 3. Dispute if any within 3 days.',
          };
          setInvoice(mapped);
        } else {
          fallbackLocal();
        }
      })
      .catch((e) => {
        console.warn('Live API fetch failed, checking offline store:', e);
        fallbackLocal();
      })
      .finally(() => setLoading(false));

    function fallbackLocal() {
      const localInvoices = offlineStore.getInvoices();
      const found = localInvoices.find((i) => i.id === invoiceId);
      if (found) {
        setInvoice(found);
      } else {
        setNotFound(true);
      }
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span>Loading Tax Invoice particulars...</span>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="p-12 max-w-md mx-auto text-center space-y-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl my-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text-main)]">Invoice Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          The requested invoice record could not be found or has been archived.
        </p>
        <button
          onClick={() => router.push('/invoices')}
          className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition cursor-pointer"
        >
          Return to Invoices Ledger
        </button>
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

  const handleOpenWhatsApp = async () => {
    setSendingWa(true);
    try {
      const res = await WhatsappApi.sendInvoicePdf(invoice.id, {
        phone: waPhone,
        caption: `Tax Invoice ${invoice.invoiceNumber} from ${currentCompany.name}. Total: ₹${invoice.totalAmount.toFixed(2)}`,
      });
      toast.success(res?.message || 'Invoice PDF dispatched via WhatsApp!');
      if (res?.isFallback && res?.fallbackUrl) {
        window.open(res.fallbackUrl, '_blank');
      }
    } catch (err: any) {
      toast.error('Failed to send WhatsApp document: ' + err.message);
      window.open(waUrl, '_blank');
    } finally {
      setSendingWa(false);
    }
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
            disabled={sendingWa}
            onClick={handleOpenWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {sendingWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{sendingWa ? 'Sending...' : 'WhatsApp'}</span>
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

