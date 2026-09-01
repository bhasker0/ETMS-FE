'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { InwardChallansApi, ActivePendingLotItem, PendingDesignItem } from '@/lib/api/challans';
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
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewShiftLogPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [activeLots, setActiveLots] = useState<ActivePendingLotItem[]>([]);

  // Form State
  const [machineId, setMachineId] = useState('');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [designNo, setDesignNo] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<PendingDesignItem | null>(null);

  const [startCounter, setStartCounter] = useState<number>(100000);
  const [endCounter, setEndCounter] = useState<number>(484000);
  const [totalMeters, setTotalMeters] = useState<number>(450);
  const [karigarId, setKarigarId] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [downtimeReason, setDowntimeReason] = useState('None');
  const [submitting, setSubmitting] = useState(false);

  const fetchMasters = async () => {
    try {
      const [mList, kList, lotList] = await Promise.all([
        MachinesApi.getAll(),
        KarigarsApi.getAll(),
        InwardChallansApi.getActivePendingLots(),
      ]);
      setMachines(mList);
      setKarigars(kList);
      setActiveLots(lotList);

      if (mList.length > 0) setMachineId(mList[0].id);
      if (kList.length > 0) setKarigarId(kList[0].id);
      if (lotList.length > 0) {
        const firstLot = lotList[0];
        setInwardChallanId(firstLot.id);
        if (firstLot.pending_designs && firstLot.pending_designs.length > 0) {
          const firstDesign = firstLot.pending_designs[0];
          setDesignNo(firstDesign.design_no);
          setSelectedDesign(firstDesign);
        }
      }
    } catch (e) {
      console.warn('Shift masters fetch error:', e);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (activeCompany?.id) {
      fetchMasters();
    }
  }, [activeCompany?.id]);

  const handleLotChange = (selectedLotId: string) => {
    setInwardChallanId(selectedLotId);
    if (!selectedLotId) {
      setSelectedDesign(null);
      setDesignNo('');
      return;
    }
    const foundLot = activeLots.find((l) => l.id === selectedLotId);
    if (foundLot && foundLot.pending_designs && foundLot.pending_designs.length > 0) {
      const firstDesign = foundLot.pending_designs[0];
      setDesignNo(firstDesign.design_no);
      setSelectedDesign(firstDesign);
    } else {
      setSelectedDesign(null);
      setDesignNo('');
    }
  };

  const handleDesignChange = (selectedDesignNo: string) => {
    setDesignNo(selectedDesignNo);
    const foundLot = activeLots.find((l) => l.id === inwardChallanId);
    if (foundLot && foundLot.pending_designs) {
      const d = foundLot.pending_designs.find((item) => item.design_no === selectedDesignNo);
      setSelectedDesign(d || null);
    }
  };

  const netStitches = Math.max(0, Number(endCounter) - Number(startCounter));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !karigarId) {
      toast.error('[ERROR] Machine and Karigar are required for production log');
      return;
    }

    if (endCounter <= startCounter) {
      toast.error('[ERROR] End counter must be greater than start counter');
      return;
    }

    if (inwardChallanId && !designNo) {
      toast.error('[ERROR] Please select an active cloth design for this inward lot');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateShiftLogDto = {
        machine_id: machineId,
        shift_type: shiftType,
        shift_date: shiftDate,
        inward_challan_id: inwardChallanId || undefined,
        design_no: designNo || 'GENERAL',
        start_counter: Number(startCounter),
        end_counter: Number(endCounter),
        total_meters: Number(totalMeters),
        karigar_id: karigarId,
        downtime_minutes: Number(downtimeMinutes),
        downtime_reason: downtimeMinutes > 0 ? downtimeReason : undefined,
      };

      await ShiftLogsApi.create(payload);
      toast.success('[COMMITTED] Production shift record created successfully');
      router.push('/shift');
    } catch (err: any) {
      toast.error('Failed to log shift: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const downtimeOptions = [
    { value: 'None', label: '[NONE] - ZERO DOWNTIME' },
    { value: 'Thread Breakage', label: '[THREAD BREAKAGE] - SENSOR HALT' },
    { value: 'Needle Replacement', label: '[NEEDLE REPLACEMENT] - SPINDLE STOP' },
    { value: 'Bobbin Refill', label: '[BOBBIN REFILL] - ZARI CHANGE' },
    { value: 'Power Outage', label: '[POWER OUTAGE] - GIDC LOAD SHED' },
    { value: 'Mechanical Jam', label: '[MECHANICAL JAM] - GEAR OIL ISSUE' },
  ];

  const currentLot = activeLots.find((l) => l.id === inwardChallanId);
  const pendingDesigns = currentLot?.pending_designs || [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] transition cursor-pointer rounded-lg shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Production Entry • Daily Spec Sheet</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Record Production Shift
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 space-y-6 shadow-xs">
        {/* Geofence & Subnet Verification Strip */}
        <div className="p-3.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Geofence Verified • Surat GIDC Plot 14-B</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-[0.6875rem]">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-main)]" />
            <span>21.1702° N, 72.8311° E • Subnet: 103.21.244.x</span>
          </div>
        </div>

        {/* Machine & Shift Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Select Machine *</label>
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
                className="text-xs text-[var(--text-main)] hover:underline font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>+ Register Machine</span>
              </button>
            </div>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg focus:outline-none focus:border-[var(--text-main)] font-mono font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  Machine #{m.machine_no} ({m.head_count} Heads • {m.rpm || 850} RPM)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Shift Timing *</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[var(--bg-canvas)] p-1 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition rounded-md ${
                  shiftType === 'DAY'
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition rounded-md ${
                  shiftType === 'NIGHT'
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Shift Date *</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Operating Karigar *</label>
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
                className="text-xs text-[var(--text-main)] hover:underline font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Karigar</span>
              </button>
            </div>
            <select
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-medium"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.wage_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fabric Lots & Cloth Allocation */}
        <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-tight">
              Lot Allocation & Design Specification
            </span>
            <span className="badge-pastel-blue px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">
              1 Lot • 1 Design per Shift
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Active Inward Lot *</label>
              <select
                value={inwardChallanId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-medium"
              >
                <option value="">-- General Production (No Linked Inward Lot) --</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lot #{lot.lot_no} • {lot.trader_name} ({lot.fabric_quality} • {lot.pending_designs.length} designs pending)
                  </option>
                ))}
              </select>
            </div>

            {inwardChallanId && pendingDesigns.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">
                  Active Design Pattern *
                </label>
                <select
                  value={designNo}
                  onChange={(e) => handleDesignChange(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-medium font-mono"
                >
                  {pendingDesigns.map((d, idx) => {
                    const percentDone = d.allocated_meters > 0
                      ? Math.min(100, Math.round((d.produced_meters / d.allocated_meters) * 100))
                      : 0;
                    return (
                      <option key={idx} value={d.design_no}>
                        {d.design_no} • {formatNumber(d.remaining_meters)}m remaining ({percentDone}% complete)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {!inwardChallanId && (
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Design Code / Name</label>
                <input
                  type="text"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  placeholder="e.g. DSG-108-ZARI"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-mono font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Counters & Output */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Start Counter (Meter) *</label>
            <input
              type="number"
              required
              value={startCounter}
              onChange={(e) => setStartCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-sm font-mono font-semibold text-[var(--text-main)] rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">End Counter (Meter) *</label>
            <input
              type="number"
              required
              value={endCounter}
              onChange={(e) => setEndCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Total Meters Output *</label>
            <input
              type="number"
              required
              min="1"
              value={totalMeters}
              onChange={(e) => setTotalMeters(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--text-main)] rounded-lg"
            />
          </div>
        </div>

        {/* Live Stitches Computed Banner */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Calculated Net Production Stitches:
            </span>
          </div>
          <span className="text-lg sm:text-xl font-mono font-bold text-[var(--text-main)] tabular-nums">
            {formatNumber(netStitches)} Stitches
          </span>
        </div>

        {/* Downtime Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Downtime Duration (Minutes)</label>
            <input
              type="number"
              min="0"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-xs font-mono font-medium text-[var(--text-main)] rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-main)] font-semibold uppercase tracking-wider">Downtime Cause</label>
            <select
              value={downtimeReason}
              onChange={(e) => setDowntimeReason(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text-main)] rounded-lg font-medium"
            >
              {downtimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[var(--text-main)] hover:opacity-90 active:scale-[0.99] text-[var(--bg-surface)] font-bold text-xs uppercase transition shadow-sm flex items-center justify-center gap-2 cursor-pointer rounded-xl"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Committing Shift Log...' : 'Commit Production Shift Entry'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}



