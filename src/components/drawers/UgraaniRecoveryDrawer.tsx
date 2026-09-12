'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { OutwardInvoicesApi, OutwardInvoiceApiItem } from '@/lib/api/invoices';
import { toast } from 'sonner';
import { IndianRupee, Send, RefreshCw } from 'lucide-react';

export const UgraaniRecoveryDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();

  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [invoices, setInvoices] = useState<OutwardInvoiceApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [traderName, setTraderName] = useState(instance.payload?.traderName || '');
  const [traderPhone, setTraderPhone] = useState(instance.payload?.traderPhone || '');

  const [bucket0to30, setBucket0to30] = useState<number>(0);
  const [bucket31to60, setBucket31to60] = useState<number>(0);
  const [bucket61to90Plus, setBucket61to90Plus] = useState<number>(0);
  const annualInterestRate = 18; // Surat market standard: 1.5% per month = 18% p.a.

  useEffect(() => {
    const loadPartyLedgers = async () => {
      setLoading(true);
      try {
        const [pList, invList] = await Promise.all([
          PartiesApi.getAll().catch(() => []),
          OutwardInvoicesApi.getAll().catch(() => []),
        ]);

        const rawParties = Array.isArray(pList) ? pList : [];
        const rawInvoices = Array.isArray(invList) ? invList : [];

        setParties(rawParties);
        setInvoices(rawInvoices);

        if (rawParties.length > 0) {
          const match = rawParties.find((p) => p.name === instance.payload?.traderName) || rawParties[0];
          setSelectedPartyId(match.id);
          setTraderName(match.name);
          setTraderPhone(match.mobile || '+91 98250 12345');
          computeAgingBuckets(match.name, rawInvoices);
        }
      } catch (err) {
        console.warn('Ugraani party fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPartyLedgers();
  }, [instance.payload?.traderName]);

  const computeAgingBuckets = (party: string, invList: OutwardInvoiceApiItem[]) => {
    const partyInvoices = invList.filter(
      (inv) => inv.trader_name === party || inv.party?.name === party
    );

    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;

    const now = new Date().getTime();

    partyInvoices.forEach((inv) => {
      const invDate = new Date(inv.invoice_date || inv.created_at || now).getTime();
      const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      const amount = Number(inv.net_amount || 0);

      if (diffDays <= 30) {
        b0_30 += amount;
      } else if (diffDays <= 60) {
        b31_60 += amount;
      } else {
        b61_90 += amount;
      }
    });

    // If no unpaid invoices found, provide minimum base calculation from ledger
    if (b0_30 === 0 && b31_60 === 0 && b61_90 === 0 && partyInvoices.length > 0) {
      b0_30 = Math.round(partyInvoices.reduce((a, b) => a + (Number(b.net_amount) || 0), 0) * 0.4);
      b31_60 = Math.round(partyInvoices.reduce((a, b) => a + (Number(b.net_amount) || 0), 0) * 0.6);
    }

    setBucket0to30(b0_30);
    setBucket31to60(b31_60);
    setBucket61to90Plus(b61_90);
  };

  const handlePartyChange = (pId: string) => {
    setSelectedPartyId(pId);
    const chosen = parties.find((p) => p.id === pId);
    if (chosen) {
      setTraderName(chosen.name);
      setTraderPhone(chosen.mobile || '+91 98250 12345');
      computeAgingBuckets(chosen.name, invoices);
    }
  };

  const totalOutstanding = bucket0to30 + bucket31to60 + bucket61to90Plus;
  const calculatedInterest = Math.round(bucket61to90Plus * (annualInterestRate / 100) * (30 / 365));

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `*શ્રી ${traderName}*,\nતમારી એમ્બ્રોઇડરી જોબ વર્ક ચુકવણી બાકી વિગત:\n• ૬૦+ દિવસ બાકી: ₹${bucket61to90Plus.toLocaleString('en-IN')}\n• કુલ બાકી રકમ: ₹${totalOutstanding.toLocaleString('en-IN')}\nકૃપા કરી વહેલી તકે RTGS/Cheque દ્વારા ક્લિયર કરશોજી.`
    );
    window.open(`https://wa.me/${traderPhone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    toast.success('WhatsApp Ugraani reminder draft opened');
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.ugraani_title || 'Textile Trader Ugraani & Recovery Pipeline'}
      subtitle={t.ugraani_subtitle || 'Credit aging buckets, interest on delayed payment & WhatsApp reminder'}
      icon={<IndianRupee className="w-5 h-5 text-slate-700" />}
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
            onClick={handleSendWhatsApp}
            className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.ugraani_btnSendWa || 'Send WhatsApp Reminder'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Loading live party ledgers & outstanding bills...</span>
          </div>
        )}

        {/* Live Party Selector */}
        {parties.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Select Textile Trader / Party</label>
            <select
              value={selectedPartyId}
              onChange={(e) => handlePartyChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-semibold"
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.gstin ? `(${p.gstin})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">WhatsApp Contact</label>
          <input
            type="text"
            value={traderPhone}
            onChange={(e) => setTraderPhone(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>

        {/* Dynamic Aging Buckets */}
        <div className="space-y-2">
          <label className="text-xs text-slate-700 font-medium">Live Credit Aging Breakdown</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">0 - 30 Days</span>
              <p className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                ₹{bucket0to30.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-1">
              <span className="text-[11px] text-amber-700 font-medium">31 - 60 Days</span>
              <p className="font-mono font-bold text-amber-900 text-sm tabular-nums">
                ₹{bucket31to60.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-1">
              <span className="text-[11px] text-red-700 font-medium">61 - 90+ Days</span>
              <p className="font-mono font-bold text-red-900 text-sm tabular-nums">
                ₹{bucket61to90Plus.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Total Balance Outstanding:</span>
            <span className="font-bold text-slate-900 text-sm">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-sans">Interest Accrual (1.5%/mo on 60+d):</span>
            <span className="font-bold text-red-600">+₹{calculatedInterest.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
