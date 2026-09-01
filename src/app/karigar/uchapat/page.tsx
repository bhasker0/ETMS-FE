'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UchapatApi, UchapatApiItem, KarigarUchapatSummary } from '@/lib/api/uchapat';
import { KarigarsApi, KarigarApiItem } from '@/lib/api/karigars';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Wallet className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Cash Advance • Passbook & Ledger</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Uchapat Advances & Recovery Log
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Cash advances, UPI payouts, and fortnightly deductions per karigar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
              className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-medium text-xs flex items-center gap-1.5 rounded-md transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Operator</span>
            </button>

            <Link
              href="/karigar/hisab"
              className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-medium text-xs flex items-center gap-1.5 rounded-md transition cursor-pointer shadow-xs"
            >
              <span>Fortnight Hisab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => openDrawer('ADD_UCHAPAT', { karigarId: selectedKarigarId }, () => loadKarigarData(selectedKarigarId))}
              className="px-3.5 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Cash Advance</span>
            </button>
          </div>
        </div>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Selected Operator
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight truncate mt-1">
              {selectedKarigar?.name || 'None'}
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Unsettled Uchapat Balance
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight font-mono tabular-nums mt-1">
              {formatINR(totalUnsettledSum)}
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Operating Wage Model
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
              {selectedKarigar?.wage_type ? selectedKarigar.wage_type.replace(/_/g, ' ') : 'PIECE RATE'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Karigar Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {karigars.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKarigarId(k.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer rounded-lg ${
                selectedKarigarId === k.id
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border)]'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>

        {/* Empty state if no karigars */}
        {karigars.length === 0 && (
          <div className="p-12 text-center bg-[var(--bg-surface)] border border-[var(--border)] border-dashed rounded-xl space-y-3">
            <Wallet className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">No Operators Registered</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Add embroidery machine operators and karigars to initiate cash passbooks and advance ledgers
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
              className="px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs inline-flex items-center gap-1.5 transition rounded-md shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Operator</span>
            </button>
          </div>
        )}

        {/* Ledger Table */}
        {selectedKarigar && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold border-b border-[var(--border)] uppercase text-[0.6875rem]">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Advance Debit</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5">Purpose / Note</th>
                  <th className="p-3.5">Settlement Status</th>
                  <th className="p-3.5 text-right">Receipt Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                    <td className="p-3.5 font-mono font-medium text-[var(--text-main)]">
                      {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                      - {formatINR(tx.amount)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded text-[0.6875rem] font-mono font-semibold bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)]">
                        {tx.payment_mode}
                      </span>
                    </td>
                    <td className="p-3.5 text-[var(--text-muted)]">
                      {tx.reason || '-'}
                    </td>
                    <td className="p-3.5">
                      {tx.is_settled ? (
                        <span className="badge-pastel-green px-2 py-0.5 rounded text-[0.6875rem] font-semibold inline-flex items-center gap-1">
                          Settled
                        </span>
                      ) : (
                        <span className="badge-pastel-yellow px-2 py-0.5 rounded text-[0.6875rem] font-semibold inline-flex items-center gap-1">
                          Pending Deduction
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `*${activeCompany?.name || 'Embroidery Factory'}*\n\n` +
                          `*OPERATOR:* ${selectedKarigar.name}\n` +
                          `*DATE:* ${new Date(tx.date).toLocaleDateString('en-GB')}\n` +
                          `*AMOUNT:* ₹${Number(tx.amount || 0).toFixed(2)}\n` +
                          `*PAYMENT MODE:* ${tx.payment_mode}\n` +
                          `*NOTE:* ${tx.reason || '-'}\n\n` +
                          `ETMS FORENSIC CASH LEDGER`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-emerald-700 dark:text-emerald-400 border border-[var(--border)] transition inline-flex items-center gap-1 text-xs font-medium rounded shadow-xs"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp Slip</span>
                      </a>
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                      No advance transactions logged for current operator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

