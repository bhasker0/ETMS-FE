'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UchapatApi, UchapatApiItem, KarigarUchapatSummary } from '@/lib/api/uchapat';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
import { formatINR } from '@/lib/utils';
import {
  Wallet,
  Plus,
  ArrowRight,
  Share2,
} from 'lucide-react';

export default function KarigarUchapatPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState<string>('');
  const [transactions, setTransactions] = useState<UchapatApiItem[]>([]);
  const [summary, setSummary] = useState<KarigarUchapatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKarigarData = useCallback(async (karigarId: string) => {
    if (!karigarId) return;
    try {
      const [txList, sum] = await Promise.all([
        UchapatApi.getAll({ karigar_id: karigarId }),
        UchapatApi.getSummaryByKarigar(karigarId).catch(() => null),
      ]);
      setTransactions(txList);
      setSummary(sum);
    } catch (e: any) {
      console.warn('Karigar ledger load error:', e);
    }
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const kList = await KarigarsApi.getAll();
        setKarigars(kList);
        if (kList.length > 0) {
          setSelectedKarigarId(kList[0].id);
        }
      } catch (e: any) {
        console.warn('Uchapat init error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [activeCompany?.id]);

  useEffect(() => {
    if (selectedKarigarId) {
      loadKarigarData(selectedKarigarId);
    }
  }, [selectedKarigarId, loadKarigarData]);

  const selectedKarigar = karigars.find((k) => k.id === selectedKarigarId) || karigars[0];

  const totalUnsettledSum = transactions
    .filter((tx) => !tx.is_settled)
    .reduce((acc, tx) => acc + Number(tx.amount), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.uchapatTitle}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.uchapatTitle}
            </h1>
            <p className="text-xs text-slate-500">
              {t.uchapat_passbookSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                openDrawer('ADD_KARIGAR', {}, async (createdKarigar?: any) => {
                  const kList = await KarigarsApi.getAll();
                  setKarigars(kList);
                  if (createdKarigar?.id) {
                    setSelectedKarigarId(createdKarigar.id);
                  }
                })
              }
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.uchapat_btnNewKarigar}</span>
            </button>

            <Link
              href="/karigar/hisab"
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <span>{t.uchapat_btnFortnightHisab}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => openDrawer('ADD_UCHAPAT', { karigarId: selectedKarigarId }, () => loadKarigarData(selectedKarigarId))}
              className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.uchapat_btnGiveAdvance}</span>
            </button>
          </div>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Wallet className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.uchapat_selectedKarigarChip} <strong className="font-bold text-slate-900">{selectedKarigar?.name || 'None'}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <span>{t.uchapat_unsettledChip} <strong className="font-bold text-rose-700">{formatINR(totalUnsettledSum)}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span>{t.uchapat_wageModelChip} <strong className="font-bold text-slate-900">{selectedKarigar?.wage_type || 'PIECE_RATE'}</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Karigar Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
          {karigars.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKarigarId(k.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedKarigarId === k.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>

        {/* Empty state if no karigars */}
        {karigars.length === 0 && (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">{t.karigar_noKarigars}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t.karigar_directorySubtitle}
            </p>
            <button
              onClick={() =>
                openDrawer('ADD_KARIGAR', {}, async (createdKarigar?: any) => {
                  const kList = await KarigarsApi.getAll();
                  setKarigars(kList);
                  if (createdKarigar?.id) {
                    setSelectedKarigarId(createdKarigar.id);
                  }
                })
              }
              className="px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.uchapat_btnNewKarigar}</span>
            </button>
          </div>
        )}

        {/* Ledger Table */}
        {selectedKarigar && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{t.uchapat_thDate}</th>
                    <th className="p-3.5">{t.uchapat_thAmount}</th>
                    <th className="p-3.5">{t.uchapat_thPaymentMode}</th>
                    <th className="p-3.5">{t.uchapat_thReason}</th>
                    <th className="p-3.5">{t.uchapat_thStatus}</th>
                    <th className="p-3.5 text-right">{t.karigar_thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-slate-600">
                        {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-rose-600 text-sm">
                        - {formatINR(tx.amount)}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-2xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.payment_mode}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {tx.reason || '-'}
                      </td>
                      <td className="p-3.5">
                        {tx.is_settled ? (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {t.uchapat_statusSettled}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {t.uchapat_statusPending}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*${activeCompany?.name || 'Embroidery Factory'}*\n\n` +
                            `*${t.navKarigars}:* ${selectedKarigar.name}\n` +
                            `*${t.uchapat_thDate}:* ${new Date(tx.date).toLocaleDateString('en-GB')}\n` +
                            `*${t.uchapat_thAmount}:* ₹${Number(tx.amount || 0).toFixed(2)}\n` +
                            `*${t.uchapat_thPaymentMode}:* ${tx.payment_mode}\n` +
                            `*${t.uchapat_thReason}:* ${tx.reason || '-'}\n\n` +
                            `ETMS`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-md transition inline-flex items-center gap-1 text-2xs font-medium"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}

                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {t.uchapat_noTransactions}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
