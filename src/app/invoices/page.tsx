'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { useAuth } from '@/lib/auth-context';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  FileText,
  Plus,
  Download,
  Share2,
  Search,
} from 'lucide-react';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { toast } from 'sonner';
import { Drawer } from '@/components/ui/drawer';

export default function InvoicesListPage() {
  const { activeCompany } = useAuth();
  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice Drawer Form State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [traderName, setTraderName] = useState('Ambaji Fashion Surat');
  const [traderGstin, setTraderGstin] = useState('24BBCDE5678G1Z3');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [billedMeters, setBilledMeters] = useState<number>(1200);
  const [ratePerMeter, setRatePerMeter] = useState<number>(18.5);
  const [taxRate, setTaxRate] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchChallans = async () => {
    try {
      const data = await InwardChallansApi.getAll();
      setChallans(data);
      if (data.length > 0 && !inwardChallanId) setInwardChallanId(data[0].id);
    } catch (e) {
      console.warn('Challans fetch error:', e);
    }
  };

  const handleOpenDrawer = () => {
    fetchChallans();
    setIsAddDrawerOpen(true);
  };

  const taxableAmount = Math.round(Number(billedMeters) * Number(ratePerMeter));
  const gstAmount = Math.round(taxableAmount * (taxRate / 100));
  const netAmount = taxableAmount + gstAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim()) {
      toast.error('Trader name is required');
      return;
    }
    setSubmitting(true);
    try {
      await OutwardInvoicesApi.create({
        trader_name: traderName,
        trader_gstin: traderGstin,
        invoice_date: invoiceDate,
        inward_challan_id: inwardChallanId || undefined,
        total_stitches: Math.round(Number(billedMeters) * 1000),
        machine_heads: 32,
        rate_per_1000: Number(ratePerMeter),
        inward_meters: Number(billedMeters),
        outward_meters: Number(billedMeters),
      });
      toast.success('SAC 9988 Invoice generated successfully!');
      setIsAddDrawerOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error('Failed to create invoice: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
              <span>SAC 9988 • 5% GST Jobwork Tax Invoices</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Outward Invoices ({invoices.length})
            </h1>
            <p className="text-xs text-slate-500">
              Stitch billing for {activeCompany?.name} with instant Puppeteer PDF export
            </p>
          </div>

          <button
            onClick={handleOpenDrawer}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create SAC 9988 Invoice</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Total Invoices: <strong className="font-bold text-slate-900">{invoices.length} Bills</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <span>Billed Volume: <strong className="font-bold text-emerald-700">{formatINR(totalInvoicedSum)}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs text-purple-800">
            <span>GST Rate: <strong className="font-bold text-purple-900">SAC 9988 (5%)</strong></span>
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
              placeholder="Search invoice number, trader name or GSTIN..."
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
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Trader (વેપારી)</th>
                <th className="p-3.5 text-right">Stitches & Heads</th>
                <th className="p-3.5 text-right">Taxable Gross</th>
                <th className="p-3.5 text-right">Total Net (₹)</th>
                <th className="p-3.5 text-center">Tally Status</th>
                <th className="p-3.5 text-right">Actions</th>
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
                        Synced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-500">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoice_no)}
                      className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium"
                      title="Download Official Puppeteer PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Invoice ${inv.invoice_no} from ${activeCompany?.name}: Total ₹${inv.net_amount.toFixed(2)}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No invoices generated yet. Click &quot;+ Create SAC 9988 Invoice&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create SAC 9988 Invoice Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Create SAC 9988 Outward Bill (ઇનવોઇસ બનાવો)"
        subtitle="સુરત એમ્બ્રોઇડરી જ્હોબવર્ક 5% GST ટેક્સ બિલ"
        icon={<FileText className="w-5 h-5 text-slate-700" />}
        size="lg"
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('invoice-drawer-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={submitting}
              className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
            >
              {submitting ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        }
      >
        <form id="invoice-drawer-form" onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Billed Trader / Party Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ambaji Fashion Surat"
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
              <input
                type="text"
                placeholder="24BBCDE5678G1Z3"
                value={traderGstin}
                onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Invoice Issue Date *</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Link Inward Fabric Lot (Challan)</label>
            <select
              value={inwardChallanId}
              onChange={(e) => setInwardChallanId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            >
              <option value="">-- Direct SAC 9988 Billing --</option>
              {challans.map((c) => (
                <option key={c.id} value={c.id}>
                  Lot #{c.lot_no} • {c.trader_name} ({c.inward_meters}m {c.fabric_quality})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
              SAC 9988 Jobwork Calculation Breakdown
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">Billed Quantity (Meters) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={billedMeters}
                  onChange={(e) => setBilledMeters(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">Stitch Rate (₹ / Meter) *</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  value={ratePerMeter}
                  onChange={(e) => setRatePerMeter(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Taxable Value (SAC 9988):</span>
                <span className="font-mono font-semibold text-slate-900">{formatINR(taxableAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>GST (CGST 2.5% + SGST 2.5%):</span>
                <span className="font-mono font-semibold text-slate-900">{formatINR(gstAmount)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>NET PAYABLE INVOICE TOTAL:</span>
                <span className="font-mono text-emerald-700 text-sm">{formatINR(netAmount)}</span>
              </div>
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
