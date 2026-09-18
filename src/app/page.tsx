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
      router.replace('/login');
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
    if (!isAuthenticated || !activeCompany?.id) return;
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
  }, [isAuthenticated, activeCompany?.id]);

  const { hasCompanyFeature } = useAuth();

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        hasCompanyFeature('machines') ? MachinesApi.getAll().catch(() => []) : Promise.resolve([]),
        hasCompanyFeature('shift_production') ? ShiftLogsApi.getAll().catch(() => []) : Promise.resolve([]),
        hasCompanyFeature('outward_invoices') ? OutwardInvoicesApi.getAll().catch(() => []) : Promise.resolve([]),
        hasCompanyFeature('inward_challans') ? InwardChallansApi.getAll().catch(() => []) : Promise.resolve([]),
        hasCompanyFeature('inward_challans') ? InwardChallansApi.getActivePendingLots().catch(() => []) : Promise.resolve([]),
      ];
      const [mList, sList, iList, cList, aLots] = await Promise.all(promises);
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
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeCompany?.id]);

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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
        <p className="text-xs text-[#777777]">Redirecting to login...</p>
      </div>
    );
  }

  const totalMeters = shifts.reduce((acc, s) => acc + Number(s.total_meters || 0), 0);
  const totalStitches = shifts.reduce((acc, s) => acc + Number(s.total_stitches || 0), 0);
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.net_amount || 0), 0);
  const activeMachinesCount = machines.filter((m) => m.is_active).length;

  // Render Card Content by Identifier
  const renderCardContent = (cardId: string, index: number) => {
    switch (cardId) {
      case 'fleet_status':
        if (!hasCompanyFeature('machines')) return null;
        return (
          <div
            key="fleet_status"
            draggable
            onDragStart={(e) => handleDragStart(e, 'fleet_status')}
            onDragOver={(e) => handleDragOver(e, 'fleet_status')}
            onDrop={(e) => handleDrop(e, 'fleet_status')}
            className={`bg-[var(--bg-surface)] border rounded-xs p-3.5 shadow-xs space-y-2.5 transition-all ${
              draggedCardId === 'fleet_status' ? 'opacity-40 border-[var(--primary)] ring-1 ring-[var(--border-strong)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-1.5">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-[var(--primary)]" />
                  <span>Fleet Status</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-xs p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('fleet_status', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('fleet_status', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <Link href="/machines" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View'}</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Card Content (Square Compact Chips) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-main)] font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-xs bg-[var(--primary)]"></span>
                <span>Active: {activeMachinesCount} / {machines.length}</span>
              </span>

              {machines.map((m) => (
                <Link
                  key={m.id}
                  href="/machines"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-main)] transition shadow-xs group cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 group-hover:scale-110 transition-transform"></span>
                  <span className="font-mono font-bold text-[var(--text-main)]">{m.machine_no.startsWith('M-') ? m.machine_no : 'M-' + m.machine_no}</span>
                  <span className="text-[var(--text-muted)] font-mono text-[0.625rem]">{m.head_count}H</span>
                  <span className="text-emerald-600 font-medium text-[0.625rem]">Ready</span>
                </Link>
              ))}

              {machines.length === 0 && !loading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-muted)]">
                  No machines configured
                </span>
              )}
            </div>
          </div>
        );

      case 'production_output':
        if (!hasCompanyFeature('shift_production')) return null;
        return (
          <div
            key="production_output"
            draggable
            onDragStart={(e) => handleDragStart(e, 'production_output')}
            onDragOver={(e) => handleDragOver(e, 'production_output')}
            onDrop={(e) => handleDrop(e, 'production_output')}
            className={`bg-[var(--bg-surface)] border rounded-xs p-3.5 shadow-xs space-y-2.5 transition-all ${
              draggedCardId === 'production_output' ? 'opacity-40 border-[var(--primary)] ring-1 ring-[var(--border-strong)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-1.5">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[var(--primary)]" />
                  <span>Production Output</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-xs p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('production_output', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('production_output', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <Link href="/shift" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.navShiftList || 'Shifts'}</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Card Content (Square Compact Metrics) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/shift"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-2xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <span className="text-[var(--text-muted)]">Meters:</span>
                <strong className="font-mono font-bold text-[var(--text-main)]">{formatNumber(totalMeters)} m</strong>
              </Link>

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-main)] shadow-xs">
                <span className="text-[var(--text-muted)]">Stitches:</span>
                <strong className="font-mono font-bold text-[var(--text-main)]">{formatNumber(totalStitches)} st.</strong>
              </span>

              <Link
                href="/shift"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <Layers className="w-3 h-3 text-[var(--text-muted)]" />
                <span>{shifts.length} Shifts</span>
              </Link>
            </div>
          </div>
        );

      case 'sac_billing':
        if (!hasCompanyFeature('outward_invoices')) return null;
        return (
          <div
            key="sac_billing"
            draggable
            onDragStart={(e) => handleDragStart(e, 'sac_billing')}
            onDragOver={(e) => handleDragOver(e, 'sac_billing')}
            onDrop={(e) => handleDrop(e, 'sac_billing')}
            className={`bg-[var(--bg-surface)] border rounded-xs p-3.5 shadow-xs space-y-2.5 transition-all ${
              draggedCardId === 'sac_billing' ? 'opacity-40 border-[var(--primary)] ring-1 ring-[var(--border-strong)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-1.5">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>SAC 9988 Billing</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-xs p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('sac_billing', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('sac_billing', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <Link href="/invoices" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View'}</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Card Content (Square Compact List) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-2xs text-[var(--text-main)] transition shadow-xs cursor-pointer"
              >
                <span className="text-[var(--text-muted)]">Billed:</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalBilled)}</strong>
              </Link>

              {invoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[var(--bg-surface)] border border-[var(--border)] text-2xs text-[var(--text-main)] shadow-xs hover:bg-[var(--bg-surface-elevated)] transition"
                >
                  <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-[var(--text-main)] hover:underline">
                    {inv.invoice_no}
                  </Link>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(inv.net_amount)}</span>
                  <button
                    type="button"
                    onClick={() => OutwardInvoicesApi.downloadPdf(inv.id, inv.invoice_no)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                    title="Download PDF"
                  >
                    <Download className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {invoices.length === 0 && !loading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-2xs text-[var(--text-muted)]">
                  No invoices issued
                </span>
              )}
            </div>
          </div>
        );

      case 'inward_lots':
        if (!hasCompanyFeature('inward_challans')) return null;
        return (
          <div
            key="inward_lots"
            draggable
            onDragStart={(e) => handleDragStart(e, 'inward_lots')}
            onDragOver={(e) => handleDragOver(e, 'inward_lots')}
            onDrop={(e) => handleDrop(e, 'inward_lots')}
            className={`bg-[var(--bg-surface)] border rounded-xs p-3.5 shadow-xs space-y-2.5 transition-all ${
              draggedCardId === 'inward_lots' ? 'opacity-40 border-[var(--primary)] ring-1 ring-[var(--border-strong)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-1.5">
                <span title="Drag to rearrange" className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <span className="text-2xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-[var(--primary)]" />
                  <span>Inward Lots & Design Progress ({activeLots.length || challans.length})</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5 bg-[var(--bg-surface-elevated)] rounded-xs p-0.5 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => moveCard('inward_lots', -1)}
                    disabled={index === 0}
                    title="Move Up"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard('inward_lots', 1)}
                    disabled={index === cardOrder.length - 1}
                    title="Move Down"
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs hover:bg-[var(--bg-surface)] transition cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>

                <Link href="/challans" className="text-2xs text-[var(--text-muted)] hover:text-[var(--primary)] font-medium flex items-center gap-0.5 pl-1">
                  <span>{t.viewAll || 'View'}</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>

            {/* Inward Lots Structured High Density Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeLots.slice(0, 4).map((lot) => {
                const totalAlloc = lot.pending_designs?.reduce((acc, d) => acc + (Number(d.allocated_meters) || 0), 0) || Number(lot.inward_meters) || 1;
                const totalProd = lot.pending_designs?.reduce((acc, d) => acc + (Number(d.produced_meters) || 0), 0) || 0;
                const overallPct = Math.min(100, Math.round((totalProd / totalAlloc) * 100));
                const isCompleted = overallPct >= 100;

                return (
                  <div
                    key={lot.id}
                    className="p-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs space-y-1.5 hover:border-[var(--border-strong)] transition"
                  >
                    {/* Row 1: Lot No & Trader + Status */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-2xs text-[var(--text-main)]">
                          {lot.lot_no || lot.challan_no}
                        </span>
                        <span className="text-[var(--text-muted)] text-[0.625rem]">•</span>
                        <span className="text-2xs font-semibold text-[var(--text-main)] truncate max-w-[110px]">
                          {lot.trader_name}
                        </span>
                      </div>

                      <span
                        className={`px-1.5 py-0.2 rounded-xs text-[0.5625rem] font-mono font-semibold uppercase tracking-wider shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/60'
                            : overallPct > 0
                            ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-300/60'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        {isCompleted ? 'Done' : overallPct > 0 ? `${overallPct}%` : 'Inward'}
                      </span>
                    </div>

                    {/* Row 2: Telemetry Specs & Inline Progress */}
                    <div className="flex items-center justify-between gap-2 text-[0.625rem] font-mono">
                      <span className="text-[var(--text-muted)] truncate">{lot.fabric_quality || 'Gray Fabric'}</span>
                      <span className="font-semibold text-[var(--text-main)] shrink-0">{lot.inward_meters}m</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-[var(--primary)]'
                        }`}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {activeLots.length === 0 && !loading && (
                <div className="col-span-full p-3 text-center text-2xs text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xs">
                  No active inward fabric lots on floor.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[0.625rem] font-semibold uppercase tracking-wider mb-0.5">
            <Activity className="w-3 h-3 text-[var(--primary)]" />
            <span>{t.factoryOverview || 'Factory Overview'}</span>
          </div>
          <h1 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
            {activeCompany?.name || t.dash_defaultCompany || 'Surat Embroidery Unit'}
          </h1>
          <p className="text-2xs text-[var(--text-muted)] font-mono">
            {t.dash_gstinLabel || 'GSTIN'}: {activeCompany?.gstin || '24AAAAA1111A1Z5'} • {t.dash_roleLabel || 'Role'}: {activeCompany?.role || 'COMPANY_ADMIN'}
          </p>
        </div>

        {/* Action Buttons & Layout Reset */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={resetLayout}
            title="Reset cards to Company 000 default order"
            className="inline-flex items-center gap-1 px-2 py-1 text-2xs text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xs font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5 text-[var(--text-muted)]" />
            <span>{(t as unknown as Record<string, string>).resetLayout || 'Reset'}</span>
          </button>

          {hasCompanyFeature('shift_production') && (
            <button
              type="button"
              onClick={() => openDrawer('LOG_SHIFT', {}, () => fetchDashboardData())}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-medium rounded-xs text-2xs transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3 h-3" />
              <span>{t.navShiftNew || 'Log Shift'}</span>
            </button>
          )}

          {hasCompanyFeature('inward_challans') && (
            <button
              type="button"
              onClick={() => openDrawer('ADD_CHALLAN', {}, () => fetchDashboardData())}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] font-medium rounded-xs text-2xs transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Truck className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{t.dash_inwardLot || t.saveChallan || 'Inward Lot'}</span>
            </button>
          )}

          {hasCompanyFeature('outward_invoices') && (
            <button
              type="button"
              onClick={() => openDrawer('CREATE_INVOICE', {}, () => fetchDashboardData())}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] font-medium rounded-xs text-2xs transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <FileText className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{t.dash_sac9988Bill || t.navInvoices || 'SAC 9988 Bill'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Arrangeable Dashboard Cards High-Density 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cardOrder.map((cardId, index) => renderCardContent(cardId, index))}
      </div>
    </div>
  );
}
