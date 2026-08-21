import { ClientLog } from './types';

class StructuredClientLogger {
  private logQueue: ClientLog[] = [];
  private maxQueueSize = 100;
  private flushTimer: any = null;
  private isFlushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto flush on window unload
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Periodic flush
      this.flushTimer = setInterval(() => {
        if (this.logQueue.length > 0) {
          this.flush();
        }
      }, 10000);
    }
  }

  private createLog(level: ClientLog['level'], message: string, context?: Record<string, any>): ClientLog {
    const role = typeof window !== 'undefined' ? localStorage.getItem('etms_role') || 'unknown' : 'server';
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('etms_company_id') || 'comp-1' : 'comp-1';

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userRole: role,
      companyId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    };
  }

  info(message: string, context?: Record<string, any>): void {
    const log = this.createLog('info', message, context);
    console.info(`[ETMS INFO] ${message}`, context || '');
    this.enqueue(log);
  }

  warn(message: string, context?: Record<string, any>): void {
    const log = this.createLog('warn', message, context);
    console.warn(`[ETMS WARN] ${message}`, context || '');
    this.enqueue(log);
  }

  error(message: string, context?: Record<string, any>): void {
    const log = this.createLog('error', message, context);
    console.error(`[ETMS ERROR] ${message}`, context || '');
    this.enqueue(log);
    // Urgent flush for errors
    this.flush();
  }

  debug(message: string, context?: Record<string, any>): void {
    const log = this.createLog('debug', message, context);
    console.debug(`[ETMS DEBUG] ${message}`, context || '');
    this.enqueue(log);
  }

  private enqueue(log: ClientLog): void {
    this.logQueue.push(log);
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }

    // Save recent logs in localStorage for offline diagnostics
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('etms_recent_logs') || '[]');
        stored.push(log);
        if (stored.length > 50) stored.splice(0, stored.length - 50);
        localStorage.setItem('etms_recent_logs', JSON.stringify(stored));
      } catch (e) {
        // Ignore quota error
      }
    }
  }

  async flush(sync = false): Promise<void> {
    if (this.isFlushing || this.logQueue.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const logsToSend = [...this.logQueue];
    this.isFlushing = true;

    try {
      if (sync && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/logs/client', JSON.stringify({ logs: logsToSend }));
        this.logQueue = [];
      } else {
        const res = await fetch('/api/logs/client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend }),
        });

        if (res.ok) {
          // Remove sent logs from queue
          this.logQueue = this.logQueue.filter((l) => !logsToSend.some((s) => s.id === l.id));
        }
      }
    } catch (err) {
      // Keep in queue to retry later
    } finally {
      this.isFlushing = false;
    }
  }

  getRecentLogs(): ClientLog[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('etms_recent_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  clearLogs(): void {
    this.logQueue = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('etms_recent_logs');
    }
  }
}

export const logger = new StructuredClientLogger();
