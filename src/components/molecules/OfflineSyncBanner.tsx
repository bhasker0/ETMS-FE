'use client';

import React, { useState, useEffect } from 'react';
import { offlineStore } from '@/lib/offline-store';
import { useI18n } from '@/lib/i18n';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
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

    const unsubscribe = offlineStore.onPendingCountChange((count) => {
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [triggerSync]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors min-h-[38px] ${
          isOnline
            ? pendingCount > 0
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
  );
};
