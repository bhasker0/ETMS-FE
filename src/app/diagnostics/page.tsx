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
} from 'lucide-react';
import { toast } from 'sonner';

export default function DiagnosticsPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [shouldCrash, setShouldCrash] = useState(false);

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
    toast.info('લોગ્સ રિફ્રેશ થયા!');
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast.success('તમામ લોગ્સ સાફ કરવામાં આવ્યા.');
  };

  const handleSendTestLog = () => {
    logger.info('Manual test diagnostic event triggered by user', {
      timestamp: new Date().toISOString(),
      screen: 'Diagnostics Page',
    });
    setLogs(logger.getRecentLogs());
    toast.success('ટેસ્ટ લોગ સફળતાપૂર્વક મોકલાયો!');
  };

  const handleTestError = () => {
    logger.error('Diagnostic simulated runtime error', {
      errorType: 'SimulatedSyntheticFailure',
      code: 500,
    });
    setLogs(logger.getRecentLogs());
    toast.error('ટેસ્ટ એરર લોગ જનરેટ થઈ!');
  };

  if (shouldCrash) {
    throw new Error('Test Simulated Crash for ErrorBoundary verification!');
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header / Page Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-semibold uppercase tracking-wider mb-0.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>ક્લાયન્ટ લાઈવ લોગર અને ડાયગ્નોસ્ટિક્સ</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.navDiagnostics}
            </h1>
            <p className="text-xs text-slate-500">
              બ્રાઉઝર એરર બાઉન્ડ્રી, ઓફલાઇન કતાર અને એપીઆઇ લોગિંગ સિસ્ટમ મોનિટરિંગ
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>રિફ્રેશ</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>લોગ સાફ કરો</span>
            </button>
          </div>
        </div>

        {/* Small State Chips in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span>Network: <strong className="font-bold text-slate-900">{isOnline ? 'Online (કનેક્ટેડ)' : 'Offline (ઓફલાઇન મોડ)'}</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Sync: <strong className="font-bold text-amber-800">{pendingSyncCount} Items</strong></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <Activity className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Log Count: <strong className="font-bold text-slate-900">{logs.length} Entries</strong></span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Simulator Test Controls */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            ડાયગ્નોસ્ટિક સિમ્યુલેશન ટૂલ્સ (Test Diagnostics)
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSendTestLog}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Generate Info Log</span>
            </button>

            <button
              onClick={handleTestError}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Generate Error Log</span>
            </button>

            <button
              onClick={() => setShouldCrash(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Trigger React Error Boundary Crash</span>
            </button>
          </div>
        </div>

        {/* Real-Time Client Logs Feed */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            લાઈવ ક્લાયન્ટ લોગ સ્ટ્રીમ (Structured Client Log Feed)
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {logs.map((log) => (
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
                    <pre className="text-2xs text-slate-600 bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="text-2xs text-slate-400 shrink-0 sm:text-right font-mono">
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div>Role: {log.userRole || 'unknown'}</div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-sans">
                હાલ કોઈ લોગ્સ નોંધાયેલ નથી.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
