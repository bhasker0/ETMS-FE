'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  OutwardInvoicesApi,
  CalculateInvoiceResult,
  CreateOutwardInvoiceDto,
} from '@/lib/api/invoices';
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { useAuth } from '@/lib/auth-context';
import { formatINR } from '@/lib/utils';
import {
  FileText,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCompany } = useAuth();

  const qChallanId = searchParams.get('challanId');

  // Inward challans list for linking
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);

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
      toast.success(`SAC 9988 Invoice ${created?.invoice_no || ''} created`);

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>GST SAC 9988 • Embroidery Jobwork Invoice Creator</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Outward Invoice (નવું જીએસટી બીલ)
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Input Parameters */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Trader & Stitch Parameters
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">Link Inward Lot (Optional)</label>
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                >
                  <option value="">-- Direct Billing / Standalone Lot --</option>
                  {challans.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.lot_no} • {ch.trader_name} ({ch.than_count} Thans)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">Trader Name (વેપારી પેઢી) *</label>
                <input
                  type="text"
                  required
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
                  <input
                    type="text"
                    value={traderGstin}
                    onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-medium">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Stitches, Heads, Rate */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-2xs text-slate-600 font-semibold uppercase">Total Stitches *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={totalStitches}
                    onChange={(e) => setTotalStitches(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-2xs text-slate-600 font-semibold uppercase">Machine Heads</label>
                  <input
                    type="number"
                    value={machineHeads}
                    onChange={(e) => setMachineHeads(parseInt(e.target.value, 10) || 32)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-2xs text-slate-600 font-semibold uppercase">Rate / 1k St. (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={ratePer1000}
                    onChange={(e) => setRatePer1000(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Inward vs Outward Meters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-medium">Inward Gray Meters</label>
                  <input
                    type="number"
                    min="1"
                    value={inwardMeters}
                    onChange={(e) => setInwardMeters(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-medium">Outward Finished Meters</label>
                  <input
                    type="number"
                    min="1"
                    value={outwardMeters}
                    onChange={(e) => setOutwardMeters(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Calculation & Shrinkage Breakdown Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Calculation & GST 5% Breakdown
              </h2>
              <span className="text-2xs text-slate-500 font-mono">SAC 9988</span>
            </div>

            {/* Formula display */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-2xs text-slate-500 font-mono">
              Gross = (Total Stitches ÷ 1000) × Rate × Machine Heads
            </div>

            {calcResult && (
              <div className="space-y-3">
                {/* Shrinkage Warning Banner */}
                {calcResult.is_shrinkage_exceeded ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold block">
                        Shrinkage Warning: {calcResult.shrinkage_percent}% (&gt;3.0% tolerance)
                      </span>
                      <span className="text-2xs text-rose-600">
                        {calcResult.shrinkage_warning || 'High fabric loss deviation detected.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shrinkage is within standard tolerance ({calcResult.shrinkage_percent}%)</span>
                  </div>
                )}

                {/* Calculation Breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>Taxable Gross Amount:</span>
                    <span className="font-bold text-slate-900">{formatINR(calcResult.gross_amount)}</span>
                  </div>

                  {!calcResult.is_interstate ? (
                    <>
                      <div className="flex justify-between text-slate-500 text-2xs">
                        <span>CGST @ 2.5%:</span>
                        <span>{formatINR(calcResult.cgst_amount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-2xs">
                        <span>SGST @ 2.5%:</span>
                        <span>{formatINR(calcResult.sgst_amount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500 text-2xs">
                      <span>IGST @ 5.0% (Inter-state):</span>
                      <span>{formatINR(calcResult.igst_amount)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between font-sans text-sm font-bold text-slate-900">
                    <span>INVOICE NET TOTAL (₹):</span>
                    <span className="font-mono text-base font-black text-slate-900">
                      {formatINR(calcResult.net_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Generating...' : 'Save SAC 9988 Invoice'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-medium">Loading form...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
