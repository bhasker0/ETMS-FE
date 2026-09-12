'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DrawerType =
  | 'ADD_KARIGAR'
  | 'EDIT_KARIGAR'
  | 'KARIGAR_LEDGER'
  | 'ADD_MACHINE'
  | 'EDIT_MACHINE'
  | 'ADD_UCHAPAT'
  | 'INVITE_COMPANY'
  | 'COMPUTE_HISAB'
  | 'LOG_SHIFT'
  | 'ADD_CHALLAN'
  | 'VIEW_CHALLAN'
  | 'EDIT_CHALLAN'
  | 'CREATE_INVOICE'
  | 'VIEW_INVOICE'
  | 'EDIT_INVOICE'
  | 'ADD_PARTY'
  | 'EDIT_PARTY'
  | 'LOG_DEFECT'
  | 'GENERATE_EWB'
  | 'IOT_GATEWAY_CONFIG'
  | 'OFFLINE_CONFLICTS'
  | 'VOICE_SHIFT_LOGGER'
  | 'CREATE_PURCHASE'
  | 'VIEW_PURCHASE'
  | 'CREATE_EXPENSE'
  | 'THREAD_LEDGER'
  | 'MACHINE_MAINTENANCE'
  | 'SHRINKAGE_CERTIFICATE'
  | 'UGRAANI_RECOVERY'
  | 'KARIGAR_WAGE_SLIP'
  | 'SAC_INVOICING_TALLY';

export interface DrawerInstance {
  id: string;
  type: DrawerType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (result?: any) => void;
}

export interface AppDrawerContextValue {
  drawerStack: DrawerInstance[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDrawer: <T = any>(type: DrawerType, payload?: any, onSuccess?: (result: T) => void) => void;
  closeDrawer: () => void;
  closeAllDrawers: () => void;
  isDrawerOpen: (type?: DrawerType) => boolean;
  topDrawer: DrawerInstance | null;
}

const AppDrawerContext = createContext<AppDrawerContextValue | undefined>(undefined);

export const AppDrawerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drawerStack, setDrawerStack] = useState<DrawerInstance[]>([]);

  const openDrawer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any,>(type: DrawerType, payload?: any, onSuccess?: (result: T) => void) => {
      const newInstance: DrawerInstance = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        payload: payload || {},
        onSuccess,
      };
      setDrawerStack((prev) => [...prev, newInstance]);
    },
    []
  );

  const closeDrawer = useCallback(() => {
    setDrawerStack((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, prev.length - 1);
    });
  }, []);

  const closeAllDrawers = useCallback(() => {
    setDrawerStack([]);
  }, []);

  const isDrawerOpen = useCallback(
    (type?: DrawerType) => {
      if (!type) return drawerStack.length > 0;
      return drawerStack.some((d) => d.type === type);
    },
    [drawerStack]
  );

  const topDrawer = drawerStack.length > 0 ? drawerStack[drawerStack.length - 1] : null;

  return (
    <AppDrawerContext.Provider
      value={{
        drawerStack,
        openDrawer,
        closeDrawer,
        closeAllDrawers,
        isDrawerOpen,
        topDrawer,
      }}
    >
      {children}
    </AppDrawerContext.Provider>
  );
};

export function useAppDrawer(): AppDrawerContextValue {
  const context = useContext(AppDrawerContext);
  if (!context) {
    throw new Error('useAppDrawer must be used within an AppDrawerProvider');
  }
  return context;
}
