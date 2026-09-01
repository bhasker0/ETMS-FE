'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ShiftLogsApi, ShiftLogApiItem } from '@/lib/api/shift-logs';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { InwardChallansApi, InwardChallanApiItem, ActivePendingLotItem } from '@/lib/api/challans';
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

  const totalMeters = shifts.reduce((acc, s) => acc + Number(s.total_meters || 0), 0);
  const totalStitches = shifts.reduce((acc, s) => acc + Number(s.total_stitches || 0), 0);
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.net_amount || 0), 0);
  const activeMachinesCount = machines.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 text-2xs font-semibold uppercase tracking-wider mb-0.5">
            <Activity className="w-3.5 h-3.5 text-[#0099B8]" />
            <span>{t.factoryOverview || 'Factory Overview'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeCompany?.name || t.dash_defaultCompany || 'Surat Embroidery Unit'}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            {t.dash_gstinLabel || 'GSTIN'}: {activeCompany?.gstin || '24AAAAA1111A1Z5'} • {t.dash_roleLabel || 'Role'}: {activeCompany?.role || 'COMPANY_ADMIN'}
          </p>
        </div>

        {/* Action Chips */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openDrawer('LOG_SHIFT', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-full text-xs transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.navShiftNew || 'Log Shift'}</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer('ADD_CHALLAN', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-full text-xs transition shadow-xs cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.dash_inwardLot || t.saveChallan || 'Inward Lot'}</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer('CREATE_INVOICE', {}, () => fetchDashboardData())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-full text-xs transition shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.dash_sac9988Bill || t.navInvoices || 'SAC 9988 Bill'}</span>
          </button>
        </div>
      </div>

      {/* Chip Section 1: Fleet Status Chips (Replaces Machine Floor Status Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-sky-600" />
            <span>Fleet Status</span>
          </span>
          <Link href="/machines" className="text-2xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-0.5">
            <span>{t.viewAll || 'View All'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fleet Summary Chip */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-900 font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Active Fleet: {activeMachinesCount} / {machines.length} Online</span>
          </span>

          {/* Individual Machine Status Chips */}
          {machines.map((m) => (
            <Link
              key={m.id}
              href="/machines"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-800 transition shadow-2xs group cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-110 transition-transform"></span>
              <span className="font-mono font-bold text-slate-900">{m.machine_no.startsWith('M-') ? m.machine_no : 'M-' + m.machine_no}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-mono text-2xs">{m.head_count}H</span>
              <span className="text-emerald-700 font-medium text-2xs">Ready</span>
            </Link>
          ))}

          {machines.length === 0 && !loading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-400">
              No machines configured
            </span>
          )}
        </div>
      </div>

      {/* Chip Section 2: Production Output Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span>Production Output</span>
          </span>
          <Link href="/shift" className="text-2xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-0.5">
            <span>{t.shiftLogsTitle || 'Shift Logs'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Total Meters Output Chip */}
          <Link
            href="/shift"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100/70 border border-blue-200 text-xs text-blue-900 transition shadow-2xs cursor-pointer"
          >
            <span className="text-slate-600">Total Meters:</span>
            <strong className="font-mono font-bold text-blue-900">{formatNumber(totalMeters)} m</strong>
          </Link>

          {/* Stitches Count Chip */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 shadow-2xs">
            <span className="text-slate-600">Total Stitches:</span>
            <strong className="font-mono font-bold text-indigo-900">{formatNumber(totalStitches)} st.</strong>
          </span>

          {/* Total Shifts Count Chip */}
          <Link
            href="/shift"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-800 transition shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{shifts.length} Shifts Recorded</span>
          </Link>
        </div>
      </div>

      {/* Chip Section 3: Billing & Invoices Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-emerald-600" />
            <span>SAC 9988 Billing & Invoices</span>
          </span>
          <Link href="/invoices" className="text-2xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-0.5">
            <span>{t.viewAll || 'View All'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Total SAC 9988 Billed Chip */}
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-xs text-emerald-900 transition shadow-2xs cursor-pointer"
          >
            <span className="text-slate-600">SAC 9988 Billed:</span>
            <strong className="font-mono font-bold text-emerald-800">{formatINR(totalBilled)}</strong>
          </Link>

          {/* Recent Invoices as Chips */}
          {invoices.slice(0, 5).map((inv) => (
            <div
              key={inv.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs hover:bg-slate-50 transition"
            >
              <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-slate-900 hover:underline">
                {inv.invoice_no}
              </Link>
              <span className="font-mono font-semibold text-emerald-700">{formatINR(inv.net_amount)}</span>
              <span className="text-slate-400 text-2xs truncate max-w-[120px]">{inv.trader_name}</span>
              <button
                type="button"
                onClick={() => OutwardInvoicesApi.downloadPdf(inv.id, inv.invoice_no)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Download PDF"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          ))}

          {invoices.length === 0 && !loading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-400">
              No invoices issued yet
            </span>
          )}
        </div>
      </div>

      {/* Chip Section 4: Inward Lots & Design Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3 h-3 text-amber-600" />
            <span>Inward Lots & Design Progress</span>
          </span>
          <Link href="/challans" className="text-2xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-0.5">
            <span>{t.viewAll || 'View All'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Active Lots Summary Chip */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/challans"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-xs text-amber-900 transition shadow-2xs cursor-pointer"
          >
            <span className="text-slate-600">Inward Lots:</span>
            <strong className="font-mono font-bold text-amber-900">
              {activeLots.length || challans.length} Active Lots
            </strong>
          </Link>
        </div>

        {/* Per-Lot Design Progress Clusters */}
        <div className="space-y-2.5 pt-1">
          {activeLots.map((lot) => (
            <div key={lot.id} className="flex flex-wrap items-center gap-2">
              {/* Lot Identifier Chip */}
              <Link
                href="/challans"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-xs text-slate-900 font-semibold transition shadow-2xs cursor-pointer"
              >
                <span className="font-mono">{lot.lot_no || lot.challan_no}</span>
                <span className="text-slate-400">•</span>
                <span className="text-2xs text-slate-600 font-normal truncate max-w-[140px]">{lot.trader_name}</span>
              </Link>

              {/* Individual Design Progress Chips */}
              {lot.pending_designs && lot.pending_designs.length > 0 ? (
                lot.pending_designs.map((d) => {
                  const alloc = Number(d.allocated_meters) || 1;
                  const prod = Number(d.produced_meters) || 0;
                  const pct = Math.min(100, Math.round((prod / alloc) * 100));
                  const isDone = d.is_completed || d.remaining_meters <= 0;

                  return (
                    <span
                      key={d.design_no}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs font-mono transition shadow-2xs ${
                        isDone
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : pct > 70
                          ? 'bg-sky-50 border-sky-200 text-sky-900'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDone ? 'bg-emerald-500' : pct > 0 ? 'bg-[#0099B8]' : 'bg-slate-300'
                        }`}
                      />
                      <strong className="font-bold">{d.design_no}</strong>
                      <span className="text-slate-400">•</span>
                      <span>
                        {formatNumber(prod)}/{formatNumber(alloc)}m
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-sans font-bold text-[10px] ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : pct > 70
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isDone ? 'DONE' : `${pct}%`}
                      </span>
                    </span>
                  );
                })
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-2xs font-mono text-slate-500">
                  {lot.inward_meters}m total
                </span>
              )}
            </div>
          ))}

          {activeLots.length === 0 && !loading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-400">
              No active inward lots available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
