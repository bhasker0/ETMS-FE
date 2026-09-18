'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone, X, Bell } from 'lucide-react';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useI18n } from '@/lib/i18n';

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
  timestamp: string;
  category: 'system' | 'compliance' | 'gst' | 'shift';
}

const SAMPLE_BROADCASTS: BroadcastMessage[] = [
  {
    id: 'bc-1',
    title: 'GIDC Power Maintenance Advisory',
    message: 'Sachin GIDC feeder line maintenance scheduled on Sunday (02:00 AM - 06:00 AM). Please plan shift logs accordingly.',
    priority: 'warning',
    timestamp: '10 mins ago',
    category: 'shift',
  },
  {
    id: 'bc-2',
    title: 'SAC 9988 GST E-Invoice Compliance',
    message: 'Monthly job-work e-invoicing export is now reconciled with Tally Prime 4.0 specification.',
    priority: 'info',
    timestamp: '2 hours ago',
    category: 'gst',
  },
];

export function BroadcastingAlertsBanner() {
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();
  const { language } = useI18n();
  const [alerts] = useState<BroadcastMessage[]>(SAMPLE_BROADCASTS);
  const [activeAlertIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  if (pathname === '/login' || pathname === '/forgot-password' || !isEnabled('feature_broadcasting_alerts')) {
    return null;
  }

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  if (activeAlerts.length === 0) return null;

  const current = activeAlerts[activeAlertIndex % activeAlerts.length];

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="w-full bg-[#FAF9F5] border-b border-[#EAEAEA] px-3 sm:px-6 py-2 text-xs text-[#111111] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowDrawer(true)}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#111111] text-white shrink-0">
            <Megaphone size={11} />
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#EDECE8] text-[#555555] shrink-0">
            {current.category}
          </span>
          <p className="truncate font-medium text-[#222222]">
            <span className="font-semibold">{current.title}:</span> {current.message}
          </p>
          <span className="text-[11px] text-[#777777] shrink-0 hidden md:inline">
            &bull; {current.timestamp} ({language.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDrawer(true)}
            className="px-2 py-1 text-[11px] rounded border border-[#D5D4CE] bg-white text-[#333333] hover:bg-[#F2F1ED] transition-colors"
          >
            View All ({activeAlerts.length})
          </button>
          <button
            onClick={(e) => handleDismiss(current.id, e)}
            className="p-1 rounded text-[#777777] hover:text-[#111111] hover:bg-[#EAEAEA] transition-colors"
            title="Dismiss alert"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Slide-over Notification Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-[#FBFBF9] border-l border-[#EAEAEA] shadow-2xl flex flex-col animate-slide-left">
            <div className="p-4 border-b border-[#EAEAEA] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#111111]" />
                <h3 className="font-semibold text-sm text-[#111111]">Broadcast Alerts & Advisories</h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-md hover:bg-[#F0EFEA] text-[#666666]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-lg border border-[#EAEAEA] bg-white shadow-sm hover:border-[#D5D4CE] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F2F1ED] text-[#444444]">
                      {alert.category}
                    </span>
                    <span className="text-[11px] text-[#888888]">{alert.timestamp}</span>
                  </div>
                  <h4 className="font-medium text-xs text-[#111111]">{alert.title}</h4>
                  <p className="text-xs text-[#555555] leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[#EAEAEA] bg-white text-center">
              <button
                onClick={() => setShowDrawer(false)}
                className="w-full py-2 text-xs font-medium rounded-md bg-[#111111] text-white hover:bg-[#222222] transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
