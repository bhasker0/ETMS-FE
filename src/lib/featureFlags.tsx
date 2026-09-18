'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface ETMSFeatureFlags {


  feature_broadcasting_alerts: boolean;
  feature_kyc_onboarding: boolean;
  feature_command_palette: boolean;
  feature_audit_log_viewer: boolean;
  feature_speech_data_entry: boolean;
  feature_shift_production: boolean;
  feature_machines: boolean;
  feature_karigars: boolean;
  feature_inward_challans: boolean;
  feature_parties: boolean;
  feature_outward_invoices: boolean;
  feature_purchases: boolean;
  feature_expenses: boolean;
  feature_reports: boolean;
  feature_uchapat_advance: boolean;
  feature_wage_hisab: boolean;
  feature_tally_export: boolean;
  feature_munim_portal: boolean;
  feature_whatsapp_dispatch: boolean;
  [key: string]: boolean;
}

export const DEFAULT_FEATURE_FLAGS: ETMSFeatureFlags = {
  feature_broadcasting_alerts: true,
  feature_kyc_onboarding: true,
  feature_command_palette: true,
  feature_audit_log_viewer: true,
  feature_speech_data_entry: true,
  feature_shift_production: true,
  feature_machines: true,
  feature_karigars: true,
  feature_inward_challans: true,
  feature_parties: true,
  feature_outward_invoices: true,
  feature_purchases: true,
  feature_expenses: true,
  feature_reports: true,
  feature_uchapat_advance: true,
  feature_wage_hisab: true,
  feature_tally_export: true,
  feature_munim_portal: true,
  feature_whatsapp_dispatch: true,
};

interface FeatureFlagsContextType {
  flags: ETMSFeatureFlags;
  loading: boolean;
  isEnabled: (flagKey: keyof ETMSFeatureFlags | string) => boolean;
  refreshFlags: (companyId?: string) => Promise<void>;
  setCompanyFlags: (newFlags: Record<string, boolean>) => void;
  toggleFlagLocally: (flagKey: string, enabled: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FEATURE_FLAGS,
  loading: false,
  isEnabled: () => true,
  refreshFlags: async () => {},
  setCompanyFlags: () => {},
  toggleFlagLocally: () => {},
});

