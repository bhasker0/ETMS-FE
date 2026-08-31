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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>વેપારી ડિરેક્ટરી • Party & Trader Master</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Parties / Traders ({parties.length})
            </h1>
            <p className="text-xs text-slate-500">
              Fabric suppliers, textile traders, GSTIN records, and credit terms
            </p>
          </div>

          <button
            onClick={() => openDrawer('ADD_PARTY', {}, fetchParties)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Party</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Active: <strong className="font-bold text-slate-900">{activeCount} Traders</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gujarat GSTIN (24): <strong className="font-bold text-slate-900">{gstinCount}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Unregistered / URP: <strong className="font-bold text-slate-900">{urpCount}</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2 max-w-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search party name, GSTIN, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-900 focus:outline-none w-full"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading parties...</div>
        ) : parties.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Parties Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your textile merchants and trading firms to auto-fill GSTINs on challans and invoices.
            </p>
            <button
              onClick={() => openDrawer('ADD_PARTY', {}, fetchParties)}
              className="px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add First Party</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Trader / Firm Name</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5">Mobile / Phone</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5">Credit Period</th>
                  <th className="p-3.5">Opening Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {parties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <Link
                        href={`/parties/${p.id}`}
                        className="font-bold text-slate-900 hover:text-[#0099B8] transition block"
                      >
                        {p.name}
                      </Link>
                      {p.address && <div className="text-2xs text-slate-400 truncate max-w-xs">{p.address}</div>}
                    </td>
                    <td className="p-3.5">
                      {p.gstin ? (
                        <span className="font-mono text-2xs bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">
                          {p.gstin}
                        </span>
                      ) : (
                        <span className="text-2xs text-slate-400 italic">Unregistered</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {p.mobile ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.mobile}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700">{p.city || 'Surat'}</td>
                    <td className="p-3.5 text-slate-700">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{p.credit_period_days} days</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-800">
                      {formatINR(Number(p.opening_balance))}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/parties/${p.id}`}
                          className="p-1.5 hover:bg-sky-50 text-sky-600 rounded-md transition"
                          title="View Ledger Statement / Khata"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openDrawer('EDIT_PARTY', { party: p }, fetchParties)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition"
                          title="Edit Party"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition"
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
