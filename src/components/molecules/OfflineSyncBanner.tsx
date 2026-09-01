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
      className="fixed top-16 right-4 z-40 flex items-center gap-2.5 px-3.5 py-2 border shadow-lg text-xs rounded-lg animate-in fade-in slide-in-from-top-2 backdrop-blur-xs"
      style={{
        backgroundColor: !isOnline ? '#FDEBEC' : conflicts.length > 0 ? '#FDEBEC' : '#FBF3DB',
        borderColor: !isOnline ? '#F5C2C4' : conflicts.length > 0 ? '#F5C2C4' : '#F5E6B8',
        color: !isOnline ? '#8A1C14' : conflicts.length > 0 ? '#8A1C14' : '#744210',
      }}
    >
      <div className="flex items-center gap-2 font-medium">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
        )}

        <span>
          {!isOnline
            ? `Offline mode: ${pendingCount} mutations queued`
            : conflicts.length > 0
            ? `${conflicts.length} Sync conflicts detected`
            : `Online • ${pendingCount} pending sync`}
        </span>

        {conflicts.length > 0 && (
          <button
            onClick={openConflictDrawer}
            className="bg-rose-700 hover:bg-rose-800 text-white px-2 py-0.5 text-[0.6875rem] font-semibold rounded ml-1 flex items-center gap-1 cursor-pointer transition"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Resolve</span>
          </button>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-[0.6875rem] rounded flex items-center gap-1 transition cursor-pointer"
          title={t.offlineSyncNow || 'Sync Now'}
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
};

