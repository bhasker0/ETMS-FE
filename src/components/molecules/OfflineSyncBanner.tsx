'use client';

import React, { useState, useEffect } from 'react';
import { offlineStore, SyncConflict } from '@/lib/offline-store';
import { useI18n } from '@/lib/i18n';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppDrawer } from '@/lib/app-drawer-context';

export const OfflineSyncBanner: React.FC = () => {
  const { t } = useI18n();
  const { openDrawer } = useAppDrawer();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
    const updated = await offlineStore.getConflicts();
    setConflicts(updated);
  };

  const openConflictDrawer = () => {
    openDrawer('OFFLINE_CONFLICTS', {
      conflicts,
      onResolve: handleResolve,
    });
  };

  if (isOnline && pendingCount === 0 && conflicts.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
        !isOnline
          ? 'bg-slate-900/95 text-white border-slate-800 shadow-slate-950/20'
          : conflicts.length > 0
          ? 'bg-rose-950/95 text-rose-100 border-rose-800 shadow-rose-950/20'
          : 'bg-amber-950/95 text-amber-100 border-amber-800 shadow-amber-950/20'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
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
            onClick={openConflictDrawer}
            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-full text-2xs font-extrabold ml-1 flex items-center gap-1 cursor-pointer transition shadow-xs"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>
              {conflicts.length} {conflicts.length > 1 ? (t.conflictPlural || 'Conflicts') : (t.conflictSingular || 'Conflict')}
            </span>
          </button>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow transition cursor-pointer"
          title={t.offlineSyncNow || 'Sync Now'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isSyncing ? (t.offlineSyncing || 'Syncing...') : (t.offlineSyncNow || 'Sync')}</span>
        </button>
      )}
    </div>
  );
};
