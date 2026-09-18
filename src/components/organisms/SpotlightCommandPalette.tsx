'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useAuth } from '@/lib/auth-context';
import {
  Search,
  Clock,
  Truck,
  Users,
  FileText,
  ShoppingBag,
  Receipt,
  Layers,
  Wrench,
  UserPlus,
  Wallet,
  Calculator,
  BarChart3,
  FileSpreadsheet,
  CornerDownLeft,
  Mic,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'action' | 'navigation';
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  keywords: string[];
  feature?: string;
  perform: () => void;
}

export const SpotlightCommandPalette: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { openDrawer } = useAppDrawer();
  const { hasCompanyFeature } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const { t } = useI18n();
  const tr = t as unknown as Record<string, string>;

  // Define actions & navigation items
  const items: PaletteItem[] = useMemo(
    () => [
      // Universal Voice Data Entry Action
      {
        id: 'action-speech-data-entry',
        category: 'action',
        title: 'Universal Speech Data Entry (Bhashini Indic ASR)',
        description: 'Speak in Gujarati, Hindi or English to auto-enter Lots, Shifts, Karigars, or Expenses',
        icon: <Mic className="w-4 h-4 text-rose-500 animate-pulse" />,
        badge: 'Voice AI',
        feature: 'speech_data_entry',
        keywords: ['speech', 'voice', 'bhashini', 'boline', 'audio', 'mic', 'gu-in', 'indic', 'asr', 'challan', 'shift', 'karigar', 'expense', 'uchapat'],
        perform: () => window.dispatchEvent(new CustomEvent('open-speech-data-entry')),
      },
      // Quick Create Actions (Drawers)
      {
        id: 'action-log-shift',
        category: 'action',
        title: tr.shift_logShift || tr.shift_log || 'Log Shift',
        description: 'Record stitches, machine heads, RPM & shift meters',
        icon: <Clock className="w-4 h-4 text-emerald-500" />,
        badge: 'Drawer',
        feature: 'shift_production',
        keywords: ['shift', 'log', 'meter', 'stitch', 'rpm', 'karigar', 'fabric'],
        perform: () => openDrawer('LOG_SHIFT', {}),
      },
      {
        id: 'action-add-challan',
        category: 'action',
        title: tr.challan_addChallan || 'Add Inward Lot (Challan)',
        description: 'Receive grey fabric rolls from party with SAC 9988',
        icon: <Truck className="w-4 h-4 text-sky-500" />,
        badge: 'Drawer',
        feature: 'inward_challans',
        keywords: ['lot', 'challan', 'inward', 'party', 'grey', 'taka', 'fabric'],
        perform: () => openDrawer('ADD_CHALLAN', {}),
      },
      {
        id: 'action-add-party',
        category: 'action',
        title: tr.party_addParty || 'Add Client Party',
        description: 'Register textile trader / customer profile & GSTIN',
        icon: <Users className="w-4 h-4 text-indigo-500" />,
        badge: 'Drawer',
        feature: 'parties',
        keywords: ['party', 'trader', 'client', 'gstin', 'broker', 'firm'],
        perform: () => openDrawer('ADD_PARTY', {}),
      },
      {
        id: 'action-create-invoice',
        category: 'action',
        title: tr.invoice_createInvoice || 'Add Outward Invoice',
        description: 'Generate SAC 9988 job-work tax bill with CGST/SGST',
        icon: <FileText className="w-4 h-4 text-amber-500" />,
        badge: 'Drawer',
        feature: 'outward_invoices',
        keywords: ['invoice', 'bill', 'sac 9988', 'tax', 'gst', 'outward'],
        perform: () => openDrawer('CREATE_INVOICE', {}),
      },
      {
        id: 'action-create-purchase',
        category: 'action',
        title: tr.purchase_createPurchase || 'Add Purchase Bill',
        description: 'Log yarn, zari, needles, machine oil & factory supplies',
        icon: <ShoppingBag className="w-4 h-4 text-violet-500" />,
        badge: 'Drawer',
        feature: 'purchases',
        keywords: ['purchase', 'raw material', 'yarn', 'zari', 'thread', 'needles', 'supplier'],
        perform: () => openDrawer('CREATE_PURCHASE', {}),
      },
      {
        id: 'action-create-expense',
        category: 'action',
        title: tr.expense_createExpense || 'Add Factory Expense',
        description: 'Record direct/indirect expenses, electricity, maintenance, chai-pani',
        icon: <Receipt className="w-4 h-4 text-rose-500" />,
        badge: 'Drawer',
        feature: 'expenses',
        keywords: ['expense', 'petty cash', 'electricity', 'rent', 'chai', 'indirect', 'direct'],
        perform: () => openDrawer('CREATE_EXPENSE', {}),
      },
      {
        id: 'action-add-machine',
        category: 'action',
        title: tr.machine_addMachine || 'Add Embroidery Machine',
        description: 'Register multi-head embroidery machine into factory fleet',
        icon: <Wrench className="w-4 h-4 text-teal-500" />,
        badge: 'Drawer',
        feature: 'machines',
        keywords: ['machine', 'heads', 'embroidery', 'fleet', 'rpm'],
        perform: () => openDrawer('ADD_MACHINE', {}),
      },
      {
        id: 'action-add-karigar',
        category: 'action',
        title: tr.karigar_addKarigar || 'Add Karigar (Worker)',
        description: 'Enroll machine operator, master, or shift helper',
        icon: <UserPlus className="w-4 h-4 text-emerald-500" />,
        badge: 'Drawer',
        feature: 'karigars',
        keywords: ['karigar', 'worker', 'operator', 'master', 'rate', 'wage'],
        perform: () => openDrawer('ADD_KARIGAR', {}),
      },
      {
        id: 'action-add-uchapat',
        category: 'action',
        title: tr.karigar_addUchapat || 'Record Karigar Uchapat',
        description: 'Issue mid-term wage advance via Cash or UPI',
        icon: <Wallet className="w-4 h-4 text-amber-500" />,
        badge: 'Drawer',
        feature: 'uchapat_advance',
        keywords: ['uchapat', 'advance', 'loan', 'karigar', 'cash', 'upi'],
        perform: () => openDrawer('ADD_UCHAPAT', {}),
      },
      {
        id: 'action-compute-hisab',
        category: 'action',
        title: tr.karigar_computeHisab || 'Compute Fortnightly Wage Hisab',
        description: 'Settle piece-rate earnings, reconcile uchapat advances & payslips',
        icon: <Calculator className="w-4 h-4 text-blue-500" />,
        badge: 'Drawer',
        feature: 'wage_hisab',
        keywords: ['hisab', 'salary', 'settle', 'piece rate', 'karigar hisab'],
        perform: () => openDrawer('COMPUTE_HISAB', {}),
      },
      {
        id: 'action-thread-ledger',
        category: 'action',
        title: tr.thread_ledgerTitle || 'Thread & Lot Consumption Ledger',
        description: tr.thread_ledgerSubtitle || 'Track cone inward, color lots, stitch efficiency & yarn wastage',
        icon: <Layers className="w-4 h-4 text-indigo-500" />,
        badge: 'Drawer',
        feature: 'inward_challans',
        keywords: ['thread', 'yarn', 'zari', 'cone', 'wastage', 'lot', 'consumption', 'dora'],
        perform: () => openDrawer('THREAD_LEDGER', {}),
      },
      {
        id: 'action-machine-maintenance',
        category: 'action',
        title: tr.maint_title || 'Machine Downtime & Maintenance Telemetry',
        description: tr.maint_subtitle || 'Log machine stops, mechanical breakdowns, technician notes & repair expenses',
        icon: <Wrench className="w-4 h-4 text-amber-500" />,
        badge: 'Drawer',
        feature: 'machines',
        keywords: ['maintenance', 'breakdown', 'downtime', 'repair', 'mistri', 'stoppage', 'needle'],
        perform: () => openDrawer('MACHINE_MAINTENANCE', {}),
      },
      {
        id: 'action-shrinkage-cert',
        category: 'action',
        title: tr.shrink_title || 'Fabric Shrinkage & Loss Tolerance Certificate',
        description: tr.shrink_subtitle || 'Scientific shrinkage calculation & quality certificate for textile traders',
        icon: <Truck className="w-4 h-4 text-emerald-500" />,
        badge: 'Drawer',
        feature: 'inward_challans',
        keywords: ['shrinkage', 'tolerance', 'certificate', 'loss', 'inward', 'outward', 'meters'],
        perform: () => openDrawer('SHRINKAGE_CERTIFICATE', {}),
      },
      {
        id: 'action-ugraani-recovery',
        category: 'action',
        title: tr.ugraani_title || 'Textile Trader Ugraani & Recovery Pipeline',
        description: tr.ugraani_subtitle || 'Credit aging buckets, interest on delayed payment & WhatsApp reminder',
        icon: <Users className="w-4 h-4 text-sky-500" />,
        badge: 'Drawer',
        feature: 'parties',
        keywords: ['ugraani', 'recovery', 'aging', 'credit', 'whatsapp', 'reminder', 'trader'],
        perform: () => openDrawer('UGRAANI_RECOVERY', {}),
      },
      {
        id: 'action-karigar-wage-slip',
        category: 'action',
        title: tr.wageSlip_title || 'Karigar Fortnightly Wage Hisab Slip',
        description: tr.wageSlip_subtitle || 'Shift stitch summary, rate calculation, Uchapat advances deduction & net wage',
        icon: <FileText className="w-4 h-4 text-teal-500" />,
        badge: 'Drawer',
        feature: 'wage_hisab',
        keywords: ['wage slip', 'payslip', 'pavati', 'karigar wage', 'uchapat', 'hisab slip'],
        perform: () => openDrawer('KARIGAR_WAGE_SLIP', {}),
      },
      {
        id: 'action-sac-tally-sync',
        category: 'action',
        title: tr.sacTally_title || 'SAC 9988 GST Invoicing & Tally Prime 4.0 XML',
        description: tr.sacTally_subtitle || 'Direct job-work tax computation (2.5% + 2.5% / 5%) & Tally envelope export',
        icon: <FileSpreadsheet className="w-4 h-4 text-purple-500" />,
        badge: 'Drawer',
        feature: 'tally_export',
        keywords: ['sac 9988', 'tally', 'xml', 'gst', 'cgst', 'sgst', 'export', 'tally prime'],
        perform: () => openDrawer('SAC_INVOICING_TALLY', {}),
      },

      // Quick Module Navigation
      {
        id: 'nav-dashboard',
        category: 'navigation',
        title: 'Go to Factory Dashboard',
        description: 'Live machine telemetry, floor KPIs & design progress',
        icon: <Layers className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'dashboard',
        keywords: ['dashboard', 'home', 'overview', 'kpi', 'telemetry'],
        perform: () => router.push('/'),
      },
      {
        id: 'nav-shifts',
        category: 'navigation',
        title: 'Go to Shift Telemetry',
        description: 'Shift logs, meters produced, day/night shifts & defect records',
        icon: <Clock className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'shift_production',
        keywords: ['shifts', 'shift logs', 'meters', 'telemetry'],
        perform: () => router.push('/shift'),
      },
      {
        id: 'nav-machines',
        category: 'navigation',
        title: 'Go to Embroidery Machines',
        description: 'Fleet monitoring, multi-head specifications & live state',
        icon: <Wrench className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'machines',
        keywords: ['machines', 'fleet', 'heads', 'status'],
        perform: () => router.push('/machines'),
      },
      {
        id: 'nav-karigars',
        category: 'navigation',
        title: 'Go to Karigars & Wages',
        description: 'Worker roster, wage hisab settlements & advance ledgers',
        icon: <Users className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'karigars',
        keywords: ['karigars', 'workers', 'salary', 'wages', 'uchapat'],
        perform: () => router.push('/karigars'),
      },
      {
        id: 'nav-challans',
        category: 'navigation',
        title: 'Go to Inward Lots & Challans',
        description: 'Fabric inwards, grey roll tracking & lot shrinkage',
        icon: <Truck className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'inward_challans',
        keywords: ['challans', 'inward lots', 'fabric', 'rolls', 'shrinkage'],
        perform: () => router.push('/challans'),
      },
      {
        id: 'nav-parties',
        category: 'navigation',
        title: 'Go to Client Parties',
        description: 'Customer directory, party ledgers & job-work accounts',
        icon: <Users className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'parties',
        keywords: ['parties', 'traders', 'clients', 'gstin', 'ledger'],
        perform: () => router.push('/parties'),
      },
      {
        id: 'nav-invoices',
        category: 'navigation',
        title: 'Go to Outward Invoices',
        description: 'SAC 9988 job-work billing, tax invoices & PDF printing',
        icon: <FileText className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'outward_invoices',
        keywords: ['invoices', 'bills', 'sac 9988', 'gst', 'tax bills'],
        perform: () => router.push('/invoices'),
      },
      {
        id: 'nav-purchases',
        category: 'navigation',
        title: 'Go to Purchases',
        description: 'Procurement ledger, yarn/zari purchases & supplier balances',
        icon: <ShoppingBag className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'purchases',
        keywords: ['purchases', 'yarn', 'zari', 'materials', 'supplies'],
        perform: () => router.push('/purchases'),
      },
      {
        id: 'nav-expenses',
        category: 'navigation',
        title: 'Go to Factory Expenses',
        description: 'Direct & indirect expense tracking, electricity & salaries',
        icon: <Receipt className="w-4 h-4 text-[var(--text-muted)]" />,
        badge: 'Page',
        feature: 'expenses',
        keywords: ['expenses', 'direct expenses', 'indirect expenses', 'costs'],
        perform: () => router.push('/expenses'),
      },
      {
        id: 'nav-reports',
        category: 'navigation',
        title: 'Go to Reports Hub',
        description: 'Production, financial, party ledgers & Excel/PDF exports',
        icon: <BarChart3 className="w-4 h-4 text-indigo-500" />,
        badge: 'Page',
        feature: 'reports',
        keywords: ['reports', 'excel', 'analytics', 'audit', 'summary'],
        perform: () => router.push('/reports'),
      },
      {
        id: 'nav-munim',
        category: 'navigation',
        title: 'Go to Munim & Tally Prime Hub',
        description: 'CA collaboration, GSTR-1 verification & 1-click Tally XML export',
        icon: <FileSpreadsheet className="w-4 h-4 text-amber-500" />,
        badge: 'Page',
        feature: 'munim_portal',
        keywords: ['munim', 'tally', 'accountant', 'ca', 'gstr-1', 'xml'],
        perform: () => router.push('/munim/dashboard'),
      },
    ],
    [openDrawer, router, tr]
  );

  // Filter items based on active company feature flags and user search query
  const filteredItems = useMemo(() => {
    const isFeatureAllowed = (featureKey?: string) => {
      if (!featureKey || featureKey === 'dashboard') return true;
      return hasCompanyFeature(featureKey) && isEnabled(featureKey);
    };

    const allowedItems = items.filter((item) => isFeatureAllowed(item.feature));
    const q = search.trim().toLowerCase();
    if (!q) return allowedItems;
    return allowedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [items, search, hasCompanyFeature, isEnabled]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const [isListening, setIsListening] = useState(false);

  // Global keyboard shortcuts (Ctrl + K, Ctrl + Space / Cmd + Space, Escape)
  useEffect(() => {
    if (pathname === '/login' || pathname === '/forgot-password') {
      setIsOpen(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled('feature_command_palette')) return;
      // Ctrl + K or Ctrl + Space or Meta + K / Meta + Space
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      if (isEnabled('feature_command_palette')) {
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-spotlight', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-spotlight', handleCustomOpen);
    };
  }, [isEnabled, pathname]);

  const handleVoiceSearch = () => {
    if (!isEnabled('feature_command_palette')) return;
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearch('Inward Lot Challan');
      inputRef.current?.focus();
    }, 1200);
  };

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSearch('');
      }, 50);
    }
  }, [isOpen]);

  // Arrow key navigation inside list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    }
  };

  const executeItem = (item: PaletteItem) => {
    setIsOpen(false);
    item.perform();
  };

  if (!isOpen || !isEnabled('feature_command_palette')) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-3 sm:px-4 animate-in fade-in duration-100 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-150">
        {/* Search Header */}
        <div className="relative flex items-center px-3.5 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={isListening ? "Listening (Bhashini Voice Search)..." : "Type an action or press mic... (e.g. 'Lot', 'Shift', 'Invoice', 'Expense')"}
            className="w-full h-12 bg-transparent text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-1.5 rounded-md border transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'
              }`}
              title="Voice Search (Bhashini ASR)"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <kbd className="hidden sm:inline-flex items-center text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
              Ctrl+K
            </kbd>
            <kbd className="inline-flex items-center text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-1.5 divide-y divide-[var(--border)]/30 space-y-0.5"
        >
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--text-muted)]">
              No matching action or module found for &quot;<span className="text-[var(--text-main)] font-semibold">{search}</span>&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] ring-1 ring-[var(--border)]'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[var(--border)] ${
                        isSelected ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate text-[var(--text-main)]">
                          {item.title}
                        </span>
                        <span
                          className={`text-[0.6rem] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                            item.category === 'action'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60'
                              : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[0.6875rem] text-[var(--text-muted)] truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                        <CornerDownLeft className="w-2.5 h-2.5" />
                        <span>Select</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--bg-surface-elevated)] border-t border-[var(--border)] text-[0.65rem] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 rounded bg-[var(--bg-surface)] border border-[var(--border)]">↑</kbd>
              <kbd className="font-mono px-1 rounded bg-[var(--bg-surface)] border border-[var(--border)]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 rounded bg-[var(--bg-surface)] border border-[var(--border)]">↵</kbd>
              <span>open</span>
            </span>
          </div>
          <span className="font-mono">Quick Navigation & Drawer Launcher</span>
        </div>
      </div>
    </div>
  );
};
