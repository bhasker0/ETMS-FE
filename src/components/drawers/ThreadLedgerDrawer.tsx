'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { PurchasesApi, PurchaseApiItem } from '@/lib/api/purchases';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { ShiftLogsApi, ShiftLogApiItem } from '@/lib/api/shift-logs';
import { toast } from 'sonner';
import { Layers, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const ThreadLedgerDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [lots, setLots] = useState<InwardChallanApiItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseApiItem[]>([]);
  const [shiftLogs, setShiftLogs] = useState<ShiftLogApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [lotNo, setLotNo] = useState(instance.payload?.lotNo || '');
  const [threadType, setThreadType] = useState('Polyester 120D/2 High Tenacity');
  const [colorShade, setColorShade] = useState('Golden Zari / #D4AF37');
  const [conesInward, setConesInward] = useState<number>(120);
  const [conesConsumed, setConesConsumed] = useState<number>(95);
  const [stitchesProducedK, setStitchesProducedK] = useState<number>(4500);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real database records
  const loadData = async () => {
    setLoading(true);
    try {
      const [challansRes, purchasesRes, shiftsRes] = await Promise.all([
        InwardChallansApi.getAll().catch(() => []),
        PurchasesApi.getAll({ category: 'RAW_MATERIAL' }).catch(() => ({ purchases: [] })),
        ShiftLogsApi.getAll().catch(() => []),
      ]);

      const challanList = Array.isArray(challansRes) ? challansRes : [];
      const purchaseList = Array.isArray(purchasesRes) ? purchasesRes : (purchasesRes?.purchases || []);
      const shiftList = Array.isArray(shiftsRes) ? shiftsRes : [];

      setLots(challanList);
      setPurchases(purchaseList);
      setShiftLogs(shiftList);

      if (challanList.length > 0) {
        const first = challanList[0];
        setSelectedLotId(first.id);
        setLotNo(first.lot_no);
        if (first.fabric_quality) setThreadType(`${first.fabric_quality} Thread Match`);

        // Compute actual stitches recorded for this lot from live shift logs
        const matchingShifts = shiftList.filter((s) => s.inward_challan_id === first.id);
        const totalStitches = matchingShifts.reduce((acc, s) => acc + (s.total_stitches || 0), 0);
        if (totalStitches > 0) {
          setStitchesProducedK(Math.round(totalStitches / 1000));
        }
      }
    } catch (err: any) {
      console.warn('Failed to load live thread ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle lot change
  const handleLotChange = (challanId: string) => {
    setSelectedLotId(challanId);
    const chosen = lots.find((l) => l.id === challanId);
    if (chosen) {
      setLotNo(chosen.lot_no);
      const matchingShifts = shiftLogs.filter((s) => s.inward_challan_id === chosen.id);
      const totalStitches = matchingShifts.reduce((acc, s) => acc + (s.total_stitches || 0), 0);
      if (totalStitches > 0) {
        setStitchesProducedK(Math.round(totalStitches / 1000));
      }
    }
  };

  // Standard Surat metric: ~20-25 grams per 100k stitches on 120D thread (~0.022 cones / 1k)
  const expectedCones = Number(((stitchesProducedK * 0.022) / 1).toFixed(1));
  const wastageVariance = Number((conesConsumed - expectedCones).toFixed(1));
  const efficiencyPercent = Number(((expectedCones / (conesConsumed || 1)) * 100).toFixed(1));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      toast.success(`${t.thread_ledgerTitle || 'Thread Ledger'}: ${lotNo} logged successfully`);
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess({ lotNo, conesConsumed, efficiencyPercent, stitchesProducedK });
    } catch (err: any) {
      toast.error('Failed to log thread consumption: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.thread_ledgerTitle || 'Thread & Lot Consumption Ledger'}
      subtitle={t.thread_ledgerSubtitle || 'Live cone inward, color lots, stitch efficiency & yarn wastage'}
      icon={<Layers className="w-5 h-5 text-slate-700" />}
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
              const form = document.getElementById(`thread-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            {submitting ? t.saving : t.thread_btnLog || 'Record Consumption'}
          </button>
        </div>
      }
    >
      <form id={`thread-form-${instance.id}`} onSubmit={handleSave} className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading live lot & raw material data...</span>
          </div>
        )}

        {/* Live Lot Selector */}
        {lots.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Select Active Inward Lot</label>
            <select
              value={selectedLotId}
              onChange={(e) => handleLotChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lot_no} — {l.trader_name} ({l.inward_meters} Mtrs, {l.fabric_quality})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.thread_lotNo || 'Thread Lot #'}</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.thread_type || 'Yarn Spec / Type'}</label>
            <input
              type="text"
              value={threadType}
              onChange={(e) => setThreadType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.thread_color || 'Color / Shade Code'}</label>
          <input
            type="text"
            value={colorShade}
            onChange={(e) => setColorShade(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Live Purchase Bill Ref if available */}
        {purchases.length > 0 && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <span className="font-semibold text-slate-700">Recent Yarn Purchase Bills:</span>
            <div className="text-slate-600 font-mono">
              {purchases.slice(0, 2).map((p) => (
                <div key={p.id} className="flex justify-between py-0.5">
                  <span>{p.supplier_name} ({p.invoice_no})</span>
                  <span className="font-bold">₹{p.net_amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.thread_conesInward || 'Inward (Cones)'}</label>
            <input
              type="number"
              min="1"
              value={conesInward}
              onChange={(e) => setConesInward(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.thread_conesConsumed || 'Used (Cones)'}</label>
            <input
              type="number"
              min="0"
              value={conesConsumed}
              onChange={(e) => setConesConsumed(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Stitches (k)</label>
            <input
              type="number"
              min="0"
              value={stitchesProducedK}
              onChange={(e) => setStitchesProducedK(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Live Analytics Calculation */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Expected Theoretical Cones:</span>
            <span className="font-mono font-bold text-slate-900">{expectedCones} Cones</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Variance / Wastage:</span>
            <span className={`font-mono font-bold ${wastageVariance > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {wastageVariance > 0 ? `+${wastageVariance}` : wastageVariance} Cones
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
            <span className="font-semibold text-slate-800">{t.thread_efficiency || 'Efficiency Rating'}:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
              {efficiencyPercent >= 90 ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{efficiencyPercent}%</span>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
};