const OPS_API_BASE = process.env.NEXT_PUBLIC_OPS_API_URL || 'http://localhost:5000/api';
const STORAGE_KEY = 'etms_feature_flags_cache';

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<ETMSFeatureFlags>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(cached) };
      } catch (_e) {
        console.warn('Failed to parse cached feature flags');
      }
    }
    return DEFAULT_FEATURE_FLAGS;
  });

  const [loading] = useState(false);

  const refreshFlags = async (overrideCompanyId?: string) => {
    try {
      const companyId =
        overrideCompanyId ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('etms_active_company_id') || localStorage.getItem('etms_company_id') || '00000000-0000-0000-0000-000000000000'
          : '00000000-0000-0000-0000-000000000000');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${OPS_API_BASE}/companies/${companyId}/feature-flags`, {
        signal: controller.signal,
      }).catch(() => null);
      
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const merged = { ...DEFAULT_FEATURE_FLAGS, ...json.data };
          setFlags(merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        }
      }
    } catch (_err) {
      // Fallback gracefully to existing/default flags
    }
  };

  const setCompanyFlags = (newFlags: Record<string, boolean>) => {
    const merged = { ...DEFAULT_FEATURE_FLAGS, ...newFlags };
    setFlags(merged);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  };

  useEffect(() => {
    refreshFlags();

    const handleIncomingEvent = (eventData: any) => {
      try {
        const currentCompanyId =
          localStorage.getItem('etms_active_company_id') ||
          localStorage.getItem('etms_company_id');

        if (
          eventData.company_id &&
          currentCompanyId &&
          eventData.company_id !== currentCompanyId &&
          eventData.company_id !== '00000000-0000-0000-0000-000000000000'
        ) {
          return;
        }

        if (eventData.type === 'FEATURE_FLAG_UPDATED' || eventData.type === 'PARAMETER_UPDATED') {
          const flagKey = eventData.key;
          const isEnabledVal = eventData.enabled;
          const formattedName = flagKey
            ? flagKey.replace(/^feature_/, '').replace(/_/g, ' ').toUpperCase()
            : 'Setting';

          if (flagKey) {
            toast.info(`⚙️ Parameter Updated: ${formattedName} is now ${isEnabledVal ? 'ENABLED' : 'DISABLED'}`, {
              description: 'Operational permissions refreshed in real time from OPS.',
              duration: 4000,
            });
          } else {
            toast.info(`⚙️ Company Parameters Refreshed from OPS`, {
              description: 'Updated operational settings applied in real time.',
              duration: 3500,
            });
          }

          if (eventData.feature_flags) {
            setFlags((prev) => {
              const updated = { ...prev, ...eventData.feature_flags };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } else if (flagKey) {
            setFlags((prev) => {
              const cleanKey = flagKey.replace(/^feature_/, '').replace(/_enabled$/, '');
              const updated = {
                ...prev,
                [flagKey]: Boolean(isEnabledVal),
                [`feature_${cleanKey}`]: Boolean(isEnabledVal),
                [`${cleanKey}_enabled`]: Boolean(isEnabledVal),
                [cleanKey]: Boolean(isEnabledVal),
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }

          refreshFlags(currentCompanyId || undefined);
          window.dispatchEvent(new CustomEvent('etms-parameters-updated', { detail: eventData }));
        }
      } catch (err) {
        console.error('Error handling realtime sync event:', err);
      }
    };

    // 1. Connect to ETMS Backend SSE stream
    let etmsEventSource: EventSource | null = null;
    try {
      etmsEventSource = new EventSource('http://localhost:4000/api/v1/ops-sync/events');
      etmsEventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleIncomingEvent(parsed);
        } catch (_err) {
          // ignore
        }
      };
    } catch (_err) {
      // ignore
    }

    // 2. Connect to OPS Backend SSE stream
    let opsEventSource: EventSource | null = null;
    try {
      opsEventSource = new EventSource('http://localhost:5000/api/companies/events');
      opsEventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleIncomingEvent(parsed);
        } catch (_err) {
          // ignore
        }
      };
    } catch (_err) {
      // ignore
    }

    // Listen for cross-tab or runtime storage updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setFlags({ ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(e.newValue) });
        } catch (_err) {
          // ignore
        }
      }
    };

    const handleCompanySwitch = (e: Event) => {
      const customEvent = e as CustomEvent<{ companyId?: string }>;
      refreshFlags(customEvent.detail?.companyId);
    };

    // Fallback heartbeat synchronization every 4 seconds
    const intervalId = setInterval(() => {
      refreshFlags();
    }, 4000);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('etms-company-switched', handleCompanySwitch);

    return () => {
      clearInterval(intervalId);
      etmsEventSource?.close();
      opsEventSource?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('etms-company-switched', handleCompanySwitch);
    };
  }, []);


  const isEnabled = (flagKey: keyof ETMSFeatureFlags | string): boolean => {
    if (!flagKey) return true;
    const keyStr = String(flagKey);
    const cleanKey = keyStr.replace(/^feature_/, '').replace(/_enabled$/, '');
    const candidates = [
      keyStr,
      `feature_${keyStr}`,
      `${keyStr}_enabled`,
      `feature_${keyStr}_enabled`,
      cleanKey,
      `feature_${cleanKey}`,
      `${cleanKey}_enabled`,
      `feature_${cleanKey}_enabled`,
    ];

    for (const cand of candidates) {
      if (cand in flags) {
        return Boolean(flags[cand]);
      }
    }

    return Boolean(DEFAULT_FEATURE_FLAGS[keyStr] ?? true);
  };

  const toggleFlagLocally = (flagKey: string, enabled: boolean) => {
    setFlags((prev) => {
      const next = { ...prev, [flagKey]: enabled };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refreshFlags, setCompanyFlags, toggleFlagLocally }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function FeatureGate({
  flag,
  fallback = null,
  children,
}: {
  flag: keyof ETMSFeatureFlags | string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { isEnabled } = useFeatureFlags();
  if (!isEnabled(flag)) {
    return fallback as JSX.Element | null;
  }
  return <>{children}</>;
}

export function PageFeatureGate({
  flag,
  title,
  children,
}: {
  flag: keyof ETMSFeatureFlags | string;
  title?: string;
  children: ReactNode;
}) {
  const { isEnabled } = useFeatureFlags();
  if (!isEnabled(flag)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xs shadow-xs text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-sm">
          !
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[var(--text-main)]">
            {title ? `${title} Restricted` : 'Feature Not Available'}
          </h2>
          <p className="text-2xs text-[var(--text-muted)] max-w-sm mx-auto">
            You do not have authority for this functionality. This feature is disabled for your company subscription. Please contact your Super Admin.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xs text-2xs font-medium text-[var(--text-main)] transition cursor-pointer"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
