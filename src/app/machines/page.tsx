'use client';

import React, { useState, useEffect } from 'react';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function MachinesMasterPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
              <span>મશીન માસ્ટર • Embroidery Machine Fleet</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Machine Fleet ({machines.length})
            </h1>
            <p className="text-xs text-slate-500">
              Heads configuration, operational RPM and production tracking
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_MACHINE', {}, fetchMachines)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Machine</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Active: <strong className="font-bold text-slate-900">{activeCount} / {machines.length} Machines</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Heads: <strong className="font-bold text-slate-900">{totalHeads} Heads</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span>Avg RPM: <strong className="font-bold text-slate-900">{avgRpm} RPM</strong></span>
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
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No machines found. Click &quot;+ Add Machine&quot; to configure.
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
