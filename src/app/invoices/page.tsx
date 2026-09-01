'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  FileText,
  Plus,
  Download,
  Share2,
  Search,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppDrawer } from '@/lib/app-drawer-context';

export default function InvoicesListPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const list = await OutwardInvoicesApi.getAll();
      setInvoices(list);
    } catch (e: any) {
      console.warn('Invoices load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeCompany?.id]);

  const handleDownloadPdf = async (id: string, invoiceNo: string) => {
    try {
      await OutwardInvoicesApi.downloadPdf(id, invoiceNo);
      toast.success(`Downloaded official PDF for ${invoiceNo}`);
    } catch (e: any) {
      toast.error('PDF download error: ' + e.message);
    }
  };

  const filtered = invoices.filter(
    (i) =>
      i.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.trader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.trader_gstin && i.trader_gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInvoicedSum = filtered.reduce((acc, i) => acc + Number(i.net_amount), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.invoice_headerBadge}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.invoice_title} ({invoices.length})
            </h1>
            <p className="text-xs text-slate-500">
              {t.invoice_subtitle} • {activeCompany?.name}
            </p>
          </div>

          <button
            onClick={() => openDrawer('CREATE_INVOICE', {}, fetchInvoices)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.invoice_btnCreate}</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.invoice_chipTotal} <strong className="font-bold text-slate-900">{invoices.length}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span>{t.invoice_chipVolume} <strong className="font-bold text-emerald-700">{formatINR(totalInvoicedSum)}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs text-purple-800">
            <span>{t.invoice_chipGstRate}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Filter / Search Bar */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.invoice_searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-3.5">{t.invoice_thInvoiceNo}</th>
                <th className="p-3.5">{t.invoice_thDate}</th>
                <th className="p-3.5">{t.invoice_thTrader}</th>
                <th className="p-3.5 text-right">{t.invoice_thStitchesHeads}</th>
                <th className="p-3.5 text-right">{t.invoice_thGross}</th>
                <th className="p-3.5 text-right">{t.invoice_thNet}</th>
                <th className="p-3.5 text-center">{t.invoice_thTallyStatus}</th>
                <th className="p-3.5 text-right">{t.invoice_thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {inv.invoice_no}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">{inv.invoice_date}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{inv.trader_name}</div>
                    <div className="text-2xs text-slate-400 font-mono">{inv.trader_gstin || 'Unregistered'}</div>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-600">
                    <div>{formatNumber(inv.total_stitches)} st.</div>
                    <div className="text-2xs text-slate-400">{inv.machine_heads} Heads • ₹{inv.rate_per_1000}/1k</div>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-600">
                    {formatINR(inv.gross_amount)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatINR(inv.net_amount)}
                  </td>
                  <td className="p-3.5 text-center">
                    {inv.is_tally_synced ? (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.invoice_tallySynced}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-500">
                        {t.invoice_tallyPending}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => openDrawer('GENERATE_EWB', { invoice: inv }, fetchInvoices)}
                      className="p-1.5 hover:bg-amber-50 text-amber-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium cursor-pointer"
                      title="Generate Government NIC E-Way Bill JSON"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{t.invoice_btnEwayBill}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoice_no)}
                      className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium cursor-pointer"
                      title="Download Official Puppeteer PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.invoice_btnPdf}</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Invoice ${inv.invoice_no} from ${activeCompany?.name}: Total ₹${Number(inv.net_amount || 0).toFixed(2)}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t.invoice_btnWhatsApp}</span>
                    </a>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {t.invoice_noInvoices}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
