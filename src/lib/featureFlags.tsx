'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  const [loading, setLoading] = useState(false);

  const refreshFlags = async (overrideCompanyId?: string) => {
    try {
      setLoading(true);
      const companyId =
        overrideCompanyId ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('etms_active_company_id') || localStorage.getItem('etms_company_id') || '00000000-0000-0000-0000-000000000000'
          : '00000000-0000-0000-0000-000000000000');
      const res = await fetch(`${OPS_API_BASE}/companies/${companyId}/feature-flags`);
      if (res.ok) {
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
      console.warn('OPS Feature flags sync unavailable, using default/cached flags');
    } finally {
      setLoading(false);
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
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
