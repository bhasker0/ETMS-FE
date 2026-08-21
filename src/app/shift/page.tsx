'use client';

import React, { useState, useEffect } from 'react';
import { ShiftLogsApi, ShiftLogApiItem, DowntimeAnalytics } from '@/lib/api/shift-logs';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatNumber } from '@/lib/utils';
import {
  Clock,
  Plus,
  Search,
  Sun,
  Moon,
  Activity,
  TrendingUp,
} from 'lucide-react';

export default function ShiftLogsListPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [shifts, setShifts] = useState<ShiftLogApiItem[]>([]);
  const [downtimeStats, setDowntimeStats] = useState<DowntimeAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const [sList, dStats] = await Promise.all([
        ShiftLogsApi.getAll(),
        ShiftLogsApi.getDowntimeAnalytics().catch(() => []),
      ]);
      setShifts(sList);
      setDowntimeStats(dStats);
    } catch (e: any) {
      console.warn('Shift logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [activeCompany?.id]);

  const filtered = shifts.filter((s) => {
    const matchesSearch =
      (s.machine?.machine_no && s.machine.machine_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.karigar?.name && s.karigar.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.design_no && s.design_no.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = shiftFilter === 'ALL' || s.shift_type === shiftFilter;
    return matchesSearch && matchesShift;
  });

  const totalMetersToday = filtered.reduce((acc, s) => acc + Number(s.total_meters), 0);
  const totalStitchesToday = filtered.reduce((acc, s) => acc + Number(s.total_stitches), 0);
  const totalDowntimeMinutes = filtered.reduce((acc, s) => acc + (s.downtime_minutes || 0), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>દૈનિક શિફ્ટ કાઉન્ટર • Daily Production Counter Logs</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Shift Production Registry ({shifts.length})
            </h1>
            <p className="text-xs text-slate-500">
              Day & Night production telemetry, stitch tallies and machine downtime tracking
            </p>
          </div>

          <button
            onClick={() => openDrawer('LOG_SHIFT', {}, fetchShifts)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Shift Counter</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <TrendingUp className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Total Output: <strong className="font-bold text-slate-900">{formatNumber(totalMetersToday)} m</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Total Stitches: <strong className="font-bold text-slate-900">{formatNumber(totalStitchesToday)} st.</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <Activity className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Total Downtime: <strong className="font-bold text-rose-700">{totalDowntimeMinutes} min</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Downtime Analytics Widget */}
        {downtimeStats.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Downtime Analytics (ખામી વિશ્લેષણ)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {downtimeStats.map((d, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-lg space-y-0.5">
                  <div className="text-2xs text-slate-600 truncate">{d.reason}</div>
                  <div className="text-sm font-bold text-rose-600 font-mono">{d.total_minutes} min</div>
                  <div className="text-2xs text-slate-400">{d.incident_count} incidents</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by machine number, karigar name or design code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
            {['ALL', 'DAY', 'NIGHT'].map((st) => (
              <button
                key={st}
                onClick={() => setShiftFilter(st)}
                className={`px-3 py-1 rounded text-2xs font-medium transition ${
                  shiftFilter === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Shifts Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="p-3.5">Date & Shift</th>
                <th className="p-3.5">Machine</th>
                <th className="p-3.5">Karigar</th>
                <th className="p-3.5 text-right">Counter (Start ➔ End)</th>
                <th className="p-3.5 text-right">Total Stitches</th>
                <th className="p-3.5 text-right">Meters Output</th>
                <th className="p-3.5 text-center">Downtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono text-slate-600">
                    <div className="flex items-center gap-1.5">
                      {s.shift_type === 'DAY' ? (
                        <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          <Sun className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Moon className="w-3 h-3" />
                        </span>
                      )}
                      <span>{s.shift_date}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    Machine #{s.machine?.machine_no || '1'}
                    <span className="text-2xs text-slate-400 font-normal block font-mono">
                      {s.machine?.head_count || 32} Heads
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-slate-900">{s.karigar?.name || 'Operator'}</div>
                    <div className="text-2xs text-slate-400">{s.design_no || 'Standard Pattern'}</div>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500">
                    {formatNumber(s.start_counter)} ➔ {formatNumber(s.end_counter)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold text-slate-900">
                    {formatNumber(s.total_stitches)} st.
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    {formatNumber(s.total_meters)} m
                  </td>
                  <td className="p-3.5 text-center">
                    {s.downtime_minutes > 0 ? (
                      <span className="px-2 py-0.5 rounded text-2xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        {s.downtime_minutes}m ({s.downtime_reason || 'Stop'})
                      </span>
                    ) : (
                      <span className="text-2xs text-slate-400">0 min</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No shift logs found. Click &quot;+ Log Shift Counter&quot; to add a new shift log.
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
