'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import {
  Truck,
  Plus,
  Search,
  ArrowRight,
  Scissors,
} from 'lucide-react';
import { useAppDrawer } from '@/lib/app-drawer-context';

export default function ChallansListPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.challan_headerBadge}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.challan_title} ({challans.length})
            </h1>
            <p className="text-xs text-slate-500">
              {t.challan_subtitle}
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_CHALLAN', {}, fetchChallans)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.challan_addNew}</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Truck className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.challan_activeChip} <strong className="font-bold text-slate-900">{challans.length}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <span>{t.challan_thansChip} <strong className="font-bold text-amber-800">{totalTakas}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <span>{t.challan_inwardLengthChip} <strong className="font-bold text-slate-900">{formatNumber(totalMeters)} m</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.challan_searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto text-xs">
            {['ALL', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'DISPATCHED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-2xs font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Challans Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-3.5">{t.challan_thLotNo}</th>
                <th className="p-3.5">{t.challan_thTrader}</th>
                <th className="p-3.5">{t.challan_thQuality}</th>
                <th className="p-3.5 text-right">{t.challan_thThans}</th>
                <th className="p-3.5 text-right">{t.challan_thMeters}</th>
                <th className="p-3.5 text-center">{t.challan_thStatus}</th>
                <th className="p-3.5 text-right">{t.challan_thAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {c.lot_no}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{c.trader_name}</div>
                    <div className="text-2xs text-slate-400 font-mono">{c.trader_gstin || t.challan_unregistered}</div>
                  </td>
                  <td className="p-3.5 text-slate-600">{c.fabric_quality}</td>
                  <td className="p-3.5 text-right font-mono text-slate-800">{c.than_count}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    {formatNumber(c.inward_meters)} m
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-2xs font-mono font-medium border ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : c.status === 'DISPATCHED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDefect(c)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-2xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                      title="Log Fabric Flaws, Defective Meters & Yarn Wastage"
                    >
                      <Scissors className="w-3 h-3 text-amber-600" />
                      <span>{inspectedLots[c.lot_no] ? `${inspectedLots[c.lot_no].meters}m ${t.challan_defectLogged}` : t.challan_defectCheck}</span>
                    </button>

                    <Link
                      href={`/invoices/new?lot=${c.lot_no}&challanId=${c.id}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-2xs font-medium inline-flex items-center gap-1 transition"
                    >
                      <span>{t.challan_billLot}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {t.challan_noChallans}
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
