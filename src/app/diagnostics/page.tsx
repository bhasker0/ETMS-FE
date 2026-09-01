'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { offlineStore } from '@/lib/offline-store';
import { ClientLog } from '@/lib/types';
import {
  Activity,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Bug,
  Database,
  Send,
  Download,
  Flame,
  CheckCircle2,
  Server,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DiagnosticsPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'info' | 'warn' | 'error'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setLogs(logger.getRecentLogs());
      setPendingSyncCount(offlineStore.getPendingCount());

      const unsub = offlineStore.onPendingCountChange((cnt) => {
        setPendingSyncCount(cnt);
      });

      return () => unsub();
    }
  }, []);

  const refreshLogs = () => {
    setLogs(logger.getRecentLogs());
    toast.info(t.diag_logsRefreshed);
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast.success(t.diag_logsCleared);
  };

  const handleSendTestLog = () => {
    logger.info('Manual test diagnostic event triggered by user', {
      timestamp: new Date().toISOString(),
      screen: 'Diagnostics Page',
    });
    setLogs(logger.getRecentLogs());
    toast.success(t.diag_testLogSent);
  };

  const handleTestError = () => {
    logger.error('Diagnostic simulated runtime error', {
      errorType: 'SimulatedSyntheticFailure',
      code: 500,
    });
    setLogs(logger.getRecentLogs());
    toast.error(t.diag_testErrorSent);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await offlineStore.syncPendingQueue();
    setPendingSyncCount(offlineStore.getPendingCount());
    setIsSyncing(false);
    toast.success(t.diag_syncCompleted);
  };

  const handlePurgeCache = () => {
    if (window.confirm(t.diag_confirmPurge)) {
      offlineStore.purgeLocalCache();
      setPendingSyncCount(0);
      toast.success(t.diag_cachePurged);
    }
  };

  const handleExportDump = () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      isOnline: navigator.onLine,
      pendingSyncCount: offlineStore.getPendingCount(),
      recentLogs: logger.getRecentLogs(),
      conflicts: offlineStore.getConflicts(),
      shifts: offlineStore.getShifts(),
      challans: offlineStore.getChallans(),
      invoices: offlineStore.getInvoices(),
      uchapat: offlineStore.getUchapat(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etms-diagnostic-dump-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.diag_dumpExported);
  };

  if (shouldCrash) {
    throw new Error('Test Simulated Crash for ErrorBoundary verification!');
  }

  const filteredLogs = logs.filter((l) => {
    if (selectedLevel === 'ALL') return true;
    return l.level === selectedLevel;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.diag_title}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.navDiagnostics}
            </h1>
            <p className="text-xs text-slate-500">
              {t.diag_subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={refreshLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.diag_btnRefresh}</span>
            </button>
            <button
              onClick={handleExportDump}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0099B8]" />
              <span>{t.diag_btnExportDump}</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.diag_btnClearLogs}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <div>
              <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.diag_statusNetwork}
              </div>
              <strong className="font-bold text-slate-900 text-xs sm:text-sm">
                {isOnline ? t.diag_statusOnline : t.diag_statusOffline}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Server className="w-4 h-4 text-[#0099B8] shrink-0" />
            <div>
              <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.diag_statusBackendGateway}
              </div>
              <strong className="font-bold text-slate-900 text-xs sm:text-sm">
                {isOnline ? t.diag_statusBackendConnected : t.diag_statusBackendDisconnected}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Database className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.diag_statusPendingSync}
              </div>
              <strong className="font-bold text-amber-800 text-xs sm:text-sm">
                {pendingSyncCount} {t.diag_statusItems}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Activity className="w-4 h-4 text-[#1D4ED8] shrink-0" />
            <div>
              <div className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.diag_statusLogCount}
              </div>
              <strong className="font-bold text-slate-900 text-xs sm:text-sm">
                {logs.length} {t.diag_statusEntries}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Diagnostic Simulator & Cache Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              {t.diag_simulationTools}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleForceSync}
                disabled={isSyncing || !isOnline}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{t.diag_btnForceSync}</span>
              </button>
              <button
                onClick={handlePurgeCache}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>{t.diag_btnPurgeCache}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200">
            <button
              onClick={handleSendTestLog}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.diag_btnGenerateInfo}</span>
            </button>

            <button
              onClick={handleTestError}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.diag_btnGenerateError}</span>
            </button>

            <button
              onClick={() => setShouldCrash(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{t.diag_btnTriggerCrash}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Client Logs Feed with Level Filter */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0099B8]" />
              <span>{t.diag_clientLogsFeed}</span>
            </h3>

            {/* Level Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-2.5 py-1 rounded text-2xs font-bold transition cursor-pointer ${
                  selectedLevel === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.diag_filterAll}
              </button>
              <button
                onClick={() => setSelectedLevel('info')}
                className={`px-2.5 py-1 rounded text-2xs font-bold transition cursor-pointer ${
                  selectedLevel === 'info'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.diag_filterInfo}
              </button>
              <button
                onClick={() => setSelectedLevel('warn')}
                className={`px-2.5 py-1 rounded text-2xs font-bold transition cursor-pointer ${
                  selectedLevel === 'warn'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.diag_filterWarn}
              </button>
              <button
                onClick={() => setSelectedLevel('error')}
                className={`px-2.5 py-1 rounded text-2xs font-bold transition cursor-pointer ${
                  selectedLevel === 'error'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.diag_filterError}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-start justify-between gap-2 ${
                  log.level === 'error'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : log.level === 'warn'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-2xs font-bold uppercase ${
                        log.level === 'error'
                          ? 'bg-rose-600 text-white'
                          : log.level === 'warn'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="font-semibold text-slate-900 font-sans text-xs sm:text-sm">
                      {log.message}
                    </span>
                  </div>

                  {log.context && (
                    <div className="space-y-1 pt-1">
                      <span className="text-3xs font-sans text-slate-400 font-semibold uppercase">
                        {t.diag_payloadContext}:
                      </span>
                      <pre className="text-2xs text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="text-2xs text-slate-400 shrink-0 sm:text-right font-mono">
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div>{t.diag_thRole}: {log.userRole || 'system'}</div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-sans text-xs">
                {t.diag_noLogs}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
