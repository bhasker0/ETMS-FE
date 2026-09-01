'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR } from '@/lib/utils';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Building2,
  Phone,
  CreditCard,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PartiesMasterPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchParties = async () => {
    setLoading(true);
    try {
      const data = await PartiesApi.getAll({ search: searchTerm });
      setParties(data);
    } catch (e: any) {
      console.warn('Parties fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeCompany?.id, searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate Party "${name}"?`)) return;
    try {
      await PartiesApi.delete(id);
      toast.success(`Party ${name} deactivated`);
      fetchParties();
    } catch (err: any) {
      toast.error('Failed to delete party: ' + err.message);
    }
  };

  const activeCount = parties.filter((p) => p.is_active).length;
  const gstinCount = parties.filter((p) => p.gstin && p.gstin.startsWith('24')).length;
  const urpCount = parties.filter((p) => !p.gstin || !p.gstin.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Briefcase className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Trader Master Roster • Client Khata Directory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Registered Traders & Job Work Parties
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Credit terms, GST status, and direct ledger statement links
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_PARTY', {}, fetchParties)}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Trader Party</span>
          </button>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Active Trader Clients
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {activeCount} <span className="text-xs font-normal text-[var(--text-muted)]">Parties</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Registered GSTIN Accounts
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {gstinCount} <span className="text-xs font-normal text-[var(--text-muted)]">GST Reg</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Unregistered / Composition
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {urpCount} <span className="text-xs font-normal text-[var(--text-muted)]">URP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trader name, GSTIN or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading directory...</div>
        ) : parties.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
            <Briefcase className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">No Parties Registered</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Add your first textile broker or fabric trader account to start logging inward challans.
            </p>
            <button
              onClick={() => openDrawer('ADD_PARTY', {}, fetchParties)}
              className="px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs rounded-md inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Party</span>
            </button>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
                <tr>
                  <th className="p-3.5">Trader Name</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Contact Mobile</th>
                  <th className="p-3.5">Location / City</th>
                  <th className="p-3.5">Credit Period</th>
                  <th className="p-3.5">Opening Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                    <td className="p-3.5">
                      <Link
                        href={`/parties/${p.id}`}
                        className="font-semibold text-[var(--text-main)] hover:underline block"
                      >
                        {p.name}
                      </Link>
                      {p.address && <div className="text-[0.6875rem] text-[var(--text-muted)] truncate max-w-xs">{p.address}</div>}
                    </td>
                    <td className="p-3.5">
                      {p.gstin ? (
                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {p.gstin}
                        </span>
                      ) : (
                        <span className="text-[0.6875rem] text-[var(--text-muted)] italic">Unregistered</span>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--text-main)] font-mono">
                      {p.mobile ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{p.mobile}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--text-main)]">{p.city || 'Surat'}</td>
                    <td className="p-3.5 text-[var(--text-main)] font-mono">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{p.credit_period_days} Days</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-[var(--text-main)] tabular-nums">
                      {formatINR(Number(p.opening_balance))}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                          p.is_active
                            ? 'badge-pastel-green'
                            : 'badge-pastel-yellow'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/parties/${p.id}`}
                          className="px-2 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-emerald-600 dark:text-emerald-400 border border-[var(--border)] text-xs font-semibold rounded transition shadow-xs"
                          title="View Statement & Khata Ledger"
                        >
                          Khata
                        </Link>
                        <button
                          onClick={() => openDrawer('EDIT_PARTY', { party: p }, fetchParties)}
                          className="p-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded transition cursor-pointer shadow-xs"
                          title="Edit Party"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded transition cursor-pointer shadow-xs"
                          title="Deactivate Party"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

