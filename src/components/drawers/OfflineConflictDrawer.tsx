'use client';

import React from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 13. Offline Shift Conflicts Drawer Form (SCRUM-194)                        */
/* -------------------------------------------------------------------------- */
export const OfflineConflictDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const conflicts = (instance.payload?.conflicts || []) as any[];

  const handleResolve = (conflictId: string, resolution: 'OVERWRITE' | 'DISCARD') => {
    instance.payload?.onResolve?.(conflictId, resolution);
    toast.success(`Conflict resolved (${resolution})`);
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      title={`${t.offlineSyncConflicts || 'Sync Conflicts'} (${conflicts.length})`}
      icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      level={level}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            {t.close || 'Done'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          {t.offlineSyncConflictsDesc || 'The following offline records were modified concurrently on another device while this terminal was offline.'}
        </p>

        <div className="space-y-3">
          {conflicts.map((c: any) => (
            <div key={c.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase tracking-wide">
                  {c.item?.type} • {c.item?.action}
                </span>
                <span className="text-2xs text-slate-400 font-mono">
                  {c.detectedAt ? new Date(c.detectedAt).toLocaleTimeString() : ''}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-2xs font-mono text-slate-700 max-h-28 overflow-y-auto">
                {JSON.stringify(c.item?.data, null, 2)}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleResolve(c.id, 'OVERWRITE')}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-2xs transition shadow-2xs cursor-pointer"
                >
                  {t.offlineOverwriteRemote || 'Overwrite Remote'}
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(c.id, 'DISCARD')}
                  className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-2xs transition cursor-pointer"
                >
                  {t.offlineDiscardLocal || 'Discard Local'}
                </button>
              </div>
            </div>
          ))}

          {conflicts.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No pending conflicts to resolve.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
