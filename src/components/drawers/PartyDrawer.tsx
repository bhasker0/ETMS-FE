'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { PartiesApi, PartyApiItem, CreatePartyDto } from '@/lib/api/parties';
import { formatINR } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 9. Party / Trader Drawer Form (Add / Edit)                                 */
/* -------------------------------------------------------------------------- */
export const PartyDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const editingItem = instance.payload?.party as PartyApiItem | undefined;

  const [name, setName] = useState(editingItem?.name || '');
  const [gstin, setGstin] = useState(editingItem?.gstin || '');
  const [mobile, setMobile] = useState(editingItem?.mobile || '');
  const [email, setEmail] = useState(editingItem?.email || '');
  const [address, setAddress] = useState(editingItem?.address || '');
  const [city, setCity] = useState(editingItem?.city || 'Surat');
  const [creditPeriodDays, setCreditPeriodDays] = useState(editingItem?.credit_period_days || 15);
  const [openingBalance, setOpeningBalance] = useState(editingItem?.opening_balance || 0);
  const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
  const [transactionSummary, setTransactionSummary] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem?.id) {
      PartiesApi.getById(editingItem.id)
        .then((res) => {
          if (res && res.transaction_summary) {
            setTransactionSummary(res.transaction_summary);
          }
        })
        .catch(() => {});
    }
  }, [editingItem?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Party / Trader name is required');
      return;
    }
    if (gstin && gstin.trim().length !== 15) {
      toast.error('GSTIN must be exactly 15 characters');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreatePartyDto = {
        name: name.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || 'Surat',
        state_code: '24',
        credit_period_days: Number(creditPeriodDays),
        opening_balance: Number(openingBalance),
        is_active: isActive,
      };

      let result: PartyApiItem;
      if (editingItem) {
        result = await PartiesApi.update(editingItem.id, payload);
        toast.success(`Party ${name} updated successfully`);
      } else {
        result = await PartiesApi.create(payload);
        toast.success(`Party ${name} registered successfully`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to save party: ' + (err.message || 'Error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={editingItem ? t.party_drawerEditTitle : t.party_drawerAddTitle}
      subtitle={t.party_drawerSubtitle}
      icon={<Briefcase className="w-5 h-5 text-slate-700" />}
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
              const form = document.getElementById(`party-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
          >
            {submitting ? t.saving : editingItem ? t.party_btnUpdate : t.party_btnRegister}
          </button>
        </div>
      }
    >
      <form id={`party-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        {transactionSummary && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">
              {t.party_activitySummary}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryInwardLots}</div>
                <div className="text-sm font-bold text-slate-900">{transactionSummary.total_challans}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryInvoices}</div>
                <div className="text-sm font-bold text-slate-900">{transactionSummary.total_invoices}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryBilledTotal}</div>
                <div className="text-xs font-bold font-mono text-emerald-700">{formatINR(transactionSummary.total_billed_amount)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.party_labelFirmName}</label>
          <input
            type="text"
            required
            placeholder="e.g., Shree Ram Tex Fab"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelGstin}</label>
            <input
              type="text"
              maxLength={15}
              placeholder="24ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelPhone}</label>
            <input
              type="tel"
              placeholder="9825198251"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelEmail}</label>
            <input
              type="email"
              placeholder="trader@textile.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelCity}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.party_labelAddress}</label>
          <textarea
            rows={2}
            placeholder="Plot / Mill / Ring Road Market Shop No..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelCreditTerms}</label>
            <input
              type="number"
              min={0}
              value={creditPeriodDays}
              onChange={(e) => setCreditPeriodDays(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelOpeningBalance}</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id={`party-active-${instance.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          <label htmlFor={`party-active-${instance.id}`} className="text-xs text-slate-700 font-medium">
            {t.party_labelActiveToggle}
          </label>
        </div>
      </form>
    </Drawer>
  );
};
