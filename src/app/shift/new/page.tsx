'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { InwardChallansApi, ActivePendingLotItem, PendingDesignItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewShiftLogPage() {
  const router = useRouter();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();

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
      toast.error('Machine and Karigar are required');
      return;
    }

    if (endCounter <= startCounter) {
      toast.error('End counter must be greater than start counter');
      return;
    }

    if (inwardChallanId && !designNo) {
      toast.error('Please select an active cloth design for this inward lot');
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
      toast.success('Production shift logged successfully');
      router.push('/shift');
    } catch (err: any) {
      toast.error('Failed to log shift: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const downtimeOptions = [
    { value: 'None', label: t.shift_dtNone || 'None' },
    { value: 'Thread Breakage', label: t.shift_dtThreadBreakage || 'Thread Breakage' },
    { value: 'Needle Replacement', label: t.shift_dtNeedleReplacement || 'Needle Replacement' },
    { value: 'Bobbin Refill', label: t.shift_dtBobbinRefill || 'Bobbin / Zari Refill' },
    { value: 'Power Outage', label: t.shift_dtPowerOutage || 'Power Outage / GIDC Load Shedding' },
    { value: 'Mechanical Jam', label: t.shift_dtMechanicalJam || 'Mechanical Jam / Oil Issue' },
  ];

  const currentLot = activeLots.find((l) => l.id === inwardChallanId);
  const pendingDesigns = currentLot?.pending_designs || [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.shift_dailyCounterTag || 'Daily Production Counter'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.shift_logShiftTitle || 'Log Production Shift'}
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        {/* Geofence & Subnet Verification Strip */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-2xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.shift_geofenceVerified || 'Factory Geofence Gate: Verified Inside Premises (Surat GIDC Plot 14-B)'}</span>
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
              <label className="text-xs text-slate-700 font-medium">{t.shift_selectMachine || 'Select Machine'} *</label>
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
                className="text-2xs text-[#0099B8] hover:text-[#0E7090] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Wrench className="w-3 h-3" />
                <span>{t.shift_addMachine || '+ Add Machine'}</span>
              </button>
            </div>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {t.dash_machinePrefix || 'Machine'} #{m.machine_no} ({m.head_count} {t.shift_headsUnit || 'Heads'} • {m.rpm || 850} RPM)
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
                      {t.shift_statusLabel || 'Status:'}{' '}
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
                    {t.shift_floorTelemetry || 'Floor Telemetry:'} <strong>{selectedM.rpm || 850} RPM</strong> •{' '}
                    <strong>{selectedM.head_count || 32} {t.shift_headsUnit || 'Heads'}</strong>
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftTypeLabel || 'Shift Type'} *</label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'DAY'
                    ? 'bg-[#0099B8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t.shift_day || 'Day'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'NIGHT'
                    ? 'bg-[#0099B8] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.shift_night || 'Night'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date & Karigar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftDate || 'Shift Date'}</label>
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
              <label className="text-xs text-slate-700 font-medium">{t.shift_operatingKarigar || 'Operating Karigar'} *</label>
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
                className="text-2xs text-[#0099B8] hover:text-[#0E7090] font-semibold flex items-center gap-0.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t.shift_addKarigar || '+ Add Karigar'}</span>
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

        {/* Single Lot & Single Design Allocation Section */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              {t.shift_fabricLotsTitle || 'Fabric Lots & Cloth Allocation'}
            </span>
            <span className="text-2xs bg-cyan-100 text-cyan-800 font-semibold px-2.5 py-0.5 rounded-full">
              1 Lot • 1 Design per Shift
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_drawerSelectActiveLot || 'Select Active Inward Lot'} *</label>
              <select
                value={inwardChallanId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              >
                <option value="">{t.shift_optionalGeneralShift || '-- Optional General Shift (No Lot) --'}</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lot #{lot.lot_no} • {lot.trader_name} ({lot.fabric_quality} • {lot.pending_designs.length} pending designs)
                  </option>
                ))}
              </select>
              {activeLots.length === 0 && (
                <p className="text-2xs text-amber-600 font-medium mt-1">
                  {t.shift_drawerAllLotsCompleted || 'All registered inward lots are currently completed! Create a new inward lot or run a general shift.'}
                </p>
              )}
            </div>

            {inwardChallanId && pendingDesigns.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-cyan-950 font-bold">
                  {t.shift_drawerSelectActiveDesign || 'Select Active Design / Cloth'} *
                </label>
                <select
                  value={designNo}
                  onChange={(e) => handleDesignChange(e.target.value)}
                  className="w-full bg-white border border-cyan-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
                >
                  {pendingDesigns.map((d, idx) => {
                    const percentDone = d.allocated_meters > 0
                      ? Math.min(100, Math.round((d.produced_meters / d.allocated_meters) * 100))
                      : 0;
                    return (
                      <option key={idx} value={d.design_no}>
                        {d.design_no} • {formatNumber(d.remaining_meters)}m {t.shift_drawerRemainingOf || 'remaining of'} {formatNumber(d.allocated_meters)}m ({percentDone}% {t.shift_drawerDone || 'done'} • ₹{Number(d.commission_rate || 0).toFixed(2)} {t.shift_drawerComm || 'comm'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {inwardChallanId && selectedDesign && (
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-cyan-950 font-bold">
                  <span>{t.shift_drawerSelectedCloth || 'Selected Cloth:'} {selectedDesign.design_no}</span>
                  <span>{formatNumber(selectedDesign.remaining_meters)}m remaining</span>
                </div>
                <div className="w-full bg-cyan-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        selectedDesign.allocated_meters > 0
                          ? Math.min(100, Math.round((selectedDesign.produced_meters / selectedDesign.allocated_meters) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-2xs text-cyan-800">
                  <span>{t.shift_drawerProduced || 'Produced:'} {formatNumber(selectedDesign.produced_meters)}m</span>
                  <span>{t.shift_drawerAllocatedQuota || 'Allocated Quota:'} {formatNumber(selectedDesign.allocated_meters)}m</span>
                </div>
              </div>
            )}

            {!inwardChallanId && (
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.shift_designCode || 'Design Code'}</label>
                <input
                  type="text"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  placeholder="e.g. DSG-SAMPLE-01"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Counters & Output */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_startingCounter || 'Starting Counter'} *</label>
            <input
              type="number"
              required
              value={startCounter}
              onChange={(e) => setStartCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_endingCounter || 'Ending Counter'} *</label>
            <input
              type="number"
              required
              value={endCounter}
              onChange={(e) => setEndCounter(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_totalMetersOutput || 'Total Meters Output'} *</label>
            <input
              type="number"
              required
              min="1"
              value={totalMeters}
              onChange={(e) => setTotalMeters(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700"
            />
          </div>
        </div>

        {/* Live Stitches Computed Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">
            {t.shift_calculatedNetStitches || 'Calculated Net Stitches:'}
          </span>
          <span className="text-sm font-mono font-bold text-slate-900">
            {formatNumber(netStitches)} {t.dash_stitchesUnit || 'st.'}
          </span>
        </div>

        {selectedDesign && selectedDesign.remaining_meters > 0 && totalMeters >= selectedDesign.remaining_meters && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
            ✓ {t.shift_drawerFulfillsQuota || 'Output fulfills the remaining quota. This design will be marked 100% completed and retired from future shifts!'}
          </div>
        )}

        {/* Downtime Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_downtimeMinutes || 'Downtime Minutes'}</label>
            <input
              type="number"
              min="0"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_downtimeReason || 'Downtime Reason'}</label>
            <select
              value={downtimeReason}
              onChange={(e) => setDowntimeReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
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
            className="w-full py-2.5 bg-[#0099B8] hover:bg-[#0E7090] active:scale-98 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? (t.shift_savingBtn || 'Saving...') : (t.shift_saveBtn || 'Save Shift Log')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}


