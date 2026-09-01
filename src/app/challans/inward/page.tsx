'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InwardChallansApi, CreateInwardChallanDto } from '@/lib/api/challans';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useAuth } from '@/lib/auth-context';
import {
  Truck,
  Save,
  ArrowLeft,
  Plus,
  ShieldCheck,
  MapPin,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InwardChallanFormPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [traderName, setTraderName] = useState('');
  const [traderGstin, setTraderGstin] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotNo, setLotNo] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [thanCount, setThanCount] = useState<number>(24);
  const [inwardMeters, setInwardMeters] = useState<number>(1200);
  const [fabricQuality, setFabricQuality] = useState('Georgette 60g / Heavy Foil');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [notes, setNotes] = useState('Delivered via Sachin GIDC tempo transport');
  const [submitting, setSubmitting] = useState(false);

  const fetchParties = async () => {
    try {
      const list = await PartiesApi.getAll();
      setParties(list);
      if (list.length > 0 && !traderName) {
        setTraderName(list[0].name);
        if (list[0].gstin) setTraderGstin(list[0].gstin);
      }
    } catch (e) {
      console.warn('Parties fetch error in inward challan page:', e);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeCompany?.id]);

  const fabricPresets = [
    'Georgette 60g / Heavy Foil',
    'Rayon 14kg Liva Certified',
    'Pure Cotton Cambric 60s',
    'Japanese Satin Silk',
    'Organza Tissue Net',
    'Jacquard Net Fabric',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim() || !lotNo.trim()) {
      toast.error('[ERROR] Trader Name and Lot Number are mandatory');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateInwardChallanDto = {
        challan_date: challanDate,
        trader_name: traderName,
        trader_gstin: traderGstin,
        lot_no: lotNo,
        than_count: Number(thanCount),
        inward_meters: Number(inwardMeters),
        fabric_quality: fabricQuality,
        design_no: designNo,
        notes,
      };

      await InwardChallansApi.create(payload);
      toast.success(`[COMMITTED] Inward Lot ${lotNo} registered to inventory`);
      router.push('/challans');
    } catch (err: any) {
      toast.error('Failed to create challan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-0.5">
              <Truck className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Fabric Registration • Blueprint</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Register Inward Gray Fabric Lot
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Verification Strip */}
        <div className="p-3.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Inward Gate // Sachin GIDC Receiving Bay 3</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-main)]" />
            <span>Fabric Batch: <strong className="text-[var(--text-main)]">{lotNo}</strong></span>
          </div>
        </div>

        {/* Quick fill traders */}
        <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-2.5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <label className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Registered Trader Directory
            </label>
            <button
              type="button"
              onClick={() =>
                openDrawer('ADD_PARTY', {}, (newParty: PartyApiItem) => {
                  fetchParties();
                  setTraderName(newParty.name);
                  if (newParty.gstin) setTraderGstin(newParty.gstin);
                })
              }
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Trader Account</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setTraderName(p.name);
                  setTraderGstin(p.gstin || '');
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition cursor-pointer ${
                  traderName === p.name
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] shadow-xs'
                    : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Trader Name *</label>
            <input
              type="text"
              required
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Trader GSTIN</label>
            <input
              type="text"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 24ABCDE1234F1Z5"
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono uppercase text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Inward Date *</label>
            <input
              type="date"
              required
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Lot Number *</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Design Pattern / Code</label>
            <input
              type="text"
              placeholder="e.g. DSG-108-ZARI"
              value={designNo}
              onChange={(e) => setDesignNo(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-main)] font-mono uppercase focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Total Thans / Rolls *</label>
            <input
              type="number"
              required
              min="1"
              value={thanCount}
              onChange={(e) => setThanCount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Total Inward Meters *</label>
            <input
              type="number"
              required
              min="1"
              value={inwardMeters}
              onChange={(e) => setInwardMeters(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Fabric Quality Specification *</label>
            <select
              value={fabricQuality}
              onChange={(e) => setFabricQuality(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
            >
              {fabricPresets.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Transporter & Tempo Dispatch Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[var(--text-main)] hover:opacity-90 active:scale-[0.99] text-[var(--bg-surface)] font-semibold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Recording Lot to Inventory...' : 'Commit Inward Challan Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

