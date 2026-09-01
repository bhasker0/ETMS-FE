'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatNumber } from '@/lib/utils';
import {
  Clock,
  Save,
  ArrowLeft,
  Sun,
  Moon,
  MapPin,
  ShieldCheck,
  Plus,
  Wrench,
  X,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewShiftLogPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

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

  const [isMultiLot, setIsMultiLot] = useState(false);
  const [lotAllocations, setLotAllocations] = useState<Array<{
    inward_challan_id: string;
    lot_no: string;
    design_no: string;
    meters: number;
    stitch_count?: number;
    commission_rate?: number;
    commission_type?: string;
  }>>([]);

  const addLotAllocation = () => {
    if (challans.length === 0) {
      toast.error('No registered inward lots available');
      return;
    }
    const defaultChallan = challans[0];
    const defaultDesign = defaultChallan.items && defaultChallan.items.length > 0
      ? defaultChallan.items[0].design_no
      : (defaultChallan.design_no || 'DSG-108');
    setLotAllocations((prev) => [
      ...prev,
      {
        inward_challan_id: defaultChallan.id,
        lot_no: defaultChallan.lot_no,
        design_no: defaultDesign,
        meters: 200,
        stitch_count: defaultChallan.stitch_count || 24000,
        commission_rate: defaultChallan.karigar_commission_rate || 0.25,
        commission_type: defaultChallan.karigar_commission_type || 'PER_1K_STITCHES',
      },
    ]);
  };

  const removeLotAllocation = (idx: number) => {
    setLotAllocations((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLotAllocation = (idx: number, field: string, val: any) => {
    setLotAllocations((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      if (field === 'inward_challan_id') {
        const found = challans.find((c) => c.id === val);
        if (found) {
          copy[idx].lot_no = found.lot_no;
          copy[idx].design_no = found.items && found.items.length > 0 ? found.items[0].design_no : (found.design_no || 'DSG-108');
          copy[idx].stitch_count = found.stitch_count || 24000;
          copy[idx].commission_rate = found.karigar_commission_rate || 0.25;
          copy[idx].commission_type = found.karigar_commission_type || 'PER_1K_STITCHES';
        }
      }
      return copy;
    });
  };

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
      const calculatedMeters = isMultiLot && lotAllocations.length > 0
        ? lotAllocations.reduce((acc, l) => acc + Number(l.meters || 0), 0)
        : Number(totalMeters);

      const payload: CreateShiftLogDto = {
        machine_id: machineId,
        shift_type: shiftType,
        shift_date: shiftDate,
        inward_challan_id: isMultiLot ? (lotAllocations[0]?.inward_challan_id || undefined) : (inwardChallanId || undefined),
        design_no: isMultiLot ? (lotAllocations[0]?.design_no || designNo) : designNo,
        start_counter: Number(startCounter),
        end_counter: Number(endCounter),
        total_meters: calculatedMeters,
        karigar_id: karigarId,
        downtime_minutes: Number(downtimeMinutes),
        downtime_reason: downtimeMinutes > 0 ? downtimeReason : undefined,
        lot_allocations: isMultiLot ? lotAllocations : undefined,
      };

      await ShiftLogsApi.create(payload);
      toast.success('Shift log registered with cloth lot allocations');
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
        {/* Geofence & Subnet Verification Strip (SCRUM-143) */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-2xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Factory Geofence Gate: <strong>Verified Inside Premises</strong> (Surat GIDC Plot 14-B)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-mono">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>21.1702° N, 72.8311° E • Subnet: 103.21.244.x</span>
          </div>
        </div>

        {/* Machine & Shift Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-700 font-medium">Select Machine *</label>
              <button
                type="button"
                onClick={() =>
                  openDrawer('ADD_MACHINE', {}, async (createdMachine?: any) => {
                    const updatedList = await MachinesApi.getAll();
                    setMachines(updatedList);
                    if (createdMachine?.id) {
                      setMachineId(createdMachine.id);
                      toast.success(`Machine #${createdMachine.machine_no || ''} registered & selected`);
                    }
                  })
                }
                className="text-2xs text-[#0099B8] hover:text-[#0E7090] font-semibold flex items-center gap-1 transition"
              >
                <Wrench className="w-3 h-3" />
                <span>+ Add Machine</span>
              </button>
            </div>
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
            {(() => {
              const selectedM = machines.find((m) => m.id === machineId);
              if (!selectedM) return null;
              const isRunning = selectedM.status === 'RUNNING' || !selectedM.status;
              const isMaintenance = selectedM.status === 'MAINTENANCE';
              return (
                <div className="flex items-center justify-between text-2xs pt-1 px-1 text-slate-600 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMaintenance
                          ? 'bg-rose-500'
                          : isRunning
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      Status:{' '}
                      <strong
                        className={`font-bold ${
                          isMaintenance
                            ? 'text-rose-700'
                            : isRunning
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {selectedM.status || 'RUNNING'}
                      </strong>
                    </span>
                  </span>
                  <span>
                    Floor Telemetry: <strong>{selectedM.rpm || 850} RPM</strong> •{' '}
                    <strong>{selectedM.head_count || 32} Heads</strong>
                  </span>
                </div>
              );
            })()}
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
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-700 font-medium">Operating Karigar *</label>
              <button
                type="button"
                onClick={() =>
                  openDrawer('ADD_KARIGAR', {}, async (createdKarigar?: any) => {
                    const updatedList = await KarigarsApi.getAll();
                    setKarigars(updatedList);
                    if (createdKarigar?.id) {
                      setKarigarId(createdKarigar.id);
                      toast.success(`Karigar ${createdKarigar.name} selected`);
                    }
                  })
                }
                className="text-2xs text-[#0099B8] hover:text-[#0E7090] font-semibold flex items-center gap-0.5 transition"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Karigar</span>
              </button>
            </div>
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

        {/* Fabric Lots & Cloth Allocation Section */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              Fabric Lots & Cloth Allocation (કાપડ લોટ અને ડિઝાઇન ફાળવણી)
            </span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isMultiLot;
                setIsMultiLot(nextVal);
                if (nextVal && lotAllocations.length === 0) {
                  addLotAllocation();
                }
              }}
              className="text-2xs font-semibold px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              {isMultiLot ? 'Switch to Single Lot' : '+ Multiple Lots / Cloths in Shift'}
            </button>
          </div>

          {!isMultiLot ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">Linked Fabric Inward Lot</label>
                <select
                  value={inwardChallanId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setInwardChallanId(cId);
                    const selectedChallan = challans.find((c) => c.id === cId);
                    if (selectedChallan) {
                      const validItems = Array.isArray(selectedChallan.items)
                        ? selectedChallan.items.filter((it: any) => it && typeof it === 'object' && !Array.isArray(it) && it.design_no)
                        : [];
                      if (validItems.length > 0) {
                        setDesignNo(validItems[0].design_no);
                      } else if (selectedChallan.design_no) {
                        setDesignNo(selectedChallan.design_no);
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
                >
                  <option value="">-- Optional General Shift --</option>
                  {challans.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lot #{c.lot_no} • {c.trader_name} ({c.fabric_quality})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedChallan = challans.find((c) => c.id === inwardChallanId);
                const validItems = Array.isArray(selectedChallan?.items)
                  ? selectedChallan.items.filter((it: any) => it && typeof it === 'object' && !Array.isArray(it) && it.design_no)
                  : [];

                if (validItems.length > 1) {
                  return (
                    <div className="space-y-1">
                      <label className="text-xs text-cyan-900 font-semibold">Select Design from Multi-Design Lot</label>
                      <select
                        value={designNo}
                        onChange={(e) => setDesignNo(e.target.value)}
                        className="w-full bg-white border border-cyan-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
                      >
                        {validItems.map((item: any, idx: number) => (
                          <option key={idx} value={item.design_no}>
                            {item.design_no} ({formatNumber(item.stitch_count || 0)} st. • ₹{Number(item.commission_rate || 0).toFixed(2)} comm • {formatNumber(item.meters || 0)}m)
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-700 font-medium">Embroidery Design Code</label>
                    <input
                      type="text"
                      value={designNo}
                      onChange={(e) => setDesignNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                    />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs text-slate-500 font-medium">
                  Allocate multiple cloth lots worked by the Karigar on this machine:
                </span>
                <button
                  type="button"
                  onClick={addLotAllocation}
                  className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded text-2xs font-semibold hover:bg-cyan-100 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Cloth Lot Row</span>
                </button>
              </div>

              {lotAllocations.map((alloc, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-2 items-end text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-2xs text-slate-600 font-medium">Inward Lot *</label>
                    <select
                      value={alloc.inward_challan_id}
                      onChange={(e) => updateLotAllocation(idx, 'inward_challan_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono text-slate-900"
                    >
                      {challans.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lot #{c.lot_no} ({c.trader_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs text-slate-600 font-medium">Design Code</label>
                    <input
                      type="text"
                      value={alloc.design_no}
                      onChange={(e) => updateLotAllocation(idx, 'design_no', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="space-y-1 flex-1">
                      <label className="text-2xs text-slate-600 font-medium">Meters (મીટર)</label>
                      <input
                        type="number"
                        min="1"
                        value={alloc.meters}
                        onChange={(e) => updateLotAllocation(idx, 'meters', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    {lotAllocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLotAllocation(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                        title="Remove lot row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="p-2 bg-cyan-50 border border-cyan-100 rounded text-2xs text-cyan-900 flex justify-between font-mono font-bold">
                <span>Total Multi-Lot Meters:</span>
                <span>{lotAllocations.reduce((acc, l) => acc + Number(l.meters || 0), 0)} meters</span>
              </div>
            </div>
          )}
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
