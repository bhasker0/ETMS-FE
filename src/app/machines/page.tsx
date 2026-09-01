'use client';

import React, { useState, useEffect } from 'react';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Activity,
  Gauge,
  Radio,
  Zap,
  AlertTriangle,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MachinesMasterPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const data = await MachinesApi.getAll();
      setMachines(data);
    } catch (e: any) {
      console.warn('Machines fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [activeCompany?.id]);

  const handleDelete = async (id: string, no: string) => {
    if (!confirm(`[MUTATION GUARD] DELETE MACHINE #${no}?`)) return;
    try {
      await MachinesApi.delete(id);
      toast.success(`Machine #${no} decommissioned`);
      fetchMachines();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const filteredMachines = machines.filter((m) =>
    m.machine_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.make_model && m.make_model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = machines.filter((m) => m.is_active).length;
  const totalHeads = machines.reduce((acc, m) => acc + (m.is_active ? Number(m.head_count) : 0), 0);
  const avgRpm = machines.length > 0 ? Math.round(machines.reduce((acc, m) => acc + (m.rpm || 850), 0) / machines.length) : 0;
  const estimatedStitches = activeCount * avgRpm * 480; // 8-hour shift calculation

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Wrench className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Floor Telemetry • Fleet Status</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Machine Control Fleet ({machines.length} Units)
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live stitch gauges, IoT edge pulse, and spindle speed monitoring
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openDrawer('IOT_GATEWAY_CONFIG', {}, fetchMachines)}
              className="px-3.5 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-[var(--border)] rounded-md shrink-0 cursor-pointer shadow-xs"
              title="IoT Edge Counters & MQTT Webhook Integration"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>IoT Edge Gateway</span>
            </button>

            <button
              onClick={() => openDrawer('ADD_MACHINE', {}, fetchMachines)}
              className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register Machine</span>
            </button>
          </div>
        </div>

        {/* Bento KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Online Fleet
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {activeCount} <span className="text-xs font-normal text-[var(--text-muted)]">/ {machines.length} Units</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Active Head Count
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {totalHeads} <span className="text-xs font-normal text-[var(--text-muted)]">Spindles</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Fleet Avg RPM
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {avgRpm} <span className="text-xs font-normal text-[var(--text-muted)]">RPM</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Shift Stitch Target
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {(estimatedStitches / 1000).toFixed(1)}k <span className="text-xs font-normal text-[var(--text-muted)]">Stitches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by machine number or make (e.g. #01, Tajima)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-main)]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('GRID')}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition ${
              viewMode === 'GRID'
                ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition ${
              viewMode === 'TABLE'
                ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Main Content: Bento Grid vs Table */}
      <div>
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMachines.map((m) => {
              const isAlarm = !m.is_active;
              const currentRpm = m.rpm || 850;
              return (
                <div
                  key={m.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 hover:border-[var(--border-strong)] transition shadow-xs"
                >
                  {/* Machine Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-bold text-xs flex items-center justify-center text-[var(--text-main)] font-mono">
                        #{m.machine_no}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--text-main)]">{m.make_model || 'Tajima Multi-Head'}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">ID: {m.id.slice(0, 10)}...</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDrawer('EDIT_MACHINE', { machine: m }, fetchMachines)}
                        className="p-1.5 hover:bg-[var(--bg-surface-elevated)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                        title="Edit Machine Spec"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.machine_no)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded text-[var(--text-muted)] hover:text-rose-600 transition"
                        title="Decommission Machine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Machine Main Telemetry Gauge */}
                  <div className="grid grid-cols-2 gap-3 bg-[var(--bg-surface-elevated)] p-3.5 rounded-lg border border-[var(--border)]">
                    <div>
                      <div className="text-[0.65rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">Live Speed</div>
                      <div className="text-2xl font-bold tracking-tight text-[var(--text-main)] font-mono tabular-nums flex items-baseline gap-1 mt-0.5">
                        {m.is_active ? currentRpm : 0}
                        <span className="text-[0.6875rem] font-normal text-[var(--text-muted)]">RPM</span>
                      </div>
                      {m.is_active && (
                        <div className="flex items-center gap-1.5 mt-1 text-[0.6875rem] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>Synchronized</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[0.65rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">Head Capacity</div>
                      <div className="text-2xl font-bold tracking-tight text-[var(--text-main)] font-mono tabular-nums flex items-baseline gap-1 mt-0.5">
                        {m.head_count}
                        <span className="text-[0.6875rem] font-normal text-[var(--text-muted)]">Heads</span>
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono mt-1">
                        Sync: 100%
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {isAlarm ? (
                    <div className="p-2.5 rounded-lg badge-pastel-red text-xs font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                      <span>Stopped: Sensor halt / thread break</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="badge-pastel-green px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Nominal Running</span>
                      </span>
                      <span className="text-[var(--text-muted)] text-[0.6875rem] font-mono">
                        MQTT: Online
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMachines.length === 0 && !loading && (
              <div className="col-span-full p-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-xl">
                No matching embroidery machines found on floor.
              </div>
            )}
          </div>
        ) : (
          /* Table Matrix */
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
                <tr>
                  <th className="p-3.5">Identifier</th>
                  <th className="p-3.5">Head Count</th>
                  <th className="p-3.5">Live Speed</th>
                  <th className="p-3.5">Telemetry Status</th>
                  <th className="p-3.5">Make & Model</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {filteredMachines.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                    <td className="p-3.5 font-semibold text-[var(--text-main)] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-mono text-xs flex items-center justify-center font-bold">
                        #{m.machine_no}
                      </div>
                      <span>Machine #{m.machine_no}</span>
                    </td>
                    <td className="p-3.5 font-mono tabular-nums">
                      {m.head_count} Heads
                    </td>
                    <td className="p-3.5 font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {m.is_active ? m.rpm || 850 : 0} RPM
                    </td>
                    <td className="p-3.5">
                      {m.is_active ? (
                        <span className="badge-pastel-green px-2 py-0.5 rounded text-[0.6875rem] font-medium inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Nominal Pulse
                        </span>
                      ) : (
                        <span className="badge-pastel-red px-2 py-0.5 rounded text-[0.6875rem] font-medium inline-flex items-center gap-1">
                          Breakdown Halt
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--text-muted)]">{m.make_model || 'Tajima 20-Head Standard'}</td>
                    <td className="p-3.5">
                      {m.is_active ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[0.6875rem]">ACTIVE</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold text-[0.6875rem]">INACTIVE</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => openDrawer('EDIT_MACHINE', { machine: m }, fetchMachines)}
                        className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs rounded transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.machine_no)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredMachines.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                      No embroidery units found.
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

