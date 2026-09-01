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
  Layers,
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
  }, []);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchShifts();
    }
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Shift Telemetry • Production Log</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Shift Logs & Meter Archive ({shifts.length} Entries)
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Day & Night production tallies, Karigar piece-rates, and spindle downtime logs
            </p>
          </div>

          <button
            onClick={() => openDrawer('LOG_SHIFT', {}, fetchShifts)}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Shift Counter</span>
          </button>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Total Meters Output
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {formatNumber(totalMetersToday)} <span className="text-xs font-normal text-[var(--text-muted)]">Meters</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Cumulative Stitch Tally
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {formatNumber(totalStitchesToday)} <span className="text-xs font-normal text-[var(--text-muted)]">Stitches</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Recorded Downtime
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight font-mono tabular-nums mt-1">
              {totalDowntimeMinutes} <span className="text-xs font-normal text-[var(--text-muted)]">Minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Downtime Analytics Block */}
        {downtimeStats.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[var(--text-main)]" />
              <span>Downtime Incident Analytics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {downtimeStats.map((d, idx) => (
                <div key={idx} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-3 space-y-1">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium truncate">{d.reason}</div>
                  <div className="text-base font-bold text-[var(--text-main)] font-mono tabular-nums">{d.total_minutes} min</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">{d.incident_count} stops</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by machine number, karigar name or design code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-[var(--bg-surface-elevated)] p-1 rounded-md border border-[var(--border)]">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'DAY', label: 'Day' },
              { key: 'NIGHT', label: 'Night' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setShiftFilter(key)}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  shiftFilter === key
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shifts Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
              <tr>
                <th className="p-3.5">Date & Shift</th>
                <th className="p-3.5">Machine Spec</th>
                <th className="p-3.5">Karigar & Design</th>
                <th className="p-3.5 text-right">Meter Range</th>
                <th className="p-3.5 text-right">Total Stitches</th>
                <th className="p-3.5 text-right">Meters Output</th>
                <th className="p-3.5 text-center">Downtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-sans">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                  <td className="p-3.5 font-medium text-[var(--text-main)]">
                    <div className="flex items-center gap-2">
                      {s.shift_type === 'DAY' ? (
                        <span className="badge-pastel-yellow px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                          DAY
                        </span>
                      ) : (
                        <span className="badge-pastel-blue px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                          NIGHT
                        </span>
                      )}
                      <span className="font-mono text-xs">{s.shift_date}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-[var(--text-main)]">
                    <div className="font-semibold">Machine #{s.machine?.machine_no || '1'}</div>
                    <span className="text-[0.6875rem] text-[var(--text-muted)] block font-mono">
                      {s.machine?.head_count || 32} Heads • {(s.machine as any)?.rpm || 850} RPM
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-[var(--text-main)]">{s.karigar?.name || 'Operator'}</div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">{s.design_no || 'Standard Pattern'}</div>
                  </td>
                  <td className="p-3.5 text-right font-mono text-[var(--text-muted)] tabular-nums">
                    {formatNumber(s.start_counter)} → {formatNumber(s.end_counter)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)] tabular-nums">
                    {formatNumber(s.total_stitches)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatNumber(s.total_meters)} m
                  </td>
                  <td className="p-3.5 text-center">
                    {s.downtime_minutes > 0 ? (
                      <span className="badge-pastel-red px-2 py-0.5 rounded text-[0.6875rem] font-medium inline-block font-mono">
                        {s.downtime_minutes}m ({s.downtime_reason || 'Stop'})
                      </span>
                    ) : (
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">0 min</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    No shift production records found.
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

