'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ExpensesApi } from '@/lib/api/expenses';
import { toast } from 'sonner';
import { Wrench, AlertTriangle, RefreshCw } from 'lucide-react';

export const MachineMaintenanceDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [machineId, setMachineId] = useState('');
  const [machineNo, setMachineNo] = useState(instance.payload?.machineNo || 'M-01');
  const [breakdownType, setBreakdownType] = useState('Needle Breakage / Thread Jam');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(45);
  const [technicianName, setTechnicianName] = useState('Ramesh Mistri');
  const [actionTaken, setActionTaken] = useState('Replaced hook timing, cleaned Dahao sensor');
  const [spareCost, setSpareCost] = useState<number>(350);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMachines = async () => {
      setLoading(true);
      try {
        const list = await MachinesApi.getAll();
        setMachines(list);
        if (list.length > 0) {
          const match = list.find((m) => m.machine_no === instance.payload?.machineNo) || list[0];
          setMachineId(match.id);
          setMachineNo(match.machine_no);
        }
      } catch (err) {
        console.warn('Machines load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [instance.payload?.machineNo]);

  const handleMachineSelect = (selectedId: string) => {
    setMachineId(selectedId);
    const found = machines.find((m) => m.id === selectedId);
    if (found) setMachineNo(found.machine_no);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Auto-post repair cost as a direct expense in company financials if cost > 0
      if (spareCost > 0) {
        await ExpensesApi.create({
          category: 'DIRECT',
          expense_type: 'MACHINE_REPAIR',
          payee_name: technicianName || 'Technician',
          expense_date: new Date().toISOString().slice(0, 10),
          amount: spareCost,
          payment_mode: 'CASH',
          description: `Machine #${machineNo} maintenance: ${breakdownType} (${actionTaken})`,
        }).catch((err) => console.warn('Expense auto-log warning:', err));
      }

      toast.success(`${t.maint_title || 'Maintenance'}: Logged ${downtimeMinutes}m stoppage on Machine #${machineNo}`);
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess({ machineId, machineNo, downtimeMinutes, spareCost });
    } catch (err: any) {
      toast.error('Failed to log machine maintenance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.maint_title || 'Machine Downtime & Maintenance Telemetry'}
      subtitle={t.maint_subtitle || 'Log machine stops, mechanical breakdowns, technician notes & auto-post repair expenses'}
      icon={<Wrench className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`maint-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            {submitting ? t.saving : t.maint_btnRecord || 'Record Breakdown'}
          </button>
        </div>
      }
    >
      <form id={`maint-form-${instance.id}`} onSubmit={handleSave} className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading active machine fleet...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.maint_machineNo || 'Machine #'}</label>
            {machines.length > 0 ? (
              <select
                value={machineId}
                onChange={(e) => handleMachineSelect(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    Machine #{m.machine_no} ({m.head_count} Heads, {m.rpm || 850} RPM)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.maint_downtimeMin || 'Stoppage (Minutes)'}</label>
            <input
              type="number"
              min="1"
              required
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.maint_reason || 'Breakdown Category'}</label>
          <select
            value={breakdownType}
            onChange={(e) => setBreakdownType(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          >
            <option value="Needle Breakage / Thread Jam">Needle Breakage / Thread Jam</option>
            <option value="Servo Motor / Controller Fault">Servo Motor / Controller Fault (Dahao)</option>
            <option value="Rotary Hook & Trimmer Timing">Rotary Hook & Trimmer Timing</option>
            <option value="Power Trip / GIDC Grid Outage">Power Trip / GIDC Grid Outage</option>
            <option value="Sequin / Cording Attachment">Sequin / Cording Device Jam</option>
            <option value="Routine Oil & Maintenance">Routine Oil & Needle Bar Service</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.maint_technician || 'Technician / Mistri'}</label>
          <input
            type="text"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.maint_actionTaken || 'Action Taken & Resolution'}</label>
          <textarea
            rows={2}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.maint_cost || 'Spare Part / Repair Cost (INR)'}</label>
          <input
            type="number"
            min="0"
            value={spareCost}
            onChange={(e) => setSpareCost(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
          />
          <span className="text-[11px] text-slate-500">Auto-records into factory Expense Ledger under Direct Repair.</span>
        </div>

        {/* Severity Banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Shift capacity impact: estimated ~{Math.round((downtimeMinutes / 720) * 100)}% shift output reduction.</span>
        </div>
      </form>
    </Drawer>
  );
};
