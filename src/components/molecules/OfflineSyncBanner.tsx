'use client';

import React, { useState, useEffect } from 'react';
import { offlineStore, SyncConflict } from '@/lib/offline-store';
import { useI18n } from '@/lib/i18n';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);

  const triggerSync = React.useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    await offlineStore.syncPendingQueue();
    setIsSyncing(false);
  }, [isSyncing]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribePending = offlineStore.onPendingCountChange((count) => {
      setPendingCount(count);
    });

    const unsubscribeConflicts = offlineStore.onConflictsChange((conflictList) => {
      setConflicts(conflictList);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribePending();
      unsubscribeConflicts();
    };
  }, [triggerSync]);

  const handleResolve = async (conflictId: string, resolution: 'OVERWRITE' | 'DISCARD') => {
    await offlineStore.resolveConflict(conflictId, resolution);
    if (conflicts.length <= 1) {
      setShowConflictModal(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors min-h-[38px] ${
            isOnline
              ? conflicts.length > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : pendingCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
          }`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}

          <span className="hidden sm:inline">
            {isOnline ? t.online : t.offline}
          </span>

          {pendingCount > 0 && (
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-2xs font-extrabold ml-0.5">
              {pendingCount} {t.pendingSync}
            </span>
          )}

          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflictModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-full text-2xs font-extrabold ml-1 flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <AlertTriangle className="w-3 h-3" />
              {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow transition"
            title="Sync Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sync</span>
          </button>
        )}
      </div>

      {/* CONFLICT RESOLUTION MODAL */}
      {showConflictModal && conflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                Sync Conflict Resolution ({conflicts.length})
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              The following offline records were modified concurrently on another device while this terminal was offline.
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {conflicts.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                      {c.item.type} • {c.item.action}
                    </span>
                    <span className="text-2xs text-slate-400 font-mono">
                      {new Date(c.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-2xs font-mono text-slate-700 max-h-24 overflow-y-auto">
                    {JSON.stringify(c.item.data, null, 2)}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleResolve(c.id, 'OVERWRITE')}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-2xs transition"
                    >
                      Overwrite Remote
                    </button>
                    <button
                      onClick={() => handleResolve(c.id, 'DISCARD')}
                      className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-2xs transition"
                    >
                      Discard Local
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
