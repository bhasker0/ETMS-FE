'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InwardChallansApi, CreateInwardChallanDto } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import {
  Truck,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export default function InwardChallanFormPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();

  const [traderName, setTraderName] = useState('Ambaji Fashion Surat');
  const [traderGstin, setTraderGstin] = useState('24BBCDE5678G1Z3');
  const [lotNo, setLotNo] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [thanCount, setThanCount] = useState<number>(24);
  const [inwardMeters, setInwardMeters] = useState<number>(1200);
  const [fabricQuality, setFabricQuality] = useState('Georgette 60g / Heavy Foil');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [notes, setNotes] = useState('Delivered via Sachin GIDC tempo transport');
  const [submitting, setSubmitting] = useState(false);

  const predefinedTraders = [
    { name: 'Ambaji Fashion Surat', gstin: '24BBCDE5678G1Z3' },
    { name: 'Radhe Krishna Sarees', gstin: '24AABCR1234F1Z1' },
    { name: 'Surat Dress Materials', gstin: '24CDEFG9012H1Z5' },
    { name: 'Mahadev Silks Ring Road', gstin: '24DEFGH3456I1Z7' },
  ];

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
              <span>આવક કાપડ ચલણ • Inward Delivery Challan</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Register Inward Fabric Lot (આવક ચલણ)
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        {/* Quick fill traders */}
        <div className="space-y-1.5">
          <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick-Select Surat Trader (વેપારી પસંદ કરો)
          </label>
          <div className="flex flex-wrap gap-2">
            {predefinedTraders.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setTraderName(t.name);
                  setTraderGstin(t.gstin);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  traderName === t.name
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Trader Name (વેપારી પેઢી) *</label>
            <input
              type="text"
              required
              value={traderName}
              onChange={(e) => setTraderName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
            <input
              type="text"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Lot Number (લોટ નં.) *</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Than / Taka Count (તાકા) *</label>
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
            <label className="text-xs text-slate-700 font-medium">Inward Gray Meters *</label>
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
            <label className="text-xs text-slate-700 font-medium">Fabric Quality (કાપડ ક્વોલિટી)</label>
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
            <label className="text-xs text-slate-700 font-medium">Design / Program Code</label>
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
          <label className="text-xs text-slate-700 font-medium">Notes / Transport Details</label>
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
            <span>{submitting ? 'Saving...' : 'Save Inward Challan (આવક નોંધો)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
