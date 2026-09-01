'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ShiftLogsApi, ShiftLogApiItem } from '@/lib/api/shift-logs';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { InwardChallansApi, InwardChallanApiItem, ActivePendingLotItem } from '@/lib/api/challans';
import { CompanyApi, DEFAULT_DASHBOARD_CARDS } from '@/lib/api/company';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  Wrench,
  Truck,
  FileText,
  Plus,
  TrendingUp,
  Activity,
  Download,
  Layers,
  ArrowUpRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FactoryDashboard() {
  const router = useRouter();
  const { activeCompany, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { openDrawer } = useAppDrawer();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [shifts, setShifts] = useState<ShiftLogApiItem[]>([]);
  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [activeLots, setActiveLots] = useState<ActivePendingLotItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Card arrangement layout order (defaults to Company 000 default parameter)
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_DASHBOARD_CARDS);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Load layout preferences on mount / company change
  useEffect(() => {
    if (!activeCompany?.id) return;
    const cacheKey = `etms_dash_layout_${activeCompany.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCardOrder(parsed);
        }
      } catch {}
    }

    // Fetch remote parameter from backend
    CompanyApi.getDashboardLayout().then((remoteOrder) => {
      if (Array.isArray(remoteOrder) && remoteOrder.length > 0) {
        setCardOrder(remoteOrder);
        localStorage.setItem(cacheKey, JSON.stringify(remoteOrder));
      }
    });
  }, [activeCompany?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [mList, sList, iList, cList, aLots] = await Promise.all([
        MachinesApi.getAll().catch(() => []),
        ShiftLogsApi.getAll().catch(() => []),
        OutwardInvoicesApi.getAll().catch(() => []),
        InwardChallansApi.getAll().catch(() => []),
        InwardChallansApi.getActivePendingLots().catch(() => []),
      ]);
      setMachines(mList);
      setShifts(sList);
      setInvoices(iList);
      setChallans(cList);
      setActiveLots(aLots);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeCompany?.id]);

  // Persist updated layout order locally and to backend
  const saveCardOrder = async (newOrder: string[]) => {
    setCardOrder(newOrder);
    if (activeCompany?.id) {
      localStorage.setItem(`etms_dash_layout_${activeCompany.id}`, JSON.stringify(newOrder));
    }
    try {
      await CompanyApi.updateDashboardLayout(newOrder);
    } catch (e) {
      console.warn('Failed to sync card layout to backend:', e);
    }
  };

  // Move card Up or Down
  const moveCard = (id: string, delta: number) => {
    const currentIndex = cardOrder.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;

    const updated = [...cardOrder];
    const [removed] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, removed);
    saveCardOrder(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) {
      setDraggedCardId(null);
      return;
    }

    const fromIndex = cardOrder.indexOf(draggedCardId);
    const toIndex = cardOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...cardOrder];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setDraggedCardId(null);
    saveCardOrder(updated);
  };

  const resetLayout = () => {
    saveCardOrder(DEFAULT_DASHBOARD_CARDS);
  };

  const totalMeters = shifts.reduce((acc, s) => acc + Number(s.total_meters || 0), 0);
  const totalStitches = shifts.reduce((acc, s) => acc + Number(s.total_stitches || 0), 0);
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.net_amount || 0), 0);
  const activeMachinesCount = machines.filter((m) => m.is_active).length;

  // Render Card Content by Identifier
  const renderCardContent = (cardId: string, index: number) => {
    switch (cardId) {
      case 'fleet_status':
        return (
          <div
            key="fleet_status"
            draggable
            onDragStart={(e) => handleDragStart(e, 'fleet_status')}
            onDragOver={(e) => handleDragOver(e, 'fleet_status')}
            onDrop={(e) => handleDrop(e, 'fleet_status')}
            className={`bg-[var(--bg-surface)] border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
              draggedCardId === 'fleet_status' ? 'opacity-40 border-[var(--primary)] ring-2 ring-[#9494ff]/30' : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Fleet Status</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-lg p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('fleet_status', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('fleet_status', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <Link href="/machines" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View All'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card Content (Chips) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-main)] font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                <span>Active Fleet: {activeMachinesCount} / {machines.length} Online</span>
              </span>

              {machines.map((m) => (
                <Link
                  key={m.id}
                  href="/machines"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-main)] transition shadow-xs group cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-110 transition-transform"></span>
                  <span className="font-mono font-bold text-[var(--text-main)]">{m.machine_no.startsWith('M-') ? m.machine_no : 'M-' + m.machine_no}</span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[var(--text-muted)] font-mono text-2xs">{m.head_count}H</span>
                  <span className="text-emerald-600 font-medium text-2xs">Ready</span>
                </Link>
              ))}

              {machines.length === 0 && !loading && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                  No machines configured
                </span>
              )}
            </div>
          </div>
        );

      case 'production_output':
        return (
          <div
            key="production_output"
            draggable
            onDragStart={(e) => handleDragStart(e, 'production_output')}
            onDragOver={(e) => handleDragOver(e, 'production_output')}
            onDrop={(e) => handleDrop(e, 'production_output')}
            className={`bg-[var(--bg-surface)] border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
              draggedCardId === 'production_output' ? 'opacity-40 border-[var(--primary)] ring-2 ring-[#9494ff]/30' : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Production Output</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-lg p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('production_output', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('production_output', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <Link href="/shift" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.navShiftList || 'Shift Logs'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card Content (Chips) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/shift"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <span className="text-[var(--text-muted)]">Total Meters:</span>
                <strong className="font-mono font-bold text-[var(--text-main)]">{formatNumber(totalMeters)} m</strong>
              </Link>

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-main)] shadow-xs">
                <span className="text-[var(--text-muted)]">Total Stitches:</span>
                <strong className="font-mono font-bold text-[var(--text-main)]">{formatNumber(totalStitches)} st.</strong>
              </span>

              <Link
                href="/shift"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{shifts.length} Shifts Recorded</span>
              </Link>
            </div>
          </div>
        );

      case 'sac_billing':
        return (
          <div
            key="sac_billing"
            draggable
            onDragStart={(e) => handleDragStart(e, 'sac_billing')}
            onDragOver={(e) => handleDragOver(e, 'sac_billing')}
            onDrop={(e) => handleDrop(e, 'sac_billing')}
            className={`bg-[var(--bg-surface)] border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
              draggedCardId === 'sac_billing' ? 'opacity-40 border-[var(--primary)] ring-2 ring-[#9494ff]/30' : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SAC 9988 Billing & Invoices</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-lg p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('sac_billing', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('sac_billing', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <Link href="/invoices" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View All'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card Content (Chips) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/invoices"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <span className="text-[var(--text-muted)]">SAC 9988 Billed:</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalBilled)}</strong>
              </Link>

              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-main)] shadow-xs hover:bg-[var(--bg-surface-elevated)] transition"
                >
                  <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-[var(--text-main)] hover:underline">
                    {inv.invoice_no}
                  </Link>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(inv.net_amount)}</span>
                  <span className="text-[var(--text-muted)] text-2xs truncate max-w-[120px]">{inv.trader_name}</span>
                  <button
                    type="button"
                    onClick={() => OutwardInvoicesApi.downloadPdf(inv.id, inv.invoice_no)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                    title="Download PDF"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {invoices.length === 0 && !loading && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                  No invoices issued yet
                </span>
              )}
            </div>
          </div>
        );

      case 'inward_lots':
        return (
          <div
            key="inward_lots"
            draggable
            onDragStart={(e) => handleDragStart(e, 'inward_lots')}
            onDragOver={(e) => handleDragOver(e, 'inward_lots')}
            onDrop={(e) => handleDrop(e, 'inward_lots')}
            className={`bg-[var(--bg-surface)] border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
              draggedCardId === 'inward_lots' ? 'opacity-40 border-[var(--primary)] ring-2 ring-[#9494ff]/30' : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Inward Lots & Design Progress</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-lg p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('inward_lots', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('inward_lots', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <Link href="/challans" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View All'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Card Content (Chips) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/challans"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
                >
                  <span className="text-[var(--text-muted)]">Inward Lots:</span>
                  <strong className="font-mono font-bold text-[var(--text-main)]">
                    {activeLots.length || challans.length} Active Lots
                  </strong>
                </Link>
              </div>

              {/* Per-Lot Design Progress Clusters */}
              <div className="space-y-2.5 pt-1">
                {activeLots.map((lot) => (
                  <div key={lot.id} className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/challans"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] font-semibold transition shadow-xs cursor-pointer"
                    >
                      <span className="font-mono">{lot.lot_no || lot.challan_no}</span>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span className="text-2xs text-[var(--text-muted)] font-normal truncate max-w-[140px]">{lot.trader_name}</span>
                    </Link>

                    {lot.pending_designs && lot.pending_designs.length > 0 ? (
                      lot.pending_designs.map((d) => {
                        const alloc = Number(d.allocated_meters) || 1;
                        const prod = Number(d.produced_meters) || 0;
                        const pct = Math.min(100, Math.round((prod / alloc) * 100));
                        const isDone = d.is_completed || d.remaining_meters <= 0;

                        return (
                          <span
                            key={d.design_no}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs font-mono transition shadow-xs ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                : pct > 70
                                ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] text-[var(--text-main)]'
                                : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDone ? 'bg-emerald-500' : pct > 0 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                              }`}
                            />
                            <strong className="font-bold">{d.design_no}</strong>
                            <span className="text-[var(--text-muted)]">•</span>
                            <span>
                              {formatNumber(prod)}/{formatNumber(alloc)}m
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-sans font-bold text-[10px] ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : pct > 70
                                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                  : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                              }`}
                            >
                              {isDone ? 'DONE' : `${pct}%`}
                            </span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs font-mono text-[var(--text-muted)]">
                        {lot.inward_meters}m total
                      </span>
                    )}
                  </div>
                ))}

                {activeLots.length === 0 && !loading && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                    No active inward lots available
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-2xs font-semibold uppercase tracking-wider mb-0.5">
            <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{t.factoryOverview || 'Factory Overview'}</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            {activeCompany?.name || t.dash_defaultCompany || 'Surat Embroidery Unit'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            {t.dash_gstinLabel || 'GSTIN'}: {activeCompany?.gstin || '24AAAAA1111A1Z5'} • {t.dash_roleLabel || 'Role'}: {activeCompany?.role || 'COMPANY_ADMIN'}
          </p>
        </div>

        {/* Action Buttons & Layout Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetLayout}
            title="Reset cards to Company 000 default order"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-2xs text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-full font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[var(--text-muted)]" />
            <span>Reset Cards</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer('LOG_SHIFT', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-medium rounded-full text-xs transition shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.navShiftNew || 'Log Shift'}</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer('ADD_CHALLAN', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] font-medium rounded-full text-xs transition shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Truck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{t.dash_inwardLot || t.saveChallan || 'Inward Lot'}</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer('CREATE_INVOICE', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] font-medium rounded-full text-xs transition shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{t.dash_sac9988Bill || t.navInvoices || 'SAC 9988 Bill'}</span>
          </button>
        </div>
      </div>

      {/* Arrangeable Dashboard Cards Grid/Stack */}
      <div className="space-y-4">
        {cardOrder.map((cardId, index) => renderCardContent(cardId, index))}
      </div>
    </div>
  );
}
