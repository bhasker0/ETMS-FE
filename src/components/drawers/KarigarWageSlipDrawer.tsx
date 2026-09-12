'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { WageHisabApi } from '@/lib/api/wage-hisab';
import { UchapatApi } from '@/lib/api/uchapat';
import { toast } from 'sonner';
import { FileText, Printer, RefreshCw } from 'lucide-react';

export const KarigarWageSlipDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [selectedKarigarId, setSelectedKarigarId] = useState<string>('');
  const [karigarName, setKarigarName] = useState(instance.payload?.karigarName || '');
  const [period, setPeriod] = useState('16th Aug to 31st Aug 2026');
  const [totalStitchesK, setTotalStitchesK] = useState<number>(8500);
  const [ratePerK, setRatePerK] = useState<number>(2.40);
  const [bonusAddition, setBonusAddition] = useState<number>(500);
  const [uchapatDeduction, setUchapatDeduction] = useState<number>(6500);

  useEffect(() => {
    const loadKarigars = async () => {
      setLoading(true);
      try {
        const list = await KarigarsApi.getAll();
        setKarigars(list);
        if (list.length > 0) {
          const match = list.find((k) => k.id === instance.payload?.karigarId || k.name === instance.payload?.karigarName) || list[0];
          setSelectedKarigarId(match.id);
          setKarigarName(match.name);
          if (match.default_rate_per_meter) setRatePerK(match.default_rate_per_meter);
          calculateLiveWage(match.id);
        }
      } catch (err) {
        console.warn('Karigars load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadKarigars();
  }, [instance.payload?.karigarId, instance.payload?.karigarName]);

  const calculateLiveWage = async (kId: string) => {
    setCalculating(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const [hisabRes, uchapatRes] = await Promise.all([
        WageHisabApi.calculate({
          karigar_id: kId,
          startDate: firstDay,
          endDate: endDay,
        }).catch(() => null),
        UchapatApi.getAll({ karigar_id: kId, is_settled: false }).catch(() => []),
      ]);

      if (hisabRes) {
        if (hisabRes.total_stitches) {
          setTotalStitchesK(Math.round(hisabRes.total_stitches / 1000));
        } else if (hisabRes.total_meters) {
          setTotalStitchesK(Math.round(hisabRes.total_meters * 18));
        }
        if (hisabRes.rate_per_meter) {
          setRatePerK(hisabRes.rate_per_meter);
        }
        if (hisabRes.incentive_commission) {
          setBonusAddition(hisabRes.incentive_commission);
        }
      }

      if (Array.isArray(uchapatRes) && uchapatRes.length > 0) {
        const totalUpad = uchapatRes.reduce((acc, u) => acc + (Number(u.amount) || 0), 0);
        setUchapatDeduction(totalUpad);
      } else if (hisabRes?.total_uchapat_advances) {
        setUchapatDeduction(hisabRes.total_uchapat_advances);
      }
    } catch (err) {
      console.warn('Live hisab calculation warning:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleKarigarChange = (kId: string) => {
    setSelectedKarigarId(kId);
    const chosen = karigars.find((k) => k.id === kId);
    if (chosen) {
      setKarigarName(chosen.name);
      if (chosen.default_rate_per_meter) setRatePerK(chosen.default_rate_per_meter);
      calculateLiveWage(chosen.id);
    }
  };

  const grossEarnings = Math.round(totalStitchesK * ratePerK) + bonusAddition;
  const netPayable = grossEarnings - uchapatDeduction;

  const handlePrintSlip = () => {
    toast.success(`${t.wageSlip_title || 'Wage Slip'}: Printed for ${karigarName}`);
    window.print();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.wageSlip_title || 'Karigar Fortnightly Wage Hisab Slip'}
      subtitle={t.wageSlip_subtitle || 'Shift stitch summary, rate calculation, Uchapat advances deduction & net wage'}
      icon={<FileText className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handlePrintSlip}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.wageSlip_btnPrintSlip || 'Print Hisab Slip'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {(loading || calculating) && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Calculating live shift stitches & uchapat advances...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Select Karigar Operator</label>
            {karigars.length > 0 ? (
              <select
                value={selectedKarigarId}
                onChange={(e) => handleKarigarChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
              >
                {karigars.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.wage_type || 'Operator'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={karigarName}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold"
              />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Fortnight Cycle</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Stitches (k)</label>
            <input
              type="number"
              value={totalStitchesK}
              onChange={(e) => setTotalStitchesK(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Rate / 1k (₹)</label>
            <input
              type="number"
              step="0.05"
              value={ratePerK}
              onChange={(e) => setRatePerK(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Bonus / Add</label>
            <input
              type="number"
              value={bonusAddition}
              onChange={(e) => setBonusAddition(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.wageSlip_uchapatDeducted || 'Uchapat (Cash Advances Deducted)'}</label>
          <input
            type="number"
            value={uchapatDeduction}
            onChange={(e) => setUchapatDeduction(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-red-600 font-bold tabular-nums"
          />
        </div>

        {/* Dynamic Breakdown Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Gross Wage Earned:</span>
            <span className="font-bold text-slate-900">₹{grossEarnings.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Total Kharchi / Upad:</span>
            <span className="font-bold text-red-600">-₹{uchapatDeduction.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-base pt-2 border-t border-slate-200 font-bold">
            <span className="font-sans text-slate-900">{t.wageSlip_netPayable || 'Net Amount Payable'}:</span>
            <span className={netPayable >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              ₹{netPayable.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
