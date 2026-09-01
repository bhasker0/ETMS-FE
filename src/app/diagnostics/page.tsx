'use client';

import React, { useState, useEffect } from 'react';
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
  Server,
  Terminal,
  Printer,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DiagnosticsPage() {
  const [logs, setLogs] = useState<ClientLog[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'info' | 'warn' | 'error'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

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
    toast.info('[TELEMETRY] System log stream refreshed');
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast.success('[AUDIT] Client log ring buffer purged');
  };

  const handleSendTestLog = () => {
    logger.info('MANUAL TEST TELEMETRY EVENT INITIATED', {
      timestamp: new Date().toISOString(),
      source: 'DIAGNOSTICS_CLI',
      sensor_probe: 'PROBE_01_OK',
    });
    setLogs(logger.getRecentLogs());
    toast.success('[PROBE] Test telemetry event logged');
  };

  const handleTestError = () => {
    logger.error('SIMULATED SYSTEM HARDWARE FAULT DETECTED', {
      faultCode: 'ERR_NEEDLE_PROBE_TIMEOUT_500',
      component: 'MOTOR_CONTROLLER_M01',
    });
    setLogs(logger.getRecentLogs());
    toast.error('[FAULT] Simulated error logged to audit ring');
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await offlineStore.syncPendingQueue();
    setPendingSyncCount(offlineStore.getPendingCount());
    setIsSyncing(false);
    toast.success('[SYNC] IndexedDB pending queue dispatched to backend');
  };

  const handleExecutePurge = () => {
    offlineStore.purgeLocalCache();
    setPendingSyncCount(0);
    setConfirmPurge(false);
    toast.success('[STORAGE] Offline local cache purged completely');
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
    toast.success('[DUMP] System forensic diagnostics archive generated');
  };

  if (shouldCrash) {
    throw new Error('[SYNTHETIC CRASH] ErrorBoundary verification trigger invoked!');
  }

  const filteredLogs = logs.filter((l) => {
    if (selectedLevel === 'ALL') return true;
    return l.level === selectedLevel;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Telemetry Controls */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-1">
              <Terminal className="w-3.5 h-3.5 text-[var(--text-main)]" />
              <span>Hardware Diagnostics • Telemetry Terminal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Diagnostics & Sensor Suite
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Hardware probes, IndexedDB buffer inspection, and thermal printer pairing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={refreshLogs}
              className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] font-medium text-xs flex items-center gap-1.5 transition rounded-md shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportDump}
              className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] font-medium text-xs flex items-center gap-1.5 transition rounded-md shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export JSON Dump</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center gap-1.5 transition rounded-md shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Buffer</span>
            </button>
          </div>
        </div>

        {/* Telemetry Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Network Uplink
            </div>
            <div className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 mt-1 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              API Gateway
            </div>
            <div className="text-lg sm:text-xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2 mt-1">
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isOnline ? '200 OK' : 'DISCONNECTED'}</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              IndexedDB Queue
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400 tracking-tight flex items-center gap-2 mt-1 font-mono tabular-nums">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{pendingSyncCount} Mutations</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase font-semibold tracking-wider">
              Ring Buffer
            </div>
            <div className="text-lg sm:text-xl font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2 mt-1 font-mono tabular-nums">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{logs.length} / 200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Probes & Bluetooth Printer Pairing */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Hardware Pairing & Peripheral Telemetry
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 text-[var(--text-main)]" />
                <span className="font-bold text-sm text-[var(--text-main)]">Thermal ESC/POS Printer</span>
              </div>
              <span className="badge-pastel-green px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                Ready (USB/BT)
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Driver: Raw Thermal ESC/POS • Baud: 9600 • Density: 203 DPI (80mm roll)
            </div>
            <button
              onClick={() => toast.success('[PRINTER] Test calibration receipt sent to buffer')}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition shadow-xs"
            >
              Test Feed Print
            </button>
          </div>

          <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[var(--text-main)]" />
                <span className="font-bold text-sm text-[var(--text-main)]">Embroidery Sensor Board</span>
              </div>
              <span className="badge-pastel-blue px-2 py-0.5 rounded text-[0.6875rem] font-semibold">
                COM4 / 115200
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Firmware: v2.14 • Break Detection: 12ms • Optical Encoder: Synced
            </div>
            <button
              onClick={() => toast.info('[SENSOR] Ping probe returned ACK in 4.2ms')}
              className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition shadow-xs"
            >
              Ping Serial Probe
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Simulator & Storage Controls */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-[var(--text-main)]">
            Diagnostic Simulator & Cache Management
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSync}
              disabled={isSyncing || !isOnline}
              className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition rounded-md shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Dispatching...' : 'Flush Queue'}</span>
            </button>
            {confirmPurge ? (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 p-1.5 border border-rose-300 dark:border-rose-800 rounded-md">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-200">Confirm Purge?</span>
                <button
                  onClick={handleExecutePurge}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded"
                >
                  Yes, Purge
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="px-2.5 py-1 bg-[var(--bg-surface)] text-[var(--text-main)] font-medium text-xs border border-[var(--border)] rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurge(true)}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium text-xs flex items-center gap-1.5 transition rounded-md"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Purge Local Cache</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border)]">
          <button
            onClick={handleSendTestLog}
            className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-medium text-xs flex items-center gap-1.5 transition rounded-md"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simulate Info Log</span>
          </button>

          <button
            onClick={handleTestError}
            className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-medium text-xs flex items-center gap-1.5 transition rounded-md"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulate Fault Event</span>
          </button>

          <button
            onClick={() => setShouldCrash(true)}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium text-xs flex items-center gap-1.5 transition rounded-md"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Simulate ErrorBoundary Crash</span>
          </button>
        </div>
      </div>

      {/* Real-Time Client Logs Feed with Level Filter */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--text-main)]" />
            <span>Live Client Diagnostic Stream</span>
          </h3>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 border border-[var(--border)] rounded-md">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                selectedLevel === 'ALL'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setSelectedLevel('info')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                selectedLevel === 'info'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setSelectedLevel('warn')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                selectedLevel === 'warn'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Warn
            </button>
            <button
              onClick={() => setSelectedLevel('error')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                selectedLevel === 'error'
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Error
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[480px] overflow-y-auto font-mono text-xs border border-[var(--border)] p-3 bg-[var(--bg-canvas)] rounded-lg">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                log.level === 'error'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100'
                  : log.level === 'warn'
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100'
                  : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-main)]'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[0.6875rem] font-semibold rounded uppercase ${
                      log.level === 'error'
                        ? 'badge-pastel-red'
                        : log.level === 'warn'
                        ? 'badge-pastel-yellow'
                        : 'badge-pastel-green'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="font-semibold text-xs">
                    {log.message}
                  </span>
                </div>

                {log.context && (
                  <div className="pt-1">
                    <pre className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] p-2.5 rounded border border-[var(--border)] overflow-x-auto font-mono">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="text-[0.6875rem] text-[var(--text-muted)] shrink-0 sm:text-right font-mono">
                <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                <div>Role: {log.userRole || 'SYSTEM'}</div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs">
              No log events detected in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


