'use client';

import React, { useState } from 'react';
import { X, History, Search, Globe, ArrowRight } from 'lucide-react';
import { useFeatureFlags } from '@/lib/featureFlags';

export interface AuditRecord {
  id: string;
  module: 'CHALLAN' | 'SHIFT' | 'INVOICE' | 'KARIGAR' | 'UCHAPAT' | 'SETTINGS';
  action: string;
  actor: string;
  timestamp: string;
  noteOriginal: string;
  noteTranslated?: string;
  langCode?: string;
  diff?: { field: string; from: unknown; to: unknown }[];
}

const SAMPLE_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'aud-101',
    module: 'CHALLAN',
    action: 'INWARD_LOT_CREATED',
    actor: 'Bhasker Savaliya',
    timestamp: 'Today, 11:42 AM',
    noteOriginal: 'પાર્ટી શ્રી રાધે ટેક્સટાઇલ તરફથી ૨૪૦૦ મીટર ગ્રે કાપડ સ્વીકાર્યું (લોટ #RK-88)',
    noteTranslated: 'Received 2400 meters grey cloth from Party Shri Radhe Textiles (Lot #RK-88)',
    langCode: 'gu',
    diff: [{ field: 'meters', from: 0, to: 2400 }, { field: 'taka', from: 0, to: 24 }],
  },
  {
    id: 'aud-102',
    module: 'UCHAPAT',
    action: 'ADVANCE_DISBURSED',
    actor: 'Ramesh Patel (Munim)',
    timestamp: 'Today, 10:15 AM',
    noteOriginal: 'કારીગર રમેશભાઈ ને દિવાળી બોનસ પેટે રૂ. ૫,૦૦૦ રોકડા આપ્યા',
    noteTranslated: 'Disbursed Rs. 5,000 cash advance to Karigar Rameshbhai for Diwali festive',
    langCode: 'gu',
    diff: [{ field: 'advanceAmount', from: 0, to: 5000 }],
  },
  {
    id: 'aud-103',
    module: 'SHIFT',
    action: 'STITCH_METER_LOGGED',
    actor: 'Suresh Bhai (Supervisor)',
    timestamp: 'Yesterday, 08:30 PM',
    noteOriginal: 'Machine #04 Night shift completed 420K stitches, yarn lot #92',
    diff: [{ field: 'stitches', from: 0, to: 420000 }],
  },
  {
    id: 'aud-104',
    module: 'SETTINGS',
    action: 'RATE_PARAM_OVERRIDE',
    actor: 'Super Admin',
    timestamp: '12 Sep 2026, 04:12 PM',
    noteOriginal: 'SAC 9988 job work base rate updated from 0.38 to 0.40 per 1000 stitches',
    diff: [{ field: 'default_rate_per_1000', from: '0.38', to: '0.40' }],
  },
];

interface TenantAuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TenantAuditLogDrawer({ isOpen, onClose }: TenantAuditLogDrawerProps) {
  const { isEnabled } = useFeatureFlags();

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [translatedMap, setTranslatedMap] = useState<Record<string, boolean>>({});

  if (!isOpen || !isEnabled('feature_audit_log_viewer')) {
    return null;
  }

  const toggleTranslation = (id: string) => {
    setTranslatedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = SAMPLE_AUDIT_LOGS.filter((log) => {
    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    if (!matchesModule) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.noteOriginal.toLowerCase().includes(q) ||
      (log.noteTranslated && log.noteTranslated.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-xl h-full bg-[#FAF9F5] border-l border-[#EAEAEA] shadow-2xl flex flex-col justify-between animate-slide-left">
        {/* STICKY HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#EAEAEA] bg-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
              <History size={14} className="text-[#111111]" />
              <span>Immutable Tenant Audit Trail</span>
            </div>
            <p className="text-xs text-[#666666]">
              Real-time activity logs with Bhashini one-click translation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F0EFEA] text-[#666666] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="p-3.5 border-b border-[#EAEAEA] bg-[#F7F6F3] space-y-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
            <input
              type="text"
              placeholder="Search action, actor or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#EAEAEA] bg-white focus:outline-hidden focus:border-[#111111]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5 scrollbar-none">
            {['ALL', 'CHALLAN', 'SHIFT', 'UCHAPAT', 'INVOICE', 'SETTINGS'].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  selectedModule === mod
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-white text-[#555555] border border-[#EAEAEA] hover:border-[#D5D4CE]'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE LOG LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#777777]">
              No audit logs found matching criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isTranslated = Boolean(translatedMap[log.id]);
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-lg border border-[#EAEAEA] bg-white shadow-xs space-y-2.5 hover:border-[#D5D4CE] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F2F1ED] text-[#333333] uppercase">
                        {log.module}
                      </span>
                      <span className="text-xs font-semibold text-[#111111]">{log.action}</span>
                    </div>
                    <span className="text-[11px] text-[#888888]">{log.timestamp}</span>
                  </div>

                  <div className="text-xs text-[#444444] bg-[#FAF9F5] p-2.5 rounded border border-[#F0EFEA] space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="leading-relaxed">
                        {isTranslated && log.noteTranslated ? (
                          <span className="text-[#111111] font-medium">{log.noteTranslated}</span>
                        ) : (
                          <span>{log.noteOriginal}</span>
                        )}
                      </p>
                      {log.noteTranslated && (
                        <button
                          type="button"
                          onClick={() => toggleTranslation(log.id)}
                          className="shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border border-[#EAEAEA] bg-white text-[#444444] hover:bg-[#F2F1ED] transition-colors"
                          title="Translate via Bhashini NMT"
                        >
                          <Globe size={11} />
                          {isTranslated ? 'Original' : 'Translate'}
                        </button>
                      )}
                    </div>

                    {log.diff && log.diff.length > 0 && (
                      <div className="pt-1.5 border-t border-[#EAEAEA] flex flex-wrap gap-2 text-[11px] font-mono">
                        {log.diff.map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-[#EAEAEA]">
                            <span className="text-[#777777]">{d.field}:</span>
                            <span className="text-rose-600 line-through">{String(d.from)}</span>
                            <ArrowRight size={10} className="text-[#888888]" />
                            <span className="text-emerald-600 font-semibold">{String(d.to)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777777]">
                    <span>Actor: <strong className="text-[#222222]">{log.actor}</strong></span>
                    <span className="font-mono text-[10px] text-[#999999]">#SHA256:{log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PINNED FOOTER */}
        <div className="p-3.5 border-t border-[#EAEAEA] bg-white flex items-center justify-between">
          <span className="text-xs text-[#777777]">
            Showing {filteredLogs.length} audit entries
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#111111] text-white hover:bg-[#222222] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
