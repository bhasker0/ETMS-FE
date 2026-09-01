'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InwardChallansApi, CreateInwardChallanDto } from '@/lib/api/challans';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import {
  Truck,
  Save,
  ArrowLeft,
  Briefcase,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InwardChallanFormPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();

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
      toast.error('Trader Name and Lot Number are required');
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
      toast.success(`Inward Lot ${lotNo} registered`);
      router.push('/challans');
    } catch (err: any) {
      toast.error('Failed to create challan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.challan_headerBadge}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.challan_inwardPageTitle}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        {/* Quick fill traders */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.challan_selectRegisteredTrader}
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
              className="text-xs font-semibold text-[#0099B8] hover:text-[#0E7090] inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.party_addNew}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {parties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setTraderName(p.name);
                  setTraderGstin(p.gstin || '');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  traderName === p.name
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelTrader}</label>
            <input
              type="text"
              required
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardDate}</label>
            <input
              type="date"
              required
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelGstin}</label>
            <input
              type="text"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelLotNo}</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
            />
          </div>
        </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelThanCount}</label>
            <input
              type="number"
              required
              min="1"
              value={thanCount}
              onChange={(e) => setThanCount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardMeters}</label>
            <input
              type="number"
              required
              min="1"
              value={inwardMeters}
              onChange={(e) => setInwardMeters(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelQuality}</label>
            <select
              value={fabricQuality}
              onChange={(e) => setFabricQuality(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              {fabricPresets.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelDesignNo}</label>
            <input
              type="text"
              placeholder="e.g. DSG-108, BUTTA-22"
              value={designNo}
              onChange={(e) => setDesignNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.challan_notes}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? t.saving : t.challan_saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
