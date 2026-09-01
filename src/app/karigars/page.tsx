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
  const hybridCount = karigars.filter((k) => k.wage_type === 'FIXED_PLUS_INCENTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Karigar Roster • Master Directory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Operators & Karigar Profiles ({karigars.length} Enrolled)
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Embroidery machine operators, wage basis models, and mobile contacts
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_KARIGAR', {}, fetchKarigars)}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Operator</span>
          </button>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Active Roster
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {activeCount} <span className="text-xs font-normal text-[var(--text-muted)]">Active</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Piece-Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {pieceRateCount} <span className="text-xs font-normal text-[var(--text-muted)]">Operators</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Fixed Salary
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {fixedSalaryCount} <span className="text-xs font-normal text-[var(--text-muted)]">Operators</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Hybrid Bonus
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {hybridCount} <span className="text-xs font-normal text-[var(--text-muted)]">Operators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by operator name or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>
        </div>

        {/* Table Matrix */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
              <tr>
                <th className="p-3.5">Operator Name</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Wage Model</th>
                <th className="p-3.5">Compensation Matrix</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-sans">
              {filtered.map((k) => (
                <tr key={k.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                  <td className="p-3.5 font-semibold text-[var(--text-main)]">{k.name}</td>
                  <td className="p-3.5 font-mono text-[var(--text-muted)]">{k.mobile}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                        k.wage_type === 'PIECE_RATE'
                          ? 'badge-pastel-green'
                          : k.wage_type === 'FIXED_PLUS_INCENTIVE'
                          ? 'badge-pastel-blue'
                          : 'badge-pastel-yellow'
                      }`}
                    >
                      {k.wage_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-main)] font-medium">
                    {k.wage_type === 'PIECE_RATE' && (
                      <span>₹{k.default_rate_per_meter || 0.18} / meter</span>
                    )}
                    {k.wage_type === 'FIXED_MONTHLY' && (
                      <span>{formatINR(k.default_monthly_salary || 18000)} / month</span>
                    )}
                    {k.wage_type === 'FIXED_PLUS_INCENTIVE' && (
                      <div>
                        <div>{formatINR(k.default_monthly_salary || 18000)} / month</div>
                        <div className="text-[0.6875rem] text-emerald-600 dark:text-emerald-400">
                          + ₹{k.incentive_rate || 0.25} / {k.incentive_rate_type} above {(k.incentive_threshold_value || 100000).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    {k.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openDrawer('EDIT_KARIGAR', { karigar: k }, fetchKarigars)}
                      className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(k.id, k.name)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                    No operators found matching search filter.
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


