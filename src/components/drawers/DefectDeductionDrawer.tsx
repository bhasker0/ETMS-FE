'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Scissors } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 10. Defect & Quality Deduction Drawer Form (SCRUM-185)                     */
/* -------------------------------------------------------------------------- */
export const DefectDeductionDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const lot = instance.payload?.lot || instance.payload?.challan;

  const [defectType, setDefectType] = useState('Weft Cut / Needle Hole');
  const [defectMeters, setDefectMeters] = useState<number>(3.5);
  const [deductionRate, setDeductionRate] = useState<number>(45);
  const [defectNotes, setDefectNotes] = useState('Oil stains on 2 than borders');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const ded = Number((defectMeters * deductionRate).toFixed(2));
    instance.onSuccess?.({
      meters: defectMeters,
      deduction: ded,
      lot_no: lot?.lot_no,
      defectType,
      notes: defectNotes,
    });
    toast.success(`Fabric defect recorded: ₹${ded} deduction assigned to ${lot?.lot_no || 'lot'}`);
    closeDrawer();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      title={`${t.challan_defectModalTitle || 'Defect & Deduction'} • ${lot?.lot_no || ''}`}
      icon={<Scissors className="w-5 h-5 text-amber-600" />}
      level={level}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            type="submit"
            form={`defect-drawer-form-${instance.id}`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {t.save || 'Save Defect & Deduction'}
          </button>
        </div>
      }
    >
      <form id={`defect-drawer-form-${instance.id}`} onSubmit={handleSave} className="space-y-4">
        {lot && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.challan_defectTrader || 'Party / Trader'}</span>
              <span className="font-semibold text-slate-800">{lot.trader_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.challan_defectFabricQuality || 'Fabric Quality'}</span>
              <span className="font-semibold text-slate-800">{lot.fabric_quality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.challan_defectLotVolume || 'Lot Volume'}</span>
              <span className="font-mono font-bold text-slate-900">{lot.inward_meters} m ({lot.than_count} {t.challan_thThans || 'Thans'})</span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.challan_defectClassification || 'Defect Classification'}</label>
          <select
            value={defectType}
            onChange={(e) => setDefectType(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
          >
            <option value="Weft Cut / Needle Hole">{t.challan_defectOptWeftCut || 'Weft Cut / Needle Hole'}</option>
            <option value="Oil & Grease Stains">{t.challan_defectOptOilStains || 'Oil & Grease Stains'}</option>
            <option value="Metallic Yarn Breakage">{t.challan_defectOptYarnBreak || 'Metallic Yarn Breakage'}</option>
            <option value="Shade & Color Variation">{t.challan_defectOptShadeVar || 'Shade & Color Variation'}</option>
            <option value="Shrinkage & Width Shortage">{t.challan_defectOptShrinkage || 'Shrinkage & Width Shortage'}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_defectMeters || 'Defective Meters (m)'}</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={defectMeters}
              onChange={(e) => setDefectMeters(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_defectDebitRate || 'Debit Rate (₹ / m)'}</label>
            <input
              type="number"
              min="1"
              step="1"
              value={deductionRate}
              onChange={(e) => setDeductionRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between font-mono">
          <span className="text-xs font-medium text-rose-800">{t.challan_defectRecommendedDeduction || 'Calculated Deduction'}</span>
          <span className="text-sm font-bold text-rose-700">₹{(defectMeters * deductionRate).toFixed(2)}</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.challan_defectNotes || 'Inspection Notes / Reasons'}</label>
          <input
            type="text"
            placeholder="e.g. Sent 2 thans for manual mending before embroidery"
            value={defectNotes}
            onChange={(e) => setDefectNotes(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};
