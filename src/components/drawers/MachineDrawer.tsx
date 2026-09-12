'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { MachinesApi, MachineApiItem, CreateMachineDto } from '@/lib/api/machines';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Cpu } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 2. Machine Drawer Form (Add / Edit)                                       */
/* -------------------------------------------------------------------------- */
export const MachineDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const editingMachine = instance.payload?.machine as MachineApiItem | undefined;

  const [machineNo, setMachineNo] = useState(editingMachine?.machine_no || '');
  const [headCount, setHeadCount] = useState<24 | 32 | 44 | 66>(editingMachine?.head_count || 32);
  const [rpm, setRpm] = useState(editingMachine?.rpm || 850);
  const [makeModel, setMakeModel] = useState(editingMachine?.make_model || 'Surat High-Speed Tajima Type');
  const [isActive, setIsActive] = useState(editingMachine?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateMachineDto = {
        machine_no: machineNo,
        head_count: Number(headCount) as 24 | 32 | 44 | 66,
        rpm: Number(rpm),
        make_model: makeModel,
        is_active: isActive,
      };

      let result;
      if (editingMachine) {
        result = await MachinesApi.update(editingMachine.id, payload);
        toast.success(`Machine #${machineNo} updated`);
      } else {
        result = await MachinesApi.create(payload);
        toast.success(`Machine #${machineNo} added to fleet`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to save machine: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={editingMachine ? t.machine_drawerEditTitle : t.machine_drawerAddTitle}
      subtitle={t.machine_drawerSubtitle}
      icon={<Cpu className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`machine-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? t.saving : editingMachine ? t.machine_btnSave : t.machine_btnCreate}
          </button>
        </div>
      }
    >
      <form id={`machine-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelIdentifier}</label>
          <input
            type="text"
            required
            placeholder="e.g. M-01 or 12"
            value={machineNo}
            onChange={(e) => setMachineNo(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelHeadCount}</label>
          <select
            value={headCount}
            onChange={(e) => setHeadCount(Number(e.target.value) as 24 | 32 | 44 | 66)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            <option value={24}>{t.machine_opt24Heads}</option>
            <option value={32}>{t.machine_opt32Heads}</option>
            <option value={44}>{t.machine_opt44Heads}</option>
            <option value={66}>{t.machine_opt66Heads}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelRpm}</label>
          <input
            type="number"
            required
            min="400"
            max="1200"
            value={rpm}
            onChange={(e) => setRpm(parseInt(e.target.value, 10) || 850)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelMakeModel}</label>
          <input
            type="text"
            value={makeModel}
            onChange={(e) => setMakeModel(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`active-machine-${instance.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-slate-900 border-slate-300 rounded"
          />
          <label htmlFor={`active-machine-${instance.id}`} className="text-xs text-slate-700 font-medium cursor-pointer">
            {t.machine_labelOperationalToggle}
          </label>
        </div>
      </form>
    </Drawer>
  );
};
