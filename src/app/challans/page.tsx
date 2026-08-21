'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { formatNumber } from '@/lib/utils';
import {
  Truck,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from '@/components/ui/drawer';

export default function ChallansListPage() {
  const { activeCompany } = useAuth();
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inward Lot Drawer Form State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [traderName, setTraderName] = useState('Ambaji Fashion Surat');
  const [traderGstin, setTraderGstin] = useState('24BBCDE5678G1Z3');
  const [lotNo, setLotNo] = useState(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [thanCount, setThanCount] = useState<number>(24);
  const [inwardMeters, setInwardMeters] = useState<number>(1200);
  const [fabricQuality, setFabricQuality] = useState('Georgette 60g / Heavy Foil');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [notes, setNotes] = useState('Delivered via Sachin GIDC tempo transport');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim() || !lotNo.trim()) {
      toast.error('Trader Name and Lot Number are required');
      return;
    }
    setSubmitting(true);
    try {
      await InwardChallansApi.create({
        trader_name: traderName,
        trader_gstin: traderGstin,
        lot_no: lotNo,
        than_count: Number(thanCount),
        inward_meters: Number(inwardMeters),
        fabric_quality: fabricQuality,
        design_no: designNo,
        notes,
      });
      toast.success(`Inward Lot ${lotNo} registered successfully`);
      setIsAddDrawerOpen(false);
      fetchChallans();
    } catch (err: any) {
      toast.error('Failed to create challan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
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
              <span>આવક ડિલિવરી ચલણ • Inward Fabric Delivery Challans</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inward Lots ({challans.length})
            </h1>
            <p className="text-xs text-slate-500">
              Raw grey fabric lots from Surat traders with shrinkage tracking
            </p>
          </div>

          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Inward Lot (આવક)</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Truck className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Active Lots: <strong className="font-bold text-slate-900">{challans.length} Lots</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <span>Total Thans: <strong className="font-bold text-amber-800">{totalTakas} Thans (તાકા)</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <span>Inward Length: <strong className="font-bold text-slate-900">{formatNumber(totalMeters)} m</strong></span>
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
              placeholder="Search by lot number, trader name or fabric quality..."
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
                <th className="p-3.5">Lot No</th>
                <th className="p-3.5">Trader (વેપારી)</th>
                <th className="p-3.5">Fabric Quality</th>
                <th className="p-3.5 text-right">Thans (તાકા)</th>
                <th className="p-3.5 text-right">Inward Meters</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
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
                    <div className="text-2xs text-slate-400 font-mono">{c.trader_gstin || 'Unregistered'}</div>
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
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/invoices/new?lot=${c.lot_no}&challanId=${c.id}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-2xs font-medium inline-flex items-center gap-1 transition"
                    >
                      <span>Bill Lot</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No inward challans found. Click &quot;+ Add Inward Lot&quot; to register raw fabric.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Inward Fabric Lot Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Register Inward Fabric Lot (આવક ચલણ)"
        subtitle="સુરત વેપારી પાસેથી મળેલ કાચું કાપડ ચલણ એન્ટ્રી"
        icon={<Truck className="w-5 h-5 text-slate-700" />}
        size="lg"
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('challan-drawer-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={submitting}
              className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
            >
              {submitting ? 'Registering...' : 'Save Inward Lot'}
            </button>
          </div>
        }
      >
        <form id="challan-drawer-form" onSubmit={handleCreateChallan} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Trader Firm Name (વેપારીનું નામ) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ambaji Fashion Surat"
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
              <input
                type="text"
                placeholder="24BBCDE5678G1Z3"
                value={traderGstin}
                onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Lot Number / Batch ID *</label>
              <input
                type="text"
                required
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Than Count (તાકા) *</label>
              <input
                type="number"
                required
                min="1"
                value={thanCount}
                onChange={(e) => setThanCount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Inward Meters Length (m) *</label>
              <input
                type="number"
                required
                min="1"
                value={inwardMeters}
                onChange={(e) => setInwardMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Fabric Quality Specification *</label>
              <input
                type="text"
                required
                placeholder="e.g. Georgette 60g / Heavy Foil"
                value={fabricQuality}
                onChange={(e) => setFabricQuality(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Design / Pattern Code</label>
              <input
                type="text"
                placeholder="DSG-108-ZARI"
                value={designNo}
                onChange={(e) => setDesignNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Transport / Delivery Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Delivered via Sachin GIDC tempo transport"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
