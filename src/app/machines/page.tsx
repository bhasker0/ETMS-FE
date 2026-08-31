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
  Wifi,
  Zap,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MachinesMasterPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIotModalOpen, setIsIotModalOpen] = useState(false);

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
    if (!confirm(`Delete Machine ${no}?`)) return;
    try {
      await MachinesApi.delete(id);
      toast.success(`Machine ${no} deleted`);
      fetchMachines();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const filteredMachines = machines.filter((m) =>
    m.machine_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = machines.filter((m) => m.is_active).length;
  const totalHeads = machines.reduce((acc, m) => acc + (m.is_active ? Number(m.head_count) : 0), 0);
  const avgRpm = machines.length > 0 ? Math.round(machines.reduce((acc, m) => acc + (m.rpm || 850), 0) / machines.length) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.activeMachines || 'Embroidery Machine Fleet'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.activeMachines || 'Machine Fleet'} ({machines.length})
            </h1>
            <p className="text-xs text-slate-500">
              Heads configuration, operational RPM and production tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsIotModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 shrink-0"
              title="IoT Edge Counters & MQTT Webhook Integration"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>IoT Gateway</span>
            </button>

            <button
              onClick={() => openDrawer('ADD_MACHINE', {}, fetchMachines)}
              className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ {t.actions || 'Add Machine'}</span>
            </button>
          </div>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.activeFleet || 'Active'}: <strong className="font-bold text-slate-900">{activeCount} / {machines.length} Machines</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.liveHeads || 'Live Heads'}: <strong className="font-bold text-slate-900">{totalHeads} Heads</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span>{t.avgRpm || 'Avg RPM'}: <strong className="font-bold text-slate-900">{avgRpm} RPM</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>IoT MQTT: Online</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search machine by number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Machine Identifier</th>
                <th className="p-3.5">Head Count</th>
                <th className="p-3.5">Speed / RPM</th>
                <th className="p-3.5">IoT Telemetry</th>
                <th className="p-3.5">Make & Model</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredMachines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-2xs font-mono">
                      #{m.machine_no}
                    </div>
                    <span>Machine {m.machine_no}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-2xs font-mono font-medium bg-slate-100 border border-slate-200 text-slate-700">
                      {m.head_count} HEADS
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">{m.rpm || 850} RPM</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live: {m.rpm || 850} RPM
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{m.make_model || 'Standard Tajima Type'}</td>
                  <td className="p-3.5">
                    {m.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-2xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-2xs font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openDrawer('EDIT_MACHINE', { machine: m }, fetchMachines)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-md transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.machine_no)}
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredMachines.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No machines found. Click &quot;+ Add Machine&quot; to configure.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IOT GATEWAY MODAL (SCRUM-139) */}
      {isIotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Radio className="w-5 h-5 animate-pulse" />
                <span>IoT Optical Counter Gateway & MQTT Configuration</span>
              </div>
              <button
                onClick={() => setIsIotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect ESP32 / Raspberry Pi optical pulse counters directly to stream live embroidery stitches into ETMS.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-2xs">
                <div className="text-slate-500 font-bold">MQTT BROKER TOPIC:</div>
                <div className="p-2 bg-white rounded border border-slate-300 text-indigo-700 font-bold select-all">
                  machines/{activeCompany?.id || 'default'}/telemetry
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-2xs">
                <div className="text-slate-500 font-bold">HTTP WEBHOOK INGESTION ENDPOINT:</div>
                <div className="p-2 bg-white rounded border border-slate-300 text-emerald-700 font-bold select-all">
                  POST http://localhost:4000/api/v1/machines/telemetry
                </div>
                <div className="text-slate-500 text-3xs">
                  Payload: &#123; &quot;machine_no&quot;: &quot;01&quot;, &quot;rpm&quot;: 850, &quot;stitches_delta&quot;: 1200 &#125;
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsIotModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Gateway Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
