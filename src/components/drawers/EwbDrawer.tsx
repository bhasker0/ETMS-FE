'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useAuth } from '@/lib/auth-context';
import { formatINR } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 11. GST E-Way Bill Drawer Form (SCRUM-188)                                 */
/* -------------------------------------------------------------------------- */
export const EwbGenerationDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { activeCompany } = useAuth();
  const { t } = useI18n();
  const invoice = instance.payload?.invoice;

  const [vehicleNo, setVehicleNo] = useState('GJ05AB1234');
  const [transporterId, setTransporterId] = useState('24AAACT1234A1Z1');
  const [distanceKm, setDistanceKm] = useState<number>(45);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const ewbData = {
      supplyType: 'O',
      subSupplyType: '1',
      docType: 'INV',
      docNo: invoice.invoice_no,
      docDate: new Date(invoice.invoice_date).toLocaleDateString('en-GB'),
      fromGstin: activeCompany?.gstin || '24AAAAA0000A1Z5',
      fromTrdName: activeCompany?.name || 'Surat Embroidery Unit',
      toGstin: invoice.trader_gstin || 'URP',
      toTrdName: invoice.trader_name,
      totalValue: Number(invoice.taxable_amount),
      cgstValue: Number(invoice.cgst_amount),
      sgstValue: Number(invoice.sgst_amount),
      igstValue: Number(invoice.igst_amount),
      totInvValue: Number(invoice.net_amount),
      transDistance: distanceKm.toString(),
      transporterId: transporterId || undefined,
      transporterName: 'Surat Fast Logistics',
      transDocNo: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
      vehNo: vehicleNo,
      vehType: 'R',
    };

    const blob = new Blob([JSON.stringify(ewbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EWB-${invoice.invoice_no}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`E-Way Bill JSON generated for ${invoice.invoice_no}`);
    instance.onSuccess?.(ewbData);
    closeDrawer();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      title={`${t.invoice_ewbModalTitle || 'Generate GST E-Way Bill'} • ${invoice?.invoice_no || ''}`}
      icon={<Truck className="w-5 h-5 text-amber-600" />}
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
            form={`ewb-drawer-form-${instance.id}`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {t.invoice_ewbDownloadBtn || 'Download Official EWB JSON'}
          </button>
        </div>
      }
    >
      <form id={`ewb-drawer-form-${instance.id}`} onSubmit={handleGenerate} className="space-y-4">
        {invoice && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.invoice_ewbConsignor || 'Consignor (Supplier)'}</span>
              <span className="font-mono font-bold text-slate-800">{activeCompany?.gstin || '24AAAAA0000A1Z5'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.invoice_ewbConsignee || 'Consignee (Recipient)'}</span>
              <span className="font-semibold text-slate-800">{invoice.trader_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.invoice_ewbNet || 'Invoice Net Value'}</span>
              <span className="font-mono font-bold text-amber-900">{formatINR(invoice.net_amount)}</span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.invoice_ewbVehicleNo || 'Vehicle Number (Part B)'}</label>
          <input
            type="text"
            required
            placeholder="e.g. GJ05AB1234"
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600 uppercase"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_ewbTransporterId || 'Transporter GSTIN'}</label>
            <input
              type="text"
              placeholder="24AAACT1234A1Z1"
              value={transporterId}
              onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_ewbDistance || 'Distance (km)'}</label>
            <input
              type="number"
              min="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
};
