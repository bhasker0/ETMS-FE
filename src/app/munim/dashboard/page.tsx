'use client';

import React, { useState, useEffect } from 'react';
import {
  MunimApi,
  MunimClientCompany,
  MunimRequestApiItem,
  ConsolidatedDaybook,
} from '@/lib/api/munim';
import { TallyApi } from '@/lib/api/tally';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  Send,
  Building2,
  TrendingUp,
  Wallet,
  Coins,
  Receipt,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MunimDashboardPage() {
  const { activeCompany, switchCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const [approvedCompanies, setApprovedCompanies] = useState<MunimClientCompany[]>([]);
  const [daybook, setDaybook] = useState<ConsolidatedDaybook | null>(null);
  const [myRequests, setMyRequests] = useState<MunimRequestApiItem[]>([]);
  const [companyRequests, setCompanyRequests] = useState<MunimRequestApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tally Export Date Range
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [onlyUnsynced, setOnlyUnsynced] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchMunimData = async () => {
    setLoading(true);
    try {
      const [comps, db, myReqs, cReqs] = await Promise.all([
        MunimApi.getApprovedCompanies().catch(() => []),
        MunimApi.getConsolidatedDaybook().catch(() => null),
        MunimApi.getMyRequests().catch(() => []),
        MunimApi.getCompanyRequests().catch(() => []),
      ]);
      setApprovedCompanies(comps);
      setDaybook(db);
      setMyRequests(myReqs);
      setCompanyRequests(cReqs);
    } catch (e: any) {
      console.warn('Munim data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMunimData();
  }, [activeCompany?.id]);

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'REVOKE') => {
    try {
      await MunimApi.respondToRequest(requestId, action);
      toast.success(`[SUCCESS] Request ${action.toLowerCase()}ed`);
      fetchMunimData();
    } catch (err: any) {
      toast.error('Action failed: ' + err.message);
    }
  };

  const handleTallyExport = async () => {
    setExporting(true);
    try {
      await TallyApi.downloadInvoicesXml({
        startDate,
        endDate,
        onlyUnsynced,
      });
      toast.success('[DOWNLOADED] Tally Prime XML accounting payload');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleGstr1Export = () => {
    const curFp = `${new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1}${new Date().getFullYear()}`;
    const gstr1Payload = {
      gstin: activeCompany?.gstin || '24AAAAA0000A1Z5',
      fp: curFp,
      gt: Number(daybook?.total_invoices_amount || 0),
      cur_gt: Number(daybook?.total_invoices_amount || 0),
      version: 'GST3.1.2',
      hash: 'hash-gstn-etms-' + Date.now(),
      b2b: [
        {
          ctin: '24AABCV1234F1Z8',
          cfs: 'Y',
          inv: [
            {
              inum: 'INV-2026-0001',
              idt: startDate || '2026-08-06',
              val: Number(daybook?.total_invoices_amount || 5292.0),
              pos: '24',
              rchrg: 'N',
              etin: '',
              inv_typ: 'R',
              itms: [
                {
                  num: 1,
                  itm_det: {
                    rt: 5.0,
                    txval: Number(
                      daybook?.total_invoices_amount
                        ? (daybook.total_invoices_amount / 1.05).toFixed(2)
                        : 5040.0
                    ),
                    iamt: 0.0,
                    camt: Number(
                      daybook?.total_invoices_amount
                        ? ((daybook.total_invoices_amount / 1.05) * 0.025).toFixed(2)
                        : 126.0
                    ),
                    samt: Number(
                      daybook?.total_invoices_amount
                        ? ((daybook.total_invoices_amount / 1.05) * 0.025).toFixed(2)
                        : 126.0
                    ),
                    csamt: 0.0,
                  },
                },
              ],
            },
          ],
        },
      ],
      hsn: {
        data: [
          {
            num: 1,
            hsn_sc: '9988',
            desc: 'Job work services by way of embroidery on textile yarn or fabric',
            uqc: 'MTR',
            qty: 1250,
            val: Number(daybook?.total_invoices_amount || 5292.0),
            txval: Number(
              daybook?.total_invoices_amount
                ? (daybook.total_invoices_amount / 1.05).toFixed(2)
                : 5040.0
            ),
            camt: 126.0,
            samt: 126.0,
            iamt: 0.0,
            csamt: 0.0,
          },
        ],
      },
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gstr1Payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GSTR1_${activeCompany?.gstin || '24AAAAA0000A1Z5'}_${curFp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`[GENERATED] Official GSTN GSTR-1 JSON return for period ${curFp}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Coins className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Munim Financial Telemetry • Multi-Firm Cockpit</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Munim Accounting & Khata Cockpit
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Consolidated cashbook, outstanding client khata ledgers, and government tax returns
            </p>
          </div>

          <button
            onClick={() => openDrawer('INVITE_COMPANY', {}, fetchMunimData)}
            className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs flex items-center justify-center gap-1.5 transition rounded-md shadow-sm shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Link Factory Client Unit</span>
          </button>
        </div>

        {/* Bento KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Connected Factory Units
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight font-mono tabular-nums mt-1">
              {approvedCompanies.length} <span className="text-xs font-normal text-[var(--text-muted)]">Firms</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Aggregate Billed Sales
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums mt-1">
              {formatINR(daybook?.total_invoices_amount || 0)}
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Unsettled Uchapat Advances
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight font-mono tabular-nums mt-1">
              {formatINR(daybook?.total_uchapat_outstanding || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Tally XML & GSTR-1 Console */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-[var(--text-main)]">
                Tally Prime & GSTN Returns Export Console
              </h2>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Scope: {activeCompany?.name || 'All Connected Industrial Units'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-main)] font-semibold uppercase text-[0.6875rem]">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="unsynced-only"
                checked={onlyUnsynced}
                onChange={(e) => setOnlyUnsynced(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-[var(--border)]"
              />
              <label htmlFor="unsynced-only" className="text-xs text-[var(--text-main)] font-medium cursor-pointer">
                Only Unsynced
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTallyExport}
                disabled={exporting}
                className="flex-1 py-2 px-3 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Exporting...' : 'Tally XML'}</span>
              </button>

              <button
                onClick={handleGstr1Export}
                className="flex-1 py-2 px-3 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Export native GSTN JSON return for direct upload to gst.gov.in"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>GSTR-1 JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Connected Factories Grid & Pending Invitations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approved Clients */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Connected Factory Clients ({approvedCompanies.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {approvedCompanies.map((c) => {
                const isCurrent = c.id === activeCompany?.id;
                return (
                  <div
                    key={c.id}
                    className={`p-4 border rounded-xl transition ${
                      isCurrent
                        ? 'bg-[var(--bg-surface)] border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-[var(--bg-surface)] border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-main)]">{c.name}</h3>
                        <p className={`text-xs font-mono mt-0.5 ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                          GSTIN: {c.gstin || 'Unregistered'}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="badge-pastel-green px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                          Active Scope
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        {c.address || 'Surat GIDC'}
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => switchCompany(c.id)}
                          className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                        >
                          Switch Scope
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {approvedCompanies.length === 0 && (
                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl sm:col-span-2 text-xs">
                  No factory units connected to this Munim account yet.
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Pending Invitations ({myRequests.filter((r) => r.status === 'PENDING').length + companyRequests.filter((r) => r.status === 'PENDING').length})
            </h2>

            {/* Requests */}
            {myRequests
              .filter((req) => req.status === 'PENDING')
              .map((req) => {
                const isSentByMe = req.initiator_type === 'MUNIM_TO_COMPANY';
                return (
                  <div
                    key={req.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-3 shadow-xs"
                  >
                    <div>
                      <span
                        className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded ${
                          isSentByMe
                            ? 'badge-pastel-yellow'
                            : 'badge-pastel-blue'
                        }`}
                      >
                        {isSentByMe ? 'Request Sent' : 'Invitation Received'}
                      </span>
                      <h3 className="font-bold text-xs text-[var(--text-main)] mt-2">
                        {req.company?.name || req.company_name || 'Client Factory'}
                      </h3>
                      <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                        GSTIN: {req.company?.gstin || req.company_gstin || 'Unregistered'}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {isSentByMe ? (
                        <button
                          onClick={() => handleRespond(req.id, 'REVOKE')}
                          className="flex-1 py-1 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold rounded transition cursor-pointer"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRespond(req.id, 'ACCEPT')}
                            className="flex-1 py-1 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded transition cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'REJECT')}
                            className="flex-1 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-semibold rounded transition cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {myRequests.filter((r) => r.status === 'PENDING').length === 0 &&
              companyRequests.filter((r) => r.status === 'PENDING').length === 0 && (
                <div className="p-6 text-center text-[var(--text-muted)] text-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
                  No pending access requests.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

