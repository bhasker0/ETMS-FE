'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { UchapatApi, PaymentMode } from '@/lib/api/uchapat';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 3. Uchapat Drawer Form (Record Cash/UPI Advance)                           */
/* -------------------------------------------------------------------------- */
export const UchapatDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState(instance.payload?.karigarId || '');
  const [amount, setAmount] = useState<number>(2000);
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Household / Ration Advance');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    KarigarsApi.getAll()
      .then((data) => {
        setKarigars(data);
        if (!selectedKarigarId && data.length > 0) {
          setSelectedKarigarId(data[0].id);
        }
      })
      .catch((e) => console.warn('Failed to load karigars in uchapat drawer:', e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKarigarId || amount <= 0) {
      toast.error('Please select karigar and specify valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const result = await UchapatApi.create({
        karigar_id: selectedKarigarId,
        amount: Number(amount),
        date: advanceDate,
        reason,
        payment_mode: paymentMode,
      });

      toast.success(`Advance of ₹${amount} recorded`);
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to log advance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedKarigar = karigars.find((k) => k.id === selectedKarigarId);

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.uchapat_drawerTitle}
      subtitle={t.uchapat_drawerSubtitle}
      icon={<CreditCard className="w-5 h-5 text-slate-700" />}
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
              const form = document.getElementById(`uchapat-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? t.uchapat_recording : t.uchapat_btnRecord}
          </button>
        </div>
      }
    >
      <form id={`uchapat-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelBeneficiary} *</label>
          <select
            value={selectedKarigarId}
            onChange={(e) => setSelectedKarigarId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.mobile})
              </option>
            ))}
          </select>
        </div>

        {selectedKarigar && (
          <div className="p-3 bg-slate-100 rounded-lg text-2xs text-slate-600 flex justify-between">
            <span>{t.karigar_thWageType}: <strong>{selectedKarigar.wage_type}</strong></span>
            <span>{t.karigar_thMobile}: <strong>{selectedKarigar.mobile}</strong></span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelAmount} *</label>
          <input
            type="number"
            min="100"
            step="100"
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelDisbursalDate} *</label>
          <input
            type="date"
            required
            value={advanceDate}
            onChange={(e) => setAdvanceDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelPaymentMode}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`py-2 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === mode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {mode === 'CASH' ? t.uchapat_modeCash : mode === 'UPI' ? t.uchapat_modeUpi : t.uchapat_modeBank}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelRemarks}</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};
