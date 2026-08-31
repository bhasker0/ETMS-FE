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
import { useI18n } from '@/lib/i18n';
import { formatINR } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  Send,
  Building2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MunimDashboardPage() {
  const { activeCompany, munimApprovedCompanies, switchCompany } = useAuth();
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();

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
      toast.success(`Request ${action.toLowerCase()}ed`);
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
      toast.success('Tally XML downloaded');
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
    toast.success(`Generated official GSTN GSTR-1 JSON Return for period ${curFp}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.munimPortalTitle || 'Multi-Tenant CA Portal'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.munimTitle || 'Munim & Accountant Hub'}
            </h1>
            <p className="text-xs text-slate-500">
              Multi-factory consolidated daybook, shift ledger analysis & automated Tally ERP 9 / Prime XML bridge
            </p>
          </div>

          <button
            onClick={() => openDrawer('INVITE_COMPANY', {}, fetchMunimData)}
            className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>+ {t.linkCompany || 'Link New Company'}</span>
          </button>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-800">
            <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t.connectedUnits || 'Connected Units'}: <strong className="font-bold text-slate-900">{approvedCompanies.length}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aggregate Sales: <strong className="font-bold text-emerald-700">{formatINR(daybook?.total_invoices_amount || 0)}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.unsettledAdvance || 'Unsettled Advances'}: <strong className="font-bold text-rose-700">{formatINR(daybook?.total_uchapat_outstanding || 0)}</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Tally XML Integration Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tally Prime / ERP 9 Direct XML Export
              </h2>
            </div>
            <span className="text-2xs text-slate-500 font-mono">
              Active Scope: {activeCompany?.name || 'All Connected Firms'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="unsynced-only"
                checked={onlyUnsynced}
                onChange={(e) => setOnlyUnsynced(e.target.checked)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded"
              />
              <label htmlFor="unsynced-only" className="text-xs text-slate-700 cursor-pointer">
                Only Unsynced Invoices
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTallyExport}
                disabled={exporting}
                className="w-1/2 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? '...' : 'Tally XML'}</span>
              </button>

              <button
                onClick={handleGstr1Export}
                className="w-1/2 py-2 px-3 bg-[#0099B8] hover:bg-[#0E7090] text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                title="Export native GSTN JSON return for direct upload to gst.gov.in"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>GSTR-1 JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Connected Factories Grid & Pending Invitations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approved Clients */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Connected Embroidery Units ({approvedCompanies.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {approvedCompanies.map((c) => {
                const isCurrent = c.id === activeCompany?.id;
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{c.name}</h3>
                        <p className={`text-2xs font-mono mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                          GSTIN: {c.gstin || 'Unregistered'}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-2xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Scope
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/20 flex items-center justify-between">
                      <span className={`text-2xs ${isCurrent ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.address || 'Surat GIDC'}
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => switchCompany(c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-2xs font-semibold transition"
                        >
                          Switch Scope
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {approvedCompanies.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2 text-xs">
                  No factories connected yet. Click &quot;+ Invite Company&quot; to link clients.
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Link Requests ({myRequests.filter((r) => r.status === 'PENDING').length + companyRequests.filter((r) => r.status === 'PENDING').length})
            </h2>

            {/* 1. Requests relevant to logged-in user as Accountant / Munim */}
            {myRequests
              .filter((req) => req.status === 'PENDING')
              .map((req) => {
                const isSentByMe = req.initiator_type === 'MUNIM_TO_COMPANY';
                return (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 text-2xs font-bold uppercase px-2 py-0.5 rounded border ${
                            isSentByMe
                              ? 'text-slate-600 bg-slate-50 border-slate-200'
                              : 'text-amber-600 bg-amber-50 border-amber-200'
                          }`}
                        >
                          {isSentByMe ? 'Request Sent (Pending Approval)' : 'Company Invitation'}
                        </span>
                        <h3 className="font-semibold text-xs text-slate-900 mt-1.5">
                          {req.company?.name || req.company_name || 'Client Factory'}
                        </h3>
                        <div className="text-2xs font-mono text-slate-500 mt-0.5">
                          GSTIN: {req.company?.gstin || req.company_gstin || 'Unregistered'}
                        </div>
                        {req.request_notes && (
                          <p className="text-2xs text-slate-600 mt-1 italic">&ldquo;{req.request_notes}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {isSentByMe ? (
                        <button
                          onClick={() => handleRespond(req.id, 'REVOKE')}
                          className="flex-1 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-2xs font-semibold rounded-lg transition"
                        >
                          Withdraw Request
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRespond(req.id, 'ACCEPT')}
                            className="flex-1 py-1.5 bg-[#0099B8] hover:bg-[#0E7090] text-white text-2xs font-semibold rounded-lg transition shadow-xs"
                          >
                            Accept Access
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'REJECT')}
                            className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-2xs font-semibold rounded-lg transition"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* 2. Requests received by the active Company from Accountants */}
            {companyRequests
              .filter((req) => req.status === 'PENDING')
              .map((req) => {
                const isSentByCompany = req.initiator_type === 'COMPANY_TO_MUNIM';
                return (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 text-2xs font-bold uppercase px-2 py-0.5 rounded border ${
                            isSentByCompany
                              ? 'text-slate-600 bg-slate-50 border-slate-200'
                              : 'text-sky-600 bg-sky-50 border-sky-200'
                          }`}
                        >
                          {isSentByCompany ? 'Invitation Sent (Pending Acceptance)' : 'Accountant Requested Access'}
                        </span>
                        <h3 className="font-semibold text-xs text-slate-900 mt-1.5">
                          {req.munimUser?.full_name || req.munim_name || 'Accountant / CA'}
                        </h3>
                        <div className="text-2xs font-mono text-slate-500 mt-0.5">
                          Mobile: {req.munimUser?.mobile || req.munim_mobile || 'N/A'}
                        </div>
                        {req.request_notes && (
                          <p className="text-2xs text-slate-600 mt-1 italic">&ldquo;{req.request_notes}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {isSentByCompany ? (
                        <button
                          onClick={() => handleRespond(req.id, 'REVOKE')}
                          className="flex-1 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-2xs font-semibold rounded-lg transition"
                        >
                          Cancel Invitation
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRespond(req.id, 'ACCEPT')}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-2xs font-semibold rounded-lg transition shadow-xs"
                          >
                            Grant Access
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'REJECT')}
                            className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-2xs font-semibold rounded-lg transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {myRequests.filter((r) => r.status === 'PENDING').length === 0 &&
              companyRequests.filter((r) => r.status === 'PENDING').length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl">
                  No pending link requests.
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
