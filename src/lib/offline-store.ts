import { ShiftEntry, InwardChallan, InvoiceSAC9988, UchapatTransaction } from './types';
import { logger } from './logger';
import { apiClient } from './api-client';

export interface PendingSyncItem {
  id: string;
  type: 'shift' | 'challan' | 'invoice' | 'uchapat';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  retryCount?: number;
}

export interface SyncConflict {
  id: string;
  item: PendingSyncItem;
  serverMessage?: string;
  detectedAt: string;
}

// API endpoint mapping for each entity type and action
const API_ENDPOINTS: Record<string, Record<string, { method: string; url: string }>> = {
  shift: {
    create: { method: 'POST', url: '/api/v1/shift-logs' },
    update: { method: 'PUT', url: '/api/v1/shift-logs' },
    delete: { method: 'DELETE', url: '/api/v1/shift-logs' },
  },
  challan: {
    create: { method: 'POST', url: '/api/v1/inward-challans' },
    update: { method: 'PUT', url: '/api/v1/inward-challans' },
    delete: { method: 'DELETE', url: '/api/v1/inward-challans' },
  },
  invoice: {
    create: { method: 'POST', url: '/api/v1/outward-invoices' },
    update: { method: 'PUT', url: '/api/v1/outward-invoices' },
    delete: { method: 'DELETE', url: '/api/v1/outward-invoices' },
  },
  uchapat: {
    create: { method: 'POST', url: '/api/v1/uchapat' },
    update: { method: 'PUT', url: '/api/v1/uchapat' },
    delete: { method: 'DELETE', url: '/api/v1/uchapat' },
  },
};

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

class OfflineStore {
  private isBrowser = typeof window !== 'undefined';
  private syncListeners: ((pendingCount: number) => void)[] = [];
  private conflictListeners: ((conflicts: SyncConflict[]) => void)[] = [];
  private isSyncing = false;

  constructor() {
    if (this.isBrowser) {
      window.addEventListener('online', () => {
        logger.info('Network restored: online event triggered. Starting background sync.');
        this.syncPendingQueue();
      });

      window.addEventListener('offline', () => {
        logger.warn('Network lost: offline mode activated.');
      });
    }
  }

  // Queue an action for offline sync
  async queueForSync(type: PendingSyncItem['type'], action: PendingSyncItem['action'], data: any): Promise<void> {
    if (!this.isBrowser) return;

    const item: PendingSyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      action,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    try {
      const queue = this.getPendingQueue();
      queue.push(item);
      localStorage.setItem('etms_pending_sync_queue', JSON.stringify(queue));
      logger.info(`Queued ${type} for background sync`, { syncId: item.id });
      this.notifyListeners();
    } catch (e) {
      logger.error('Failed to queue item for offline sync', { error: String(e) });
    }
  }

