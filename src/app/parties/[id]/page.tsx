'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PartiesApi, PartyStatementResult } from '@/lib/api/parties';
import { useAuth } from '@/lib/auth-context';
import { formatINR, formatNumber } from '@/lib/utils';
import {
  Briefcase,
  ArrowLeft,
  Calendar,
  Share2,
  Printer,
  FileText,
  Truck,
  TrendingUp,
  AlertCircle,
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
    const text = `*JOBWORK LEDGER STATEMENT: ${p.name.toUpperCase()}*
*Factory Unit:* ${activeCompany?.name || 'Radhe Krishna Embroidery'}
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
      <div className="p-12 text-center text-muted-foreground bg-card border border-border font-mono">
        <p className="text-xs font-bold uppercase">{"/// LOADING PARTY STATEMENT & RUNNING KHATA LEDGER..."}</p>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="p-12 text-center bg-card border border-border space-y-3 font-mono">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h3 className="text-sm font-black text-foreground uppercase">{"/// PARTY RECORD NOT FOUND"}</h3>
        <p className="text-xs text-muted-foreground">The requested party ledger does not exist or has been removed.</p>
        <button
          onClick={() => router.push('/parties')}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase cursor-pointer"
          style={{ borderRadius: 0 }}
        >
          [BACK TO DIRECTORY]
        </button>
      </div>
    );
  }

  const { party, metrics, timeline } = statement;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/parties')}
              className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-lg transition shrink-0 mt-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--text-main)]" />
                  <span>Trader Khata Statement • SAC 9988</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                    party.is_active
                      ? 'badge-pastel-green'
                      : 'badge-pastel-yellow'
                  }`}
                >
                  {party.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight mt-1">{party.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)] mt-1">
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  GSTIN: {party.gstin || 'Unregistered'}
                </span>
                {party.mobile && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                    {party.mobile}
                  </span>
                )}
                {party.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                    {party.city} {party.address ? `• ${party.address}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <CreditCard className="w-3 h-3 text-[var(--text-muted)]" />
                  Credit Term: {party.credit_period_days || 15} Days
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] font-semibold text-xs rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ledger</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Khata</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Billed */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Total Billed (SAC 9988)
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-mono tabular-nums mt-1">
            {formatINR(metrics.total_billed_amount)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {metrics.total_invoices_count} Invoices • {formatNumber(metrics.total_outward_meters)} m
          </div>
        </div>

        {/* Closing Balance / Outstanding */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Current Outstanding
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1">
            {formatINR(metrics.closing_balance)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Incl. Opening: {formatINR(metrics.opening_balance)}
          </div>
        </div>

        {/* Inward Lots */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Total Inward Cloth
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {formatNumber(metrics.total_inward_meters)} m
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {metrics.total_inward_lots} Lot Challans
          </div>
        </div>

        {/* Fabric In Process */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Gray Fabric In Process
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-mono tabular-nums mt-1">
            {formatNumber(metrics.fabric_in_process_meters)} m
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Floor Production Quota
          </div>
        </div>
      </div>

      {/* Payment Aging Breakdown */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Payment Aging & Receivable Cycle</span>
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">Credit Term: {party.credit_period_days || 15} Days</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-1">
            <div className="text-[0.6875rem] font-semibold uppercase text-emerald-700 dark:text-emerald-400">0-15 Days Current</div>
            <div className="text-lg font-bold text-[var(--text-main)] font-mono tabular-nums">
              {formatINR(metrics.aging.within_15_days)}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">Standard Settlement</div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-1">
            <div className="text-[0.6875rem] font-semibold uppercase text-amber-700 dark:text-amber-400">16-30 Days Due</div>
            <div className="text-lg font-bold text-[var(--text-main)] font-mono tabular-nums">
              {formatINR(metrics.aging.days_16_to_30)}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">Reminder Queued</div>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg space-y-1">
            <div className="text-[0.6875rem] font-semibold uppercase text-rose-700 dark:text-rose-400">&gt;30 Days Overdue</div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums">
              {formatINR(metrics.aging.above_30_days)}
            </div>
            <div className="text-[0.6875rem] text-rose-600/80">Critical Collection</div>
          </div>
        </div>
      </div>

      {/* Date Filter & Statement Timeline */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface-elevated)]/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--text-main)]" />
            <h2 className="text-sm font-bold text-[var(--text-main)]">
              Chronological Khata Ledger ({timeline.length} Transactions)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-[var(--text-main)] font-mono focus:outline-none"
              />
              <span className="text-[var(--text-muted)] font-bold">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-[var(--text-main)] font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePreset('ALL_TIME')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition cursor-pointer ${
                  !startDate && !endDate
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handlePreset('THIS_MONTH')}
                className="px-2.5 py-1 text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] rounded-md transition cursor-pointer"
              >
                This Month
              </button>
              <button
                onClick={() => handlePreset('LAST_30')}
                className="px-2.5 py-1 text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-main)] rounded-md transition cursor-pointer"
              >
                Last 30D
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        {timeline.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-xs">
            No transactions recorded in selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-[0.6875rem] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Ref No</th>
                  <th className="p-3.5">Particulars</th>
                  <th className="p-3.5">Quantity / Spec</th>
                  <th className="p-3.5 text-right">Debit (+)</th>
                  <th className="p-3.5 text-right">Credit (-)</th>
                  <th className="p-3.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-main)]">
                {/* Opening Balance Row */}
                <tr className="bg-[var(--bg-surface-elevated)]/40 font-semibold">
                  <td className="p-3.5 font-mono text-[var(--text-muted)]">—</td>
                  <td className="p-3.5">
                    <span className="badge-pastel-yellow px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                      Opening
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-muted)]">—</td>
                  <td className="p-3.5">Opening Balance Recorded</td>
                  <td className="p-3.5 text-[var(--text-muted)]">—</td>
                  <td className="p-3.5 text-right font-mono font-semibold tabular-nums">
                    {metrics.opening_balance > 0 ? formatINR(metrics.opening_balance) : '—'}
                  </td>
                  <td className="p-3.5 text-right font-mono text-[var(--text-muted)]">—</td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatINR(metrics.opening_balance)}
                  </td>
                </tr>

                {/* Event Rows */}
                {timeline.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-surface-elevated)]/50 transition">
                    <td className="p-3.5 font-mono whitespace-nowrap text-[var(--text-muted)]">{item.date}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      {item.type === 'INWARD_LOT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.6875rem] font-semibold badge-pastel-blue">
                          <Truck className="w-3 h-3" />
                          <span>Inward Lot</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.6875rem] font-semibold badge-pastel-green">
                          <FileText className="w-3 h-3" />
                          <span>Invoice</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-[var(--text-main)] whitespace-nowrap">
                      {item.ref_no}
                    </td>
                    <td className="p-3.5 max-w-xs">{item.particulars}</td>
                    <td className="p-3.5 font-mono whitespace-nowrap text-[var(--text-muted)]">{item.quantity_info}</td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[var(--text-main)] whitespace-nowrap tabular-nums">
                      {item.debit > 0 ? formatINR(item.debit) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                      {item.credit > 0 ? formatINR(item.credit) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
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


