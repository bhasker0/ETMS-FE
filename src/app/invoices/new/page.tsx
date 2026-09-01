'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  OutwardInvoicesApi,
  CalculateInvoiceResult,
  CreateOutwardInvoiceDto,
} from '@/lib/api/invoices';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useAuth } from '@/lib/auth-context';
import { formatINR } from '@/lib/utils';
import {
  FileText,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const qChallanId = searchParams.get('challanId');

  // Inward challans list for linking
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  // Parties list for auto-fill
  const [parties, setParties] = useState<PartyApiItem[]>([]);

  const fetchParties = async () => {
    try {
      const list = await PartiesApi.getAll();
      setParties(list);
    } catch (e) {
      console.warn('Parties load error:', e);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeCompany?.id]);

  // Form State
  const [inwardChallanId, setInwardChallanId] = useState(qChallanId || '');
  const [traderName, setTraderName] = useState('Radhe Krishna Sarees');
  const [traderGstin, setTraderGstin] = useState('24AABCR1234F1Z1');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalStitches, setTotalStitches] = useState<number>(384000);
  const [machineHeads, setMachineHeads] = useState<number>(32);
  const [ratePer1000, setRatePer1000] = useState<number>(0.45);
  const [inwardMeters, setInwardMeters] = useState<number>(1000);
  const [outwardMeters, setOutwardMeters] = useState<number>(970);
  const [notes, setNotes] = useState('');

  // Live Calculation Preview State
  const [calcResult, setCalcResult] = useState<CalculateInvoiceResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const list = await InwardChallansApi.getAll();
        setChallans(list);
        if (qChallanId) {
          const selected = list.find((c) => c.id === qChallanId);
          if (selected) {
            setTraderName(selected.trader_name);
            setTraderGstin(selected.trader_gstin || '24AABCR1234F1Z1');
            setInwardMeters(selected.inward_meters);
            setOutwardMeters(Math.round(selected.inward_meters * 0.98));
          }
        }
      } catch (e) {
        console.warn('Challans load error:', e);
      }
    };
    fetchChallans();
  }, [qChallanId, activeCompany?.id]);

  // Trigger live calculation preview on parameter change
  useEffect(() => {
    const runCalculation = async () => {
      if (totalStitches <= 0 || ratePer1000 <= 0 || machineHeads <= 0) return;
      setCalculating(true);
      try {
        const result = await OutwardInvoicesApi.calculatePreview({
          total_stitches: Number(totalStitches),
          rate_per_1000: Number(ratePer1000),
          machine_heads: Number(machineHeads),
          inward_meters: Number(inwardMeters),
          outward_meters: Number(outwardMeters),
          trader_gstin: traderGstin,
        });
        setCalcResult(result);
      } catch (err) {
        // Fallback local calculation
        const gross = (Number(totalStitches) / 1000) * Number(ratePer1000) * Number(machineHeads);
        const isInter = traderGstin ? !traderGstin.startsWith('24') : false;
        const diff = Number(inwardMeters) - Number(outwardMeters);
        const shrinkPct = Number(inwardMeters) > 0 ? (diff / Number(inwardMeters)) * 100 : 0;

        setCalcResult({
          gross_amount: gross,
          cgst_rate: isInter ? 0 : 2.5,
          cgst_amount: isInter ? 0 : (gross * 2.5) / 100,
          sgst_rate: isInter ? 0 : 2.5,
          sgst_amount: isInter ? 0 : (gross * 2.5) / 100,
          igst_rate: isInter ? 5.0 : 0,
          igst_amount: isInter ? (gross * 5.0) / 100 : 0,
          net_amount: gross + (gross * 5.0) / 100,
          is_interstate: isInter,
          shrinkage_meters: diff,
          shrinkage_percent: Number(shrinkPct.toFixed(2)),
          is_shrinkage_exceeded: shrinkPct > 3.0,
          shrinkage_warning: shrinkPct > 3.0 ? 'Shrinkage exceeds 3.0% fabric tolerance' : undefined,
        });
      } finally {
        setCalculating(false);
      }
    };

    const timer = setTimeout(runCalculation, 250);
    return () => clearTimeout(timer);
  }, [totalStitches, ratePer1000, machineHeads, inwardMeters, outwardMeters, traderGstin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim()) {
      toast.error('Trader name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOutwardInvoiceDto = {
        inward_challan_id: inwardChallanId || undefined,
        trader_name: traderName,
        trader_gstin: traderGstin,
        invoice_date: invoiceDate,
        total_stitches: Number(totalStitches),
        machine_heads: Number(machineHeads),
        rate_per_1000: Number(ratePer1000),
        inward_meters: Number(inwardMeters),
        outward_meters: Number(outwardMeters),
        notes,
      };

      const created = await OutwardInvoicesApi.create(payload);
      toast.success(`[COMMITTED] SAC 9988 Invoice ${created?.invoice_no || ''} generated`);

      setTimeout(() => {
        router.push('/invoices');
      }, 500);
    } catch (err: any) {
      toast.error('Failed to create invoice: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-0.5">
              <FileText className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Tax Invoice Generator • SAC 9988</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Generate GST Job Work Invoice
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Input Parameters */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
              Invoice & Client Parameters
            </h2>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Link Inward Challan Lot (Optional)</label>
                <select
                  value={inwardChallanId}
                  onChange={(e) => {
                    setInwardChallanId(e.target.value);
                    const selected = challans.find((c) => c.id === e.target.value);
                    if (selected) {
                      setTraderName(selected.trader_name);
                      setTraderGstin(selected.trader_gstin || '24AABCR1234F1Z1');
                      setInwardMeters(selected.inward_meters);
                    }
                  }}
                  className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                >
                  <option value="">Direct Billing - No Challan Linked</option>
                  {challans.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.lot_no} • {ch.trader_name} ({ch.than_count} Thans)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Party Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Registered Trader Directory</label>
                  <button
                    type="button"
                    onClick={() =>
                      openDrawer('ADD_PARTY', {}, (newParty: PartyApiItem) => {
                        fetchParties();
                        setTraderName(newParty.name);
                        if (newParty.gstin) setTraderGstin(newParty.gstin);
                      })
                    }
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Trader</span>
                  </button>
                </div>
                <select
                  value={parties.find((p) => p.name === traderName)?.id || ''}
                  onChange={(e) => {
                    const selected = parties.find((p) => p.id === e.target.value);
                    if (selected) {
                      setTraderName(selected.name);
                      if (selected.gstin) setTraderGstin(selected.gstin);
                    }
                  }}
                  className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                >
                  <option value="">Choose registered trader from database</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.gstin ? `(${p.gstin})` : '(URP)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Trader Name *</label>
                <input
                  type="text"
                  required
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Trader GSTIN</label>
                  <input
                    type="text"
                    value={traderGstin}
                    onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono uppercase text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Stitches, Heads, Rate */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Total Stitches</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={totalStitches}
                    onChange={(e) => setTotalStitches(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Machine Heads</label>
                  <input
                    type="number"
                    value={machineHeads}
                    onChange={(e) => setMachineHeads(parseInt(e.target.value, 10) || 32)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Rate / 1k St.</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={ratePer1000}
                    onChange={(e) => setRatePer1000(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Inward vs Outward Meters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Inward Meters</label>
                  <input
                    type="number"
                    min="1"
                    value={inwardMeters}
                    onChange={(e) => setInwardMeters(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">Outward Meters</label>
                  <input
                    type="number"
                    min="1"
                    value={outwardMeters}
                    onChange={(e) => setOutwardMeters(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-2 text-xs font-mono text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Calculation & Shrinkage Breakdown Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Live Tax & Fabric Reconciliation
              </h2>
              <span className="badge-pastel-green px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold">SAC 9988</span>
            </div>

            {/* Formula display */}
            <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] font-mono">
              Formula: (Stitches / 1000) * Rate * Heads + 5% GST
            </div>

            {calcResult && (
              <div className="space-y-3">
                {/* Shrinkage Warning Banner */}
                {calcResult.is_shrinkage_exceeded ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">
                        Excess Shrinkage: {calcResult.shrinkage_percent}% (Tolerance 3.0%)
                      </span>
                      <span className="text-[0.6875rem]">
                        {calcResult.shrinkage_warning || 'High fabric loss deviation detected across lot.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fabric shrinkage within 3% tolerance: {calcResult.shrinkage_percent}%</span>
                  </div>
                )}

                {/* Calculation Breakdown */}
                <div className="border border-[var(--border)] rounded-xl overflow-hidden p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Taxable Gross Value:</span>
                    <span className="font-semibold text-[var(--text-main)] tabular-nums">{formatINR(calcResult.gross_amount)}</span>
                  </div>

                  {!calcResult.is_interstate ? (
                    <>
                      <div className="flex justify-between text-[var(--text-muted)] text-[0.6875rem]">
                        <span>CGST @ 2.5%:</span>
                        <span className="tabular-nums">{formatINR(calcResult.cgst_amount)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-muted)] text-[0.6875rem]">
                        <span>SGST @ 2.5%:</span>
                        <span className="tabular-nums">{formatINR(calcResult.sgst_amount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[var(--text-muted)] text-[0.6875rem]">
                      <span>IGST @ 5.0%:</span>
                      <span className="tabular-nums">{formatINR(calcResult.igst_amount)}</span>
                    </div>
                  )}

                  <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-bold text-[var(--text-main)]">
                    <span className="uppercase">Net Invoice Total:</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatINR(calcResult.net_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[var(--text-main)] hover:opacity-90 active:scale-[0.99] text-[var(--bg-surface)] font-semibold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Committing Invoice to Database...' : 'Commit Tax Invoice & Dispatch'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-medium font-mono">Loading form...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}

