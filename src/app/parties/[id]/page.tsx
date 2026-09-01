'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PartiesApi, PartyStatementResult } from '@/lib/api/parties';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  Briefcase,
  ArrowLeft,
  Calendar,
  Download,
  Share2,
  Printer,
  FileText,
  Truck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PartyStatementPage() {
  const params = useParams();
  const router = useRouter();
  const partyId = params?.id as string;
  const { activeCompany } = useAuth();
  const { t } = useI18n();

  const [statement, setStatement] = useState<PartyStatementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatement = useCallback(async () => {
    if (!partyId) return;
    setLoading(true);
    try {
      const res: any = await PartiesApi.getStatement(partyId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const data = res?.party ? res : res?.data || res;
      setStatement(data);
    } catch (err: any) {
      console.error('Statement error:', err);
      toast.error('Failed to load party statement: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  }, [partyId, startDate, endDate]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement, activeCompany?.id]);

  const handlePreset = (preset: 'THIS_MONTH' | 'LAST_30' | 'ALL_TIME') => {
    const today = new Date();
    if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'LAST_30') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!statement) return;
    const p = statement.party;
    const m = statement.metrics;
    const text = `*Jobwork Ledger Statement: ${p.name}*
*Factory:* ${activeCompany?.name || 'Radhe Krishna Embroidery'}
*GSTIN:* ${p.gstin || 'URP / Unregistered'}
------------------------------------
*Total Inward Lots:* ${m.total_inward_lots} (${formatNumber(m.total_inward_meters)}m)
*Total Invoices:* ${m.total_invoices_count} (${formatNumber(m.total_outward_meters)}m)
*Total Billed:* ${formatINR(m.total_billed_amount)}
*Fabric In Process:* ${formatNumber(m.fabric_in_process_meters)}m
*Current Outstanding:* ${formatINR(m.closing_balance)}
------------------------------------
*Aging Status:*
- 0-15 Days: ${formatINR(m.aging.within_15_days)}
- 16-30 Days: ${formatINR(m.aging.days_16_to_30)}
- >30 Days: ${formatINR(m.aging.above_30_days)}
------------------------------------
Generated via Surat Embroidery Micro-ERP (SAC 9988)`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading && !statement) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
        <div className="animate-spin w-8 h-8 border-3 border-[#0099B8] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-medium">Loading Party Statement & Ledger...</p>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Party Record Not Found</h3>
        <p className="text-xs text-slate-500">The requested party ledger does not exist or has been removed.</p>
        <button
          onClick={() => router.push('/parties')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Back to Parties Directory
        </button>
      </div>
    );
  }

  const { party, metrics, timeline } = statement;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/parties')}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {t.ledger_title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                    party.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {party.is_active ? t.party_active : t.party_inactive}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{party.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-2xs text-slate-700 border border-slate-200">
                  GSTIN: {party.gstin || t.party_unregistered}
                </span>
                {party.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {party.mobile}
                  </span>
                )}
                {party.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {party.city} {party.address ? `• ${party.address}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-500">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  {t.ledger_creditTerm} {party.credit_period_days || 15} {t.party_daysUnit}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{t.ledger_printPdf}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.ledger_whatsappKhata}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs font-bold uppercase tracking-wider">{t.ledger_totalBilled}</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatINR(metrics.total_billed_amount)}
          </div>
          <div className="text-2xs text-slate-500">
            {metrics.total_invoices_count} {t.ledger_invoicesGen} • {formatNumber(metrics.total_outward_meters)} {t.ledger_meters}
          </div>
        </div>

        {/* Closing Balance / Outstanding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs font-bold uppercase tracking-wider">{t.ledger_outstanding}</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {formatINR(metrics.closing_balance)}
          </div>
          <div className="text-2xs text-slate-500">
            {t.ledger_includesOpening} {formatINR(metrics.opening_balance)}
          </div>
        </div>

        {/* Inward Lots */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs font-bold uppercase tracking-wider">{t.ledger_totalInward}</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatNumber(metrics.total_inward_meters)} m
          </div>
          <div className="text-2xs text-slate-500">
            {metrics.total_inward_lots} {t.ledger_challansRegistered}
          </div>
        </div>

        {/* Fabric In Process */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-2xs font-bold uppercase tracking-wider">{t.ledger_fabricInProcess}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {formatNumber(metrics.fabric_in_process_meters)} m
          </div>
          <div className="text-2xs text-slate-500">
            {t.ledger_pendingJobwork}
          </div>
        </div>
      </div>

      {/* Payment Aging Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{t.ledger_agingBreakdown}</span>
          </h2>
          <span className="text-2xs text-slate-500">{t.ledger_creditTerm} {party.credit_period_days || 15} {t.party_daysUnit}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="text-2xs font-bold uppercase text-emerald-800">{t.ledger_current15}</div>
            <div className="text-lg font-bold text-emerald-900 font-mono">
              {formatINR(metrics.aging.within_15_days)}
            </div>
            <div className="text-2xs text-emerald-700">{t.ledger_standardCycle}</div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="text-2xs font-bold uppercase text-amber-800">{t.ledger_due30}</div>
            <div className="text-lg font-bold text-amber-900 font-mono">
              {formatINR(metrics.aging.days_16_to_30)}
            </div>
            <div className="text-2xs text-amber-700">{t.ledger_followupRecommended}</div>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="text-2xs font-bold uppercase text-rose-800">{t.ledger_overdue30}</div>
            <div className="text-lg font-bold text-rose-900 font-mono">
              {formatINR(metrics.aging.above_30_days)}
            </div>
            <div className="text-2xs text-rose-700">{t.ledger_criticalOverdue}</div>
          </div>
        </div>
      </div>

      {/* Date Filter & Statement Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">
              {t.ledger_chronologicalEntries} ({timeline.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none"
              />
              <span className="text-slate-400">{t.ledger_to}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePreset('ALL_TIME')}
                className={`px-2.5 py-1 rounded text-2xs font-semibold border transition ${
                  !startDate && !endDate
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.ledger_presetAllTime}
              </button>
              <button
                onClick={() => handlePreset('THIS_MONTH')}
                className="px-2.5 py-1 rounded text-2xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
              >
                {t.ledger_presetThisMonth}
              </button>
              <button
                onClick={() => handlePreset('LAST_30')}
                className="px-2.5 py-1 rounded text-2xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
              >
                {t.ledger_presetLast30}
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        {timeline.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {t.ledger_noTransactions}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-3.5">{t.ledger_thDate}</th>
                  <th className="p-3.5">{t.ledger_thType}</th>
                  <th className="p-3.5">{t.ledger_thRefNo}</th>
                  <th className="p-3.5">{t.ledger_thParticulars}</th>
                  <th className="p-3.5">{t.ledger_thQuantity}</th>
                  <th className="p-3.5 text-right">{t.ledger_thDebit}</th>
                  <th className="p-3.5 text-right">{t.ledger_thCredit}</th>
                  <th className="p-3.5 text-right">{t.ledger_thRunningBalance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Opening Balance Row */}
                <tr className="bg-slate-50/50 font-semibold">
                  <td className="p-3.5 font-mono text-slate-500">—</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-2xs bg-slate-200 text-slate-700 font-bold">
                      {t.ledger_openingRow}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">—</td>
                  <td className="p-3.5">{t.ledger_openingDesc}</td>
                  <td className="p-3.5 text-slate-400">—</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    {metrics.opening_balance > 0 ? formatINR(metrics.opening_balance) : '—'}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">—</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(metrics.opening_balance)}
                  </td>
                </tr>

                {/* Event Rows */}
                {timeline.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono whitespace-nowrap">{item.date}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      {item.type === 'INWARD_LOT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Truck className="w-3 h-3" />
                          {t.ledger_typeInwardLot}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <FileText className="w-3 h-3" />
                          {t.ledger_typeInvoice}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.ref_no}
                    </td>
                    <td className="p-3.5 max-w-xs">{item.particulars}</td>
                    <td className="p-3.5 font-mono whitespace-nowrap text-slate-600">{item.quantity_info}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.debit > 0 ? formatINR(item.debit) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400 whitespace-nowrap">
                      {item.credit > 0 ? formatINR(item.credit) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(item.running_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
