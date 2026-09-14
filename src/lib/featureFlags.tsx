'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ETMSFeatureFlags {
  feature_broadcasting_alerts: boolean;
  feature_kyc_onboarding: boolean;
  feature_command_palette: boolean;
  feature_audit_log_viewer: boolean;
  feature_speech_data_entry: boolean;
  [key: string]: boolean;
}

export const DEFAULT_FEATURE_FLAGS: ETMSFeatureFlags = {
  feature_broadcasting_alerts: true,
  feature_kyc_onboarding: true,
  feature_command_palette: true,
  feature_audit_log_viewer: true,
  feature_speech_data_entry: true,
};

interface FeatureFlagsContextType {
  flags: ETMSFeatureFlags;
  loading: boolean;
  isEnabled: (flagKey: keyof ETMSFeatureFlags | string) => boolean;
  refreshFlags: () => Promise<void>;
  toggleFlagLocally: (flagKey: string, enabled: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FEATURE_FLAGS,
  loading: false,
  isEnabled: () => true,
  refreshFlags: async () => {},
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

  const refreshFlags = async () => {
    try {
      setLoading(true);
      const companyId = typeof window !== 'undefined' ? localStorage.getItem('etms_company_id') || '00000000-0000-0000-0000-000000000000' : '00000000-0000-0000-0000-000000000000';
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
    if (flagKey in flags) {
      return Boolean(flags[flagKey]);
    }
    return Boolean(DEFAULT_FEATURE_FLAGS[flagKey] ?? true);
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
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refreshFlags, toggleFlagLocally }}>
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
