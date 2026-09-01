'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { formatNumber } from '@/lib/utils';
import {
  Truck,
  Plus,
  Search,
  ArrowRight,
  Scissors,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import { useAppDrawer } from '@/lib/app-drawer-context';

export default function ChallansListPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
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
              className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Inward Lot</span>
            </button>
          </div>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Active Lots on Floor
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {challans.length} <span className="text-xs font-normal text-[var(--text-muted)]">Lots</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Total Gray Fabric Thans
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {totalTakas} <span className="text-xs font-normal text-[var(--text-muted)]">Thans</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
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
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-muted)] font-semibold uppercase text-[0.6875rem]">Production Pipeline</span>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
              <span className="badge-pastel-blue px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
                1. Inward
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="badge-pastel-yellow px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
                2. On Machine
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="badge-pastel-green px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
                3. QA Inspect
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="badge-pastel-blue px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
                4. Dispatched
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-[var(--bg-surface)] p-3 sm:p-4 border border-[var(--border)] rounded-xl shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by lot number, trader name or fabric quality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 border border-[var(--border)] rounded-lg overflow-x-auto text-xs">
            {['ALL', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Challans Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
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
                      className={`px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                        c.status === 'COMPLETED'
                          ? 'badge-pastel-green'
                          : c.status === 'IN_PROGRESS'
                          ? 'badge-pastel-blue'
                          : c.status === 'DISPATCHED'
                          ? 'badge-pastel-yellow'
                          : 'badge-pastel-yellow'
                      }`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDefect(c)}
                      className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium inline-flex items-center gap-1 rounded transition cursor-pointer shadow-xs"
                      title="Log Fabric Flaws, Defective Meters & Yarn Wastage"
                    >
                      <Scissors className="w-3 h-3 text-rose-500" />
                      <span>{inspectedLots[c.lot_no] ? `${inspectedLots[c.lot_no].meters}m Defect` : 'QA Check'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDrawer('CREATE_INVOICE', { challan: c, challanId: c.id, lotNo: c.lot_no }, fetchChallans)}
                      className="px-2.5 py-1 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-medium inline-flex items-center gap-1 rounded transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Generate Bill</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
      </div>
    </div>
  );
}

