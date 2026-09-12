'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { toast } from 'sonner';
import { ShieldCheck, Printer, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const ShrinkageCertificateDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChallanId, setSelectedChallanId] = useState<string>('');
  const [lotNo, setLotNo] = useState(instance.payload?.lotNo || '');
  const [partyName, setPartyName] = useState(instance.payload?.partyName || '');
  const [fabricQuality, setFabricQuality] = useState('60-Gram Georgette / 44"');
  const [inwardMeters, setInwardMeters] = useState<number>(1200);
  const [outwardMeters, setOutwardMeters] = useState<number>(1170);

  useEffect(() => {
    const loadLotData = async () => {
      setLoading(true);
      try {
        const [cList, invList] = await Promise.all([
          InwardChallansApi.getAll().catch(() => []),
          OutwardInvoicesApi.getAll().catch(() => []),
        ]);

        const rawChallans = Array.isArray(cList) ? cList : [];
        const rawInvoices = Array.isArray(invList) ? invList : [];

        setChallans(rawChallans);
        setInvoices(rawInvoices);

        if (rawChallans.length > 0) {
          const match = rawChallans.find((c) => c.lot_no === instance.payload?.lotNo) || rawChallans[0];
          setSelectedChallanId(match.id);
          setLotNo(match.lot_no);
          setPartyName(match.trader_name);
          setFabricQuality(match.fabric_quality || '60-Gram Georgette / 44"');
          setInwardMeters(match.inward_meters || 1200);

          // Find if there is an outward invoice linked to this challan
          const matchingInvoice = rawInvoices.find((inv) => inv.inward_challan_id === match.id || inv.lot_items?.some((l) => l.lot_no === match.lot_no));
          if (matchingInvoice && matchingInvoice.outward_meters) {
            setOutwardMeters(matchingInvoice.outward_meters);
          } else {
            // Default reasonable delivery calculation (97.5% of inward)
            setOutwardMeters(Number((match.inward_meters * 0.975).toFixed(1)));
          }
        }
      } catch (err) {
        console.warn('Shrinkage lot fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLotData();
  }, [instance.payload?.lotNo]);

  const handleChallanChange = (cId: string) => {
    setSelectedChallanId(cId);
    const chosen = challans.find((c) => c.id === cId);
    if (chosen) {
      setLotNo(chosen.lot_no);
      setPartyName(chosen.trader_name);
      setFabricQuality(chosen.fabric_quality || '60-Gram Georgette / 44"');
      setInwardMeters(chosen.inward_meters || 1200);

      const matchingInvoice = invoices.find((inv) => inv.inward_challan_id === chosen.id || inv.lot_items?.some((l) => l.lot_no === chosen.lot_no));
      if (matchingInvoice && matchingInvoice.outward_meters) {
        setOutwardMeters(matchingInvoice.outward_meters);
      } else {
        setOutwardMeters(Number((chosen.inward_meters * 0.975).toFixed(1)));
      }
    }
  };

  // Surat standard shrinkage formula: ((Inward - Outward) / Inward) * 100
  const shrinkageLossMeters = Number((inwardMeters - outwardMeters).toFixed(2));
  const shrinkagePercent = Number((((inwardMeters - outwardMeters) / (inwardMeters || 1)) * 100).toFixed(2));
  const isWithinTolerance = shrinkagePercent <= 3.0;

  const handlePrintCertificate = () => {
    toast.success(`${t.shrink_title || 'Shrinkage Certificate'}: Printed for Lot ${lotNo}`);
    window.print();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.shrink_title || 'Fabric Shrinkage & Loss Tolerance Certificate'}
      subtitle={t.shrink_subtitle || 'Scientific shrinkage calculation & quality certificate for textile traders'}
      icon={<ShieldCheck className="w-5 h-5 text-slate-700" />}
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
            onClick={handlePrintCertificate}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.shrink_btnPrintCert || 'Print Certificate'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading live inward challan lot records...</span>
          </div>
        )}

        {/* Live Lot Selector */}
        {challans.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Select Inward Fabric Lot</label>
            <select
              value={selectedChallanId}
              onChange={(e) => handleChallanChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {challans.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lot_no} — {c.trader_name} ({c.inward_meters} Mtrs, {c.fabric_quality})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Textile Trader / Party</label>
          <input
            type="text"
            readOnly
            value={partyName}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Lot Number</label>
            <input
              type="text"
              readOnly
              value={lotNo}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Fabric Quality</label>
            <input
              type="text"
              value={fabricQuality}
              onChange={(e) => setFabricQuality(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shrink_inwardMeters || 'Inward Gray Fabric (Mtrs)'}</label>
            <input
              type="number"
              value={inwardMeters}
              onChange={(e) => setInwardMeters(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shrink_outwardMeters || 'Outward Finished (Mtrs)'}</label>
            <input
              type="number"
              value={outwardMeters}
              onChange={(e) => setOutwardMeters(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 tabular-nums"
            />
          </div>
        </div>

        {/* Certificate Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-2">
            <span className="font-sans font-semibold text-slate-800">Shrinkage Formula:</span>
            <span>((Inward - Outward) / Inward) * 100</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-sans text-slate-600">Total Net Contraction:</span>
            <span className="font-bold text-slate-900">{shrinkageLossMeters} Meters</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <span className="font-sans font-bold text-slate-800">{t.shrink_calculatedRate || 'Shrinkage Rate'}:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={isWithinTolerance ? 'text-emerald-700' : 'text-amber-700'}>
                {shrinkagePercent}%
              </span>
              {isWithinTolerance ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
            </div>
          </div>

          <div className={`p-2.5 rounded-lg text-xs font-sans font-medium flex items-center gap-2 ${
            isWithinTolerance ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}>
            <span>
              {isWithinTolerance
                ? (t.shrink_statusPass || 'Within standard Surat textile industry tolerance (< 3.0%). Valid for full billing.')
                : (t.shrink_statusWarn || 'Excess shrinkage detected (> 3.0%). Requires job-work rate adjustment or fabric inspection.')}
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
