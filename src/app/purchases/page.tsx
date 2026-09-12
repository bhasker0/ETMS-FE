'use client';

import React, { useState, useEffect } from 'react';
import { PurchasesApi, PurchaseApiItem, PurchasesSummary } from '@/lib/api/purchases';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR, formatNumber } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel-export';
import {
  ShoppingBag,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PurchasesPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const [purchases, setPurchases] = useState<PurchaseApiItem[]>([]);
  const [summary, setSummary] = useState<PurchasesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        PurchasesApi.getAll({
          search: searchTerm || undefined,
          category: categoryFilter,
          paymentStatus: paymentStatusFilter,
        }),
        PurchasesApi.getSummary(),
      ]);
      setPurchases(listRes.purchases || []);
      setSummary(summaryRes);
    } catch (err: any) {
      toast.error('Failed to load purchases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [activeCompany?.id, categoryFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurchases();
  };

  const handleDelete = async (id: string, invoiceNo: string) => {
    if (!confirm(`Are you sure you want to delete purchase invoice ${invoiceNo}?`)) return;
    try {
      await PurchasesApi.delete(id);
      toast.success(`Purchase invoice ${invoiceNo} deleted`);
      fetchPurchases();
    } catch (err: any) {
      toast.error('Failed to delete purchase: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Invoice Date', key: 'invoice_date', width: 14 },
      { header: 'Invoice No', key: 'invoice_no', width: 16 },
      { header: 'Supplier Name', key: 'supplier_name', width: 28 },
      { header: 'Supplier GSTIN', key: 'supplier_gstin', width: 18 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Payment Status', key: 'payment_status', width: 14 },
      { header: 'Taxable Amount (Rs)', key: 'subtotal', width: 18 },
      { header: 'GST (Rs)', key: 'gst_amount', width: 14 },
      { header: 'Net Amount (Rs)', key: 'net_amount', width: 18 },
      { header: 'Paid Amount (Rs)', key: 'paid_amount', width: 16 },
      { header: 'Payment Mode', key: 'payment_mode', width: 16 },
      { header: 'Notes', key: 'notes', width: 25 },
    ];
    exportToExcel(purchases, columns, 'Purchases', 'Purchases_Register');
    toast.success('Downloaded Purchases Excel Report');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-[var(--text-main)]" />
                <span>Raw Materials & Factory Spares</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight mt-1">
              Purchase Invoices
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Record yarn/dhaga, metallic zari, needles, oil, and machine spare parts purchases with input GST tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={purchases.length === 0}
              className="px-3 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Purchases Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={() => openDrawer('CREATE_PURCHASE', {}, fetchPurchases)}
              className="px-3.5 py-2 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Total Purchases
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-mono tabular-nums mt-1">
            {formatINR(summary?.total_net_amount || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {summary?.count || 0} Bills • Taxable: {formatINR(summary?.total_subtotal || 0)}
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            GST Input Credit
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_gst || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Eligible for GST offset
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Total Paid
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_paid || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Settled with suppliers
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Supplier Outstanding
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_pending || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Pending payable balance
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-lg">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by supplier name, invoice no, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden focus:border-[var(--primary)]"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="YARN_DHAGA">Yarn / Dhaga / Zari</option>
            <option value="SPARE_PARTS">Machine Spare Parts</option>
            <option value="CONSUMABLES">Needles & Lubricants</option>
            <option value="PACKAGING">Packaging Materials</option>
            <option value="RAW_MATERIAL">Raw Fabric / Grey</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Payment Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono">
            Loading purchases register...
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
            <p className="text-sm font-semibold text-[var(--text-main)]">No purchase invoices found</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Record inward thread/yarn, needles, oil, and machine spare parts bills to track factory expenses and GST input.
            </p>
            <button
              type="button"
              onClick={() => openDrawer('CREATE_PURCHASE', {}, fetchPurchases)}
              className="px-3 py-1.5 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold text-xs rounded-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Purchase</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                  <th className="p-3.5">Invoice / Date</th>
                  <th className="p-3.5">Supplier / GSTIN</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Taxable (₹)</th>
                  <th className="p-3.5 text-right">GST (₹)</th>
                  <th className="p-3.5 text-right">Net Bill (₹)</th>
                  <th className="p-3.5 text-right">Paid (₹)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-[var(--text-main)] font-mono">{p.invoice_no}</div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono mt-0.5">{p.invoice_date}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--text-main)]">{p.supplier_name}</div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono mt-0.5">
                        {p.supplier_gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-main)]">
                        {p.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium">{formatINR(p.subtotal)}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatINR(p.gst_amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">
                      {formatINR(p.net_amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatINR(p.paid_amount)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                          p.payment_status === 'PAID'
                            ? 'badge-pastel-green'
                            : p.payment_status === 'PARTIAL'
                            ? 'badge-pastel-yellow'
                            : 'badge-pastel-red'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDrawer('VIEW_PURCHASE', { purchase: p }, fetchPurchases)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded transition shadow-xs cursor-pointer inline-flex items-center"
                        title="View Purchase Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.invoice_no)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-900 rounded transition shadow-xs cursor-pointer inline-flex items-center"
                        title="Delete Purchase Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
