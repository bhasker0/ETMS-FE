'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { WhatsappApi } from '@/lib/api/whatsapp';
import { useAuth } from '@/lib/auth-context';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Search,
  ArrowRight,
  Scissors,
  CheckCircle2,
  PackageCheck,
  Eye,
  Edit2,
  FileText,
  Download,
  Share2,
} from 'lucide-react';
import { useAppDrawer } from '@/lib/app-drawer-context';

export default function ChallansListPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Track inspected defect meters for badge display
  const [inspectedLots, setInspectedLots] = useState<Record<string, { meters: number; deduction: number }>>({
    'LOT-8892': { meters: 2.5, deduction: 112.5 },
  });

  const handleOpenDefect = (c: InwardChallanApiItem) => {
    openDrawer('LOG_DEFECT', { lot: c }, (result: any) => {
      if (result?.lot_no && result?.meters) {
        setInspectedLots((prev) => ({
          ...prev,
          [result.lot_no]: { meters: result.meters, deduction: result.deduction },
        }));
      }
    });
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const data = await InwardChallansApi.getAll();
      setChallans(data);
    } catch (e: any) {
      console.warn('Challans fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [activeCompany?.id]);

  const handleDownloadPdf = async (c: InwardChallanApiItem) => {
    try {
      await InwardChallansApi.downloadPdf(c.id, c.challan_no || `challan-${c.lot_no}`);
      toast.success(`Downloaded Delivery Challan ${c.challan_no || c.lot_no} PDF`);
    } catch (err: any) {
      toast.error('Failed to download challan PDF: ' + err.message);
    }
  };

  const handleSendWhatsApp = async (c: InwardChallanApiItem) => {
    try {
      const res = await WhatsappApi.sendChallanPdf(c.id);
      const displayPhone = res?.recipient?.phone || 'registered mobile';
      if (res?.isFallback) {
        toast.warning(res?.message || 'WhatsApp Gateway offline; opened web fallback.');
        if (res?.fallbackUrl) {
          window.open(res.fallbackUrl, '_blank');
        }
      } else {
        toast.success(`Challan ${c.challan_no} PDF sent to ${c.trader_name} (${displayPhone}) via WhatsApp!`);
      }
    } catch (err: any) {
      toast.error('Failed to send WhatsApp document: ' + err.message);
    }
  };

  const filtered = challans.filter((c) => {
    const matchesSearch =
      c.lot_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.trader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fabric_quality.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTakas = filtered.reduce((acc, c) => acc + c.than_count, 0);
  const totalMeters = filtered.reduce((acc, c) => acc + Number(c.inward_meters), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Truck className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Fabric Inward • Delivery Routing</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Job Work Challans & Fabric Lots ({challans.length} Recorded)
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Inward gray cloth delivery notes, quality inspections, and machine quota allocation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openDrawer('ADD_CHALLAN', {}, fetchChallans)}
              className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-xs shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Inward Lot</span>
            </button>
          </div>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Active Lots on Floor
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {challans.length} <span className="text-xs font-normal text-[var(--text-muted)]">Lots</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Total Gray Fabric Thans
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {totalTakas} <span className="text-xs font-normal text-[var(--text-muted)]">Thans</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Cumulative Inward Length
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {formatNumber(totalMeters)} <span className="text-xs font-normal text-[var(--text-muted)]">Meters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Pipeline Stage Progression Stepper */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-muted)] font-semibold uppercase text-[0.6875rem]">Production Pipeline</span>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap font-mono">
              <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-300/60 px-2 py-0.5 rounded-xs text-[0.6875rem] font-semibold">
                1. Inward
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300/60 px-2 py-0.5 rounded-xs text-[0.6875rem] font-semibold">
                2. On Machine
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 px-2 py-0.5 rounded-xs text-[0.6875rem] font-semibold">
                3. QA Inspect
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300/60 px-2 py-0.5 rounded-xs text-[0.6875rem] font-semibold">
                4. Dispatched
              </span>
            </div>
          </div>
        </div>

        {/* Search, Filter & View Mode Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-[var(--bg-surface)] p-3 sm:p-4 border border-[var(--border)] rounded-xs shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by lot number, trader name or fabric quality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xs text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--text-main)]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 border border-[var(--border)] rounded-xs overflow-x-auto text-xs">
              {['ALL', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-xs transition whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] p-1 border border-[var(--border)] rounded-xs text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2 py-1 rounded-xs font-medium transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded-xs font-medium transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Cards Grid */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const linkedInv = (c as any).outwardInvoices?.[0] || c.outward_invoices?.[0];
              const isInvoiced = Boolean(linkedInv || c.status === 'DISPATCHED');
              const hasDefect = Boolean(inspectedLots[c.lot_no]);

              return (
                <div
                  key={c.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs p-4 shadow-xs space-y-3.5 hover:border-[var(--border-strong)] transition flex flex-col justify-between"
                >
                  {/* Card Header: Lot No, Date & Status */}
                  <div className="space-y-2 border-b border-[var(--border)] pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                          {c.lot_no}
                        </span>
                        {c.challan_no && (
                          <span className="text-[0.6875rem] font-mono text-[var(--text-muted)]">
                            ({c.challan_no})
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-xs text-[0.625rem] font-mono font-semibold uppercase tracking-wider shrink-0 ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/60'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-300/60'
                            : c.status === 'DISPATCHED'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/60'
                            : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-main)] truncate">
                          {c.trader_name}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
                          GSTIN: {c.trader_gstin || 'Unregistered'}
                        </div>
                      </div>
                      <div className="text-[0.6875rem] font-mono text-[var(--text-muted)] text-right">
                        {c.challan_date || 'Recent'}
                      </div>
                    </div>
                  </div>

                  {/* Fabric Specs & Quantity Matrix */}
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold">Fabric Quality:</span>
                      <div className="text-[var(--text-main)] font-medium text-xs mt-0.5">
                        {c.fabric_quality}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs text-xs font-mono">
                      <div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase">Gray Thans</div>
                        <div className="font-bold text-[var(--text-main)] mt-0.5">{c.than_count} Thans</div>
                      </div>
                      <div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase">Inward Length</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatNumber(c.inward_meters)} m
                        </div>
                      </div>
                    </div>

                    {hasDefect && (
                      <div className="flex items-center justify-between px-2 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-700 dark:text-rose-300 font-mono">
                        <span>QA Defect Detected:</span>
                        <span className="font-bold">{inspectedLots[c.lot_no].meters}m (-₹{inspectedLots[c.lot_no].deduction})</span>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openDrawer('VIEW_CHALLAN', { challan: c })}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDrawer('EDIT_CHALLAN', { challan: c }, fetchChallans)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition cursor-pointer"
                        title="Edit Lot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(c)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition cursor-pointer"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(c)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xs transition cursor-pointer"
                        title="Send WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDefect(c)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition cursor-pointer"
                        title="QA Flaw Inspection"
                      >
                        <Scissors className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>

                    {isInvoiced ? (
                      <button
                        type="button"
                        onClick={() => openDrawer('VIEW_INVOICE', { invoice: linkedInv, challan: c, challanId: c.id }, fetchChallans)}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold inline-flex items-center gap-1 rounded-xs transition shadow-xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{linkedInv?.invoice_no ? `${linkedInv.invoice_no}` : 'Invoiced'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDrawer('CREATE_INVOICE', { challan: c, challanId: c.id, lotNo: c.lot_no }, fetchChallans)}
                        className="px-2.5 py-1 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-medium inline-flex items-center gap-1 rounded-xs transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Bill</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full p-10 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs">
                No job work challans found matching current filter.
              </div>
            )}
          </div>
        ) : (
          /* View Mode: Dense Table */
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
                  <th className="p-3.5">Lot / Challan</th>
                  <th className="p-3.5">Trader & GSTIN</th>
                  <th className="p-3.5">Fabric Quality Spec</th>
                  <th className="p-3.5 text-right">Thans</th>
                  <th className="p-3.5 text-right">Inward Meters</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                    <td className="p-3.5 font-mono font-semibold text-[var(--text-main)]">
                      <div>{c.lot_no}</div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-normal">ID: {c.id.slice(0, 8)}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[var(--text-main)]">{c.trader_name}</div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">{c.trader_gstin || 'Unregistered'}</div>
                    </td>
                    <td className="p-3.5 text-[var(--text-main)] font-medium">{c.fabric_quality}</td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-muted)] tabular-nums">{c.than_count}</td>
                    <td className="p-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatNumber(c.inward_meters)} m
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-xs text-[0.6875rem] font-semibold uppercase ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/60'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-300/60'
                            : c.status === 'DISPATCHED'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/60'
                            : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Challan */}
                      <button
                        type="button"
                        onClick={() => openDrawer('VIEW_CHALLAN', { challan: c })}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition shadow-xs cursor-pointer inline-flex items-center"
                        title="View Inward Challan Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Challan */}
                      <button
                        type="button"
                        onClick={() => openDrawer('EDIT_CHALLAN', { challan: c }, fetchChallans)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition shadow-xs cursor-pointer inline-flex items-center"
                        title="Edit Inward Challan & Designs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Print Challan PDF */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(c)}
                        className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-xs transition shadow-xs cursor-pointer inline-flex items-center"
                        title="Download Inward Delivery Challan PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp Share Challan */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(c)}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xs transition shadow-xs cursor-pointer inline-flex items-center"
                        title="Send Challan PDF directly to party via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* QA Inspection */}
                      <button
                        type="button"
                        onClick={() => handleOpenDefect(c)}
                        className="px-2 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium inline-flex items-center gap-1 rounded-xs transition cursor-pointer shadow-xs"
                        title="Log Fabric Flaws, Defective Meters & Yarn Wastage"
                      >
                        <Scissors className="w-3 h-3 text-rose-500" />
                        <span>{inspectedLots[c.lot_no] ? `${inspectedLots[c.lot_no].meters}m Defect` : 'QA Check'}</span>
                      </button>

                      {/* Invoiced vs Generate Bill */}
                      {(() => {
                        const linkedInv = (c as any).outwardInvoices?.[0] || c.outward_invoices?.[0];
                        const isInvoiced = Boolean(linkedInv || c.status === 'DISPATCHED');
                        if (isInvoiced) {
                          return (
                            <button
                              type="button"
                              onClick={() => openDrawer('VIEW_INVOICE', { invoice: linkedInv, challan: c, challanId: c.id }, fetchChallans)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold inline-flex items-center gap-1 rounded-xs transition shadow-xs cursor-pointer"
                              title={linkedInv?.invoice_no ? `Invoiced (${linkedInv.invoice_no}). Click to view, edit, print PDF, or send WhatsApp in drawer.` : 'Challan is already invoiced. Click to view invoice in drawer.'}
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{linkedInv?.invoice_no ? `Bill: ${linkedInv.invoice_no}` : 'View Bill'}</span>
                            </button>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => openDrawer('CREATE_INVOICE', { challan: c, challanId: c.id, lotNo: c.lot_no }, fetchChallans)}
                            className="px-2.5 py-1 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-medium inline-flex items-center gap-1 rounded-xs transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <span>Generate Bill</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                      No job work challans found matching current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

