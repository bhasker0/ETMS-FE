'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ShiftLogsApi, ShiftLogApiItem } from '@/lib/api/shift-logs';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  Layers,
  Clock,
  Wrench,
  Truck,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Download,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function FactoryDashboard() {
  const router = useRouter();
  const { user, activeCompany, isAuthenticated, isLoading } = useAuth();
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
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [mList, sList, iList, cList] = await Promise.all([
        MachinesApi.getAll().catch(() => []),
        ShiftLogsApi.getAll().catch(() => []),
        OutwardInvoicesApi.getAll().catch(() => []),
        InwardChallansApi.getAll().catch(() => []),
      ]);
      setMachines(mList);
      setShifts(sList);
      setInvoices(iList);
      setChallans(cList);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeCompany?.id]);

  const totalMeters = shifts.reduce((acc, s) => acc + Number(s.total_meters), 0);
  const totalStitches = shifts.reduce((acc, s) => acc + Number(s.total_stitches), 0);
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.net_amount), 0);
  const activeMachinesCount = machines.filter((m) => m.is_active).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.factoryOverview || 'Factory Overview'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeCompany?.name || t.dash_defaultCompany || 'Surat Embroidery Unit'}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {t.dash_gstinLabel || 'GSTIN'}: {activeCompany?.gstin || '24AAAAA1111A1Z5'} • {t.dash_roleLabel || 'Role'}: {activeCompany?.role || 'COMPANY_ADMIN'}
            </p>
          </div>

          {/* Quick Action Drawer Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openDrawer('LOG_SHIFT', {}, () => fetchDashboardData())}
              className="px-3 py-1.5 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.navShiftNew || 'Log Shift'}</span>
            </button>

            <button
              type="button"
              onClick={() => openDrawer('ADD_CHALLAN', {}, () => fetchDashboardData())}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.dash_inwardLot || t.saveChallan || 'Inward Lot'}</span>
            </button>

            <button
              type="button"
              onClick={() => openDrawer('CREATE_INVOICE', {}, () => fetchDashboardData())}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.dash_sac9988Bill || t.navInvoices || 'SAC 9988 Bill'}</span>
            </button>
          </div>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Wrench className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.activeFleet || 'Active Fleet'}: <strong className="font-bold text-slate-900">{activeMachinesCount} / {machines.length} {t.dash_online || 'Online'}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <TrendingUp className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>{t.totalOutput || 'Total Output'}: <strong className="font-bold text-slate-900">{formatNumber(totalMeters)} {t.dash_metersUnit || 'm'}</strong> <span className="text-2xs">({formatNumber(totalStitches)} {t.dash_stitchesUnit || 'st.'})</span></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <FileText className="w-3.5 h-3.5 text-[#059669]" />
            <span>{t.totalBilled || 'SAC 9988 Billed'}: <strong className="font-bold text-emerald-700">{formatINR(totalBilled)}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <Truck className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{t.navChallans || 'Inward Lots'}: <strong className="font-bold text-amber-800">{challans.length} {t.dash_lotsUnit || 'Lots'}</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Main 2-Column Split: Machine Telemetry & Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Machine Telemetry Grid (2 cols) */}
          <div className="lg:col-span-2 bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.machineFloorStatus || 'Machine Floor Status'}
                </h2>
                <span className="text-2xs text-slate-400 font-mono">
                  {machines.length} {t.unitsConfigured || 'Units Configured'}
                </span>
              </div>
              <Link href="/machines" className="text-2xs text-slate-600 hover:text-slate-900 font-medium">
                {t.viewAll || 'View All'} ➔
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {machines.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-slate-200/80 rounded-lg p-3.5 space-y-2 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
                        #{m.machine_no}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {t.dash_machinePrefix || 'Machine'} {m.machine_no}
                        </div>
                        <div className="text-2xs text-slate-500 font-mono">{m.make_model || t.dash_tajimaType || 'Tajima Type'}</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-2xs font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                      {m.head_count} {t.heads || 'HEADS'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-2xs pt-1 border-t border-slate-200/60 font-mono">
                    <span className="text-slate-500">{m.rpm || 850} RPM</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{t.ready || 'Ready'}</span>
                    </span>
                  </div>
                </div>
              ))}

              {machines.length === 0 && !loading && (
                <div className="sm:col-span-2 p-8 text-center text-slate-400 text-xs">
                  {t.dash_noMachines || 'No machines configured.'}
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices (1 col) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.recentInvoices || 'Recent Invoices'}
                </h2>
                <span className="text-2xs text-slate-400 font-mono">{t.sac9988Tag || 'GST SAC 9988'}</span>
              </div>
              <Link href="/invoices" className="text-2xs text-slate-600 hover:text-slate-900 font-medium">
                {t.viewAll || 'View All'} ➔
              </Link>
            </div>

            <div className="space-y-2">
              {invoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-1 text-xs hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{inv.invoice_no}</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(inv.net_amount)}</span>
                  </div>

                  <div className="text-slate-600 truncate">{inv.trader_name}</div>

                  <div className="flex items-center justify-between text-2xs text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                    <span>{inv.invoice_date}</span>
                    <button
                      onClick={() => OutwardInvoicesApi.downloadPdf(inv.id, inv.invoice_no)}
                      className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{t.dash_downloadPdf || 'PDF'}</span>
                    </button>
                  </div>
                </div>
              ))}

              {invoices.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {t.dash_noInvoices || 'No invoices issued yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
