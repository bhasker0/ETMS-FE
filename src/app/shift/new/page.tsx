'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { formatNumber } from '@/lib/utils';
import {
  Clock,
  Save,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewShiftLogPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();

  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);

  // Form State
  const [machineId, setMachineId] = useState('');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [startCounter, setStartCounter] = useState<number>(100000);
  const [endCounter, setEndCounter] = useState<number>(484000);
  const [totalMeters, setTotalMeters] = useState<number>(450);
  const [karigarId, setKarigarId] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [downtimeReason, setDowntimeReason] = useState('None');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [mList, kList, cList] = await Promise.all([
          MachinesApi.getAll(),
          KarigarsApi.getAll(),
          InwardChallansApi.getAll(),
        ]);
        setMachines(mList);
        setKarigars(kList);
        setChallans(cList);

        if (mList.length > 0) setMachineId(mList[0].id);
        if (kList.length > 0) setKarigarId(kList[0].id);
        if (cList.length > 0) setInwardChallanId(cList[0].id);
      } catch (e) {
        console.warn('Shift masters fetch error:', e);
      }
    };
    fetchMasters();
  }, [activeCompany?.id]);

  const netStitches = Math.max(0, Number(endCounter) - Number(startCounter));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !karigarId) {
      toast.error('Machine and Karigar are required');
      return;
    }

    if (endCounter <= startCounter) {
      toast.error('End counter must be greater than start counter');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateShiftLogDto = {
        machine_id: machineId,
        shift_type: shiftType,
        shift_date: shiftDate,
        inward_challan_id: inwardChallanId || undefined,
        design_no: designNo,
        start_counter: Number(startCounter),
        end_counter: Number(endCounter),
        total_meters: Number(totalMeters),
        karigar_id: karigarId,
        downtime_minutes: Number(downtimeMinutes),
        downtime_reason: downtimeMinutes > 0 ? downtimeReason : undefined,
      };

      await ShiftLogsApi.create(payload);
      toast.success('Shift log registered');
      router.push('/shift');
    } catch (err: any) {
      toast.error('Failed to log shift: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downtimeOptions = [
    'None',
    'Thread Breakage (દોરા તૂટવા)',
    'Needle Replacement (સોય બદલવી)',
    'Bobbin / Zari Refill (બોબીન ભરાવવું)',
    'Power Outage / GIDC Load Shedding (લાઇટ જવી)',
    'Mechanical Jam / Oil Issue (મિકેનિકલ ખામી)',
  ];

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
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>દૈનિક શિફ્ટ કાઉન્ટર • Daily Production Counter</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Log Production Shift (કાઉન્ટર નોંધ)
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        {/* Machine & Shift Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-700 font-medium">Select Machine (મશીન) *</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  Machine #{m.machine_no} ({m.head_count} Heads • {m.rpm || 850} RPM)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Shift Type (શિફ્ટ) *</label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  shiftType === 'DAY'
                    ? 'bg-[#0099B8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  shiftType === 'NIGHT'
                    ? 'bg-[#0099B8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date & Karigar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Shift Date</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Operating Karigar (કારીગર) *</label>
            <select
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.wage_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counters & Output */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Starting Counter *</label>
            <input
              type="number"
              required
              value={startCounter}
              onChange={(e) => setStartCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Ending Counter *</label>
            <input
              type="number"
              required
              value={endCounter}
              onChange={(e) => setEndCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Total Meters Output (મીટર) *</label>
            <input
              type="number"
              required
              min="1"
              value={totalMeters}
              onChange={(e) => setTotalMeters(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Live Stitches Computed Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            Calculated Net Stitches (કુલ ટાંકા):
          </span>
          <span className="text-sm font-mono font-bold text-slate-900">
            {formatNumber(netStitches)} Stitches
          </span>
        </div>

        {/* Downtime Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Downtime Minutes</label>
            <input
              type="number"
              min="0"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Downtime Reason</label>
            <select
              value={downtimeReason}
              onChange={(e) => setDowntimeReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            >
              {downtimeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#0099B8] hover:bg-[#0E7090] active:scale-98 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Shift Log (કાઉન્ટર સેવ કરો)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