  getPendingQueue(): PendingSyncItem[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_pending_sync_queue') || '[]');
    } catch (e) {
      return [];
    }
  }

  getPendingCount(): number {
    return this.getPendingQueue().length;
  }

  onPendingCountChange(callback: (count: number) => void): () => void {
    this.syncListeners.push(callback);
    callback(this.getPendingCount());
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    const count = this.getPendingCount();
    this.syncListeners.forEach((cb) => cb(count));
  }

  /**
   * Dispatch a single queued item to the backend API.
   * Returns true if synced successfully, false otherwise.
   */
  private async dispatchItem(item: PendingSyncItem): Promise<boolean> {
    const endpoint = API_ENDPOINTS[item.type]?.[item.action];
    if (!endpoint) {
      logger.warn(`No API endpoint configured for ${item.type}/${item.action}`, { syncId: item.id });
      return true; // Remove from queue — unknown action type
    }

    try {
      const { method, url } = endpoint;

      if (method === 'POST') {
        await apiClient.post(url, item.data);
      } else if (method === 'PUT') {
        const entityId = item.data?.id;
        await apiClient.put(entityId ? `${url}/${entityId}` : url, item.data);
      } else if (method === 'DELETE') {
        const entityId = item.data?.id;
        await apiClient.delete(entityId ? `${url}/${entityId}` : url);
      }

      return true;
    } catch (err: any) {
      // If it's a 409 Conflict, register conflict so supervisor can resolve
      if (err?.response?.status === 409) {
        logger.warn(`Item ${item.id} encountered 409 Conflict on server.`, { syncId: item.id });
        this.addConflict({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          item,
          serverMessage: err?.response?.data?.message || 'Concurrent modification conflict detected on server',
          detectedAt: new Date().toISOString(),
        });
        return true; // Remove from active dispatch queue and park in conflict queue
      }

      // If it's a 4xx error (client error other than 409), don't retry — data is invalid
      if (err?.response?.status >= 400 && err?.response?.status < 500) {
        logger.error(`Client error syncing item ${item.id} (${err?.response?.status}), removing from queue.`, {
          error: String(err),
          data: item.data,
        });
        return true; // Remove from queue to prevent infinite retries
      }

      // Server errors or network failures — keep for retry
      return false;
    }
  }

  getConflicts(): SyncConflict[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_sync_conflicts') || '[]');
    } catch (e) {
      return [];
    }
  }

  addConflict(conflict: SyncConflict): void {
    if (!this.isBrowser) return;
    try {
      const conflicts = this.getConflicts();
      conflicts.push(conflict);
      localStorage.setItem('etms_sync_conflicts', JSON.stringify(conflicts));
      this.notifyConflictListeners();
    } catch (e) {
      logger.error('Failed to save sync conflict', { error: String(e) });
    }
  }

  async resolveConflict(conflictId: string, resolution: 'OVERWRITE' | 'DISCARD'): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const conflicts = this.getConflicts();
      const target = conflicts.find((c) => c.id === conflictId);
      if (!target) return;

      if (resolution === 'OVERWRITE') {
        const endpoint = API_ENDPOINTS[target.item.type]?.['update'] || API_ENDPOINTS[target.item.type]?.['create'];
        if (endpoint) {
          await apiClient.put(endpoint.url, { ...target.item.data, force_override: true });
        }
      }

      const remaining = conflicts.filter((c) => c.id !== conflictId);
      localStorage.setItem('etms_sync_conflicts', JSON.stringify(remaining));
      this.notifyConflictListeners();
    } catch (e) {
      logger.error('Failed to resolve sync conflict', { error: String(e) });
    }
  }

  onConflictsChange(callback: (conflicts: SyncConflict[]) => void): () => void {
    this.conflictListeners.push(callback);
    callback(this.getConflicts());
    return () => {
      this.conflictListeners = this.conflictListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyConflictListeners(): void {
    const conflicts = this.getConflicts();
    this.conflictListeners.forEach((cb) => cb(conflicts));
  }

  /**
   * Exponential backoff delay for retries.
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }

  /**
   * Perform background sync when online.
   * Dispatches queued items to backend APIs with retry logic.
   */
  async syncPendingQueue(): Promise<{ synced: number; failed: number }> {
    if (!this.isBrowser || !navigator.onLine) return { synced: 0, failed: 0 };
    if (this.isSyncing) return { synced: 0, failed: 0 }; // Prevent concurrent syncs

    this.isSyncing = true;
    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      this.isSyncing = false;
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remaining: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        const success = await this.dispatchItem(item);

        if (success) {
          synced++;
          logger.info(`Successfully synced offline item ${item.id} (${item.type}/${item.action})`);
        } else {
          const retryCount = (item.retryCount || 0) + 1;

          if (retryCount >= MAX_RETRIES) {
            // Max retries exceeded — log and discard
            failed++;
            logger.error(`Max retries exceeded for item ${item.id} (${item.type}), discarding.`, {
              data: item.data,
              retryCount,
            });
          } else {
            // Keep for retry with incremented count
            remaining.push({ ...item, retryCount });
            failed++;
            logger.warn(`Retry ${retryCount}/${MAX_RETRIES} for item ${item.id} (${item.type})`);

            // Add backoff delay before next item
            await new Promise((resolve) =>
              setTimeout(resolve, this.getRetryDelay(retryCount))
            );
          }
        }
      } catch (err) {
        failed++;
        remaining.push(item);
        logger.error(`Unexpected error syncing item ${item.id}`, { error: String(err) });
      }
    }

    localStorage.setItem('etms_pending_sync_queue', JSON.stringify(remaining));
    this.isSyncing = false;
    this.notifyListeners();
    return { synced, failed };
  }

  // Persistence helpers for shifts
  saveShift(shift: ShiftEntry): void {
    if (!this.isBrowser) return;
    try {
      const shifts: ShiftEntry[] = JSON.parse(localStorage.getItem('etms_shifts') || '[]');
      const index = shifts.findIndex((s) => s.id === shift.id);
      if (index >= 0) {
        shifts[index] = shift;
      } else {
        shifts.unshift(shift);
      }
      localStorage.setItem('etms_shifts', JSON.stringify(shifts));
    } catch (e) {
      logger.error('Failed to save shift locally', { error: String(e) });
    }
  }

  getShifts(): ShiftEntry[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_shifts') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Persistence for challans
  saveChallan(challan: InwardChallan): void {
    if (!this.isBrowser) return;
    try {
      const challans: InwardChallan[] = JSON.parse(localStorage.getItem('etms_challans') || '[]');
      const index = challans.findIndex((c) => c.id === challan.id);
      if (index >= 0) {
        challans[index] = challan;
      } else {
        challans.unshift(challan);
      }
      localStorage.setItem('etms_challans', JSON.stringify(challans));
    } catch (e) {
      logger.error('Failed to save challan locally', { error: String(e) });
    }
  }

  getChallans(): InwardChallan[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_challans') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Persistence for Invoices
  saveInvoice(invoice: InvoiceSAC9988): void {
    if (!this.isBrowser) return;
    try {
      const invoices: InvoiceSAC9988[] = JSON.parse(localStorage.getItem('etms_invoices') || '[]');
      const index = invoices.findIndex((i) => i.id === invoice.id);
      if (index >= 0) {
        invoices[index] = invoice;
      } else {
        invoices.unshift(invoice);
      }
      localStorage.setItem('etms_invoices', JSON.stringify(invoices));
    } catch (e) {
      logger.error('Failed to save invoice locally', { error: String(e) });
    }
  }

  getInvoices(): InvoiceSAC9988[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_invoices') || '[]');
    } catch (e) {
      return [];
    }
  }

  // Persistence for Uchapat
  saveUchapat(tx: UchapatTransaction): void {
    if (!this.isBrowser) return;
    try {
      const txs: UchapatTransaction[] = JSON.parse(localStorage.getItem('etms_uchapat') || '[]');
      txs.unshift(tx);
      localStorage.setItem('etms_uchapat', JSON.stringify(txs));
    } catch (e) {
      logger.error('Failed to save uchapat locally', { error: String(e) });
    }
  }

  getUchapat(): UchapatTransaction[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('etms_uchapat') || '[]');
    } catch (e) {
      return [];
    }
  }

  purgeLocalCache(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('etms_pending_sync_queue');
      localStorage.removeItem('etms_sync_conflicts');
      localStorage.removeItem('etms_shifts');
      localStorage.removeItem('etms_challans');
      localStorage.removeItem('etms_invoices');
      localStorage.removeItem('etms_uchapat');
      this.notifyListeners();
      this.notifyConflictListeners();
      logger.info('Purged local offline storage cache.');
    } catch (e) {
      logger.error('Failed to purge local cache', { error: String(e) });
    }
  }
}

export const offlineStore = new OfflineStore();
