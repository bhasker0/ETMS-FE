'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { InwardChallansApi, ActivePendingLotItem, PendingDesignItem } from '@/lib/api/challans';
import { formatNumber } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Clock, Sun, Moon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 6. Shift Drawer Form (Log Production Shift)                                */
/* -------------------------------------------------------------------------- */
export const ShiftDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [activeLots, setActiveLots] = useState<ActivePendingLotItem[]>([]);

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

  useEffect(() => {
    Promise.all([
      MachinesApi.getAll(),
      KarigarsApi.getAll(),
      InwardChallansApi.getActivePendingLots(),
    ])
      .then(([mList, kList, lotList]) => {
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
      })
      .catch((e) => console.warn('Failed to load masters in shift drawer:', e));
  }, []);

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

  const handleCreateShift = async (e: React.FormEvent) => {
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

      const result = await ShiftLogsApi.create(payload);
      toast.success('Production shift logged successfully!');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to log shift: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const currentLot = activeLots.find((l) => l.id === inwardChallanId);
  const pendingDesigns = currentLot?.pending_designs || [];

  const downtimeOptions = [
    { value: 'None', label: t.shift_dtNone || 'None' },
    { value: 'Thread Breakage', label: t.shift_dtThreadBreakage || 'Thread Breakage' },
    { value: 'Needle Replacement', label: t.shift_dtNeedleReplacement || 'Needle Replacement' },
    { value: 'Bobbin Refill', label: t.shift_dtBobbinRefill || 'Bobbin / Zari Refill' },
    { value: 'Power Outage', label: t.shift_dtPowerOutage || 'Power Outage / GIDC Load Shedding' },
    { value: 'Mechanical Jam', label: t.shift_dtMechanicalJam || 'Mechanical Jam / Oil Issue' },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.shift_drawerSingleLotTitle || 'Log Production Shift'}
      subtitle={t.shift_drawerSingleLotSubtitle || 'Daily machine shift entry • Completed designs are automatically filtered'}
      icon={<Clock className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`shift-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            {submitting ? (t.shift_drawerRegistering || 'Registering...') : (t.shift_saveBtn || 'Save Shift Log')}
          </button>
        </div>
      }
    >
      <form id={`shift-form-${instance.id}`} onSubmit={handleCreateShift} className="space-y-4">
        {/* Machine & Shift Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-700 font-medium">{t.shift_selectMachine || 'Select Machine'} *</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {t.dash_machinePrefix || 'Machine'} #{m.machine_no} ({m.head_count} {t.shift_headsUnit || 'Heads'} • {m.rpm || 850} RPM)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftTypeLabel || 'Shift Type'} *</label>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'DAY' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>{t.shift_day || 'DAY'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'NIGHT' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>{t.shift_night || 'NIGHT'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date & Karigar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftDate || 'Shift Date'} *</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_operatingKarigar || 'Operating Karigar'} *</label>
            <select
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.mobile || k.wage_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inward Lot & Design Section (Single Lot & Single Design Only) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              {t.shift_fabricLotsTitle || 'Fabric Lots & Cloth Allocation'}
            </span>
            <span className="text-2xs bg-[var(--bg-surface-elevated)] text-[var(--text-main)] font-semibold px-2 py-0.5 rounded-full">
              1 Lot • 1 Design per Shift
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_drawerSelectActiveLot || 'Select Active Inward Lot'} *</label>
              <select
                value={inwardChallanId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium font-mono"
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
                <label className="text-xs text-[var(--text-main)] font-bold">
                  {t.shift_drawerSelectActiveDesign || 'Select Active Design / Cloth'} *
                </label>
                <select
                  value={designNo}
                  onChange={(e) => handleDesignChange(e.target.value)}
                  className="w-full bg-white border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
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
              <div className="p-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[var(--text-main)] font-bold">
                  <span>{t.shift_drawerSelectedCloth || 'Selected Cloth:'} {selectedDesign.design_no}</span>
                  <span>{formatNumber(selectedDesign.remaining_meters)}m remaining</span>
                </div>
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--primary)] h-full rounded-full transition-all"
                    style={{
                      width: `${
                        selectedDesign.allocated_meters > 0
                          ? Math.min(100, Math.round((selectedDesign.produced_meters / selectedDesign.allocated_meters) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-2xs text-[var(--text-main)]">
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

        {/* Counter Telemetry */}
        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            {t.shift_calculatedNetStitches || 'Counter Telemetry:'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_startingCounter || 'Start Counter'} *</label>
              <input
                type="number"
                required
                min="0"
                value={startCounter}
                onChange={(e) => setStartCounter(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_endingCounter || 'End Counter'} *</label>
              <input
                type="number"
                required
                min="0"
                value={endCounter}
                onChange={(e) => setEndCounter(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_totalMetersOutput || 'Total Meters Output'} ({t.dash_metersUnit || 'm'}) *</label>
              <input
                type="number"
                required
                min="1"
                value={totalMeters}
                onChange={(e) => setTotalMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-2xs pt-1 border-t border-slate-200 font-mono">
            <span className="text-slate-500">{t.shift_calculatedNetStitches || 'Calculated Net Stitches:'}</span>
            <span className="font-extrabold text-slate-900">{formatNumber(Math.max(0, endCounter - startCounter))} {t.dash_stitchesUnit || 'stitches'}</span>
          </div>

          {selectedDesign && selectedDesign.remaining_meters > 0 && totalMeters >= selectedDesign.remaining_meters && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-2xs text-emerald-800 font-semibold">
              ✓ {t.shift_drawerFulfillsQuota || 'Output fulfills the remaining quota. This design will be marked 100% completed and retired from new shifts!'}
            </div>
          )}
        </div>

        {/* Downtime Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_downtimeMinutes || 'Downtime Minutes'}</label>
            <input
              type="number"
              min="0"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-rose-600 font-bold"
            />
          </div>

          {downtimeMinutes > 0 && (
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
          )}
        </div>
      </form>
    </Drawer>
  );
};
