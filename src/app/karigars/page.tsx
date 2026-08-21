'use client';

import React, { useState, useEffect } from 'react';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR } from '@/lib/utils';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function KarigarsMasterPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchKarigars = async () => {
    setLoading(true);
    try {
      const data = await KarigarsApi.getAll();
      setKarigars(data);
    } catch (e: any) {
      console.warn('Karigars fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKarigars();
  }, [activeCompany?.id]);

  const handleDelete = async (id: string, kName: string) => {
    if (!confirm(`Delete Karigar ${kName}?`)) return;
    try {
      await KarigarsApi.delete(id);
      toast.success(`Karigar ${kName} deleted`);
      fetchKarigars();
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const filtered = karigars.filter(
    (k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.mobile.includes(searchTerm)
  );

  const activeCount = karigars.filter((k) => k.is_active).length;
  const pieceRateCount = karigars.filter((k) => k.wage_type === 'PIECE_RATE').length;
  const fixedSalaryCount = karigars.filter((k) => k.wage_type === 'FIXED_MONTHLY').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>કારીગર માસ્ટર • Karigar & Operator Master</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Karigars ({karigars.length})
            </h1>
            <p className="text-xs text-slate-500">
              Wage rates, piece-rate per meter, monthly salary structure
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_KARIGAR', {}, fetchKarigars)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Karigar</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Users className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Active: <strong className="font-bold text-slate-900">{activeCount} Karigars</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Piece Rate: <strong className="font-bold text-slate-900">{pieceRateCount}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span>Fixed Monthly: <strong className="font-bold text-slate-900">{fixedSalaryCount}</strong></span>
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
            placeholder="Search karigar by name or mobile..."
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
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">Wage Type</th>
                <th className="p-3.5">Rate / Salary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-medium text-slate-900">{k.name}</td>
                  <td className="p-3.5 font-mono text-slate-600">{k.mobile}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                        k.wage_type === 'PIECE_RATE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {k.wage_type === 'PIECE_RATE' ? 'Piece Rate (ટાંકા દર)' : 'Monthly Fixed'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-medium text-slate-800">
                    {k.wage_type === 'PIECE_RATE'
                      ? `₹${k.default_rate_per_meter || 0.18} / meter`
                      : formatINR(k.default_monthly_salary || 18000)}
                  </td>
                  <td className="p-3.5">
                    {k.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-2xs">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400 text-2xs">Inactive</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openDrawer('EDIT_KARIGAR', { karigar: k }, fetchKarigars)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-md transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(k.id, k.name)}
                      className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No karigars found. Click &quot;+ Add New Karigar&quot; to register operators.
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
