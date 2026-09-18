'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import {
  Layers,
  Clock,
  Wrench,
  Truck,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Building2,
  Check,
  User,
  Users,
  Briefcase,
  LogOut,
  Menu,
  X,
  Settings,
  Activity,
  ShoppingBag,
  Receipt,
  BarChart3,
  Search,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/lib/config-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useFeatureFlags } from '@/lib/featureFlags';
import { CompanyConfigDrawer } from './CompanyConfigDrawer';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, activeCompany, allAvailableCompanies, switchCompany, logout, login, hasCompanyFeature } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openConfigDrawer } = useConfig();
  const { openDrawer } = useAppDrawer();


  // Quick test personas
  const personas = [
    { name: 'Bhavesh Patel (Owner)', mobile: '9825012345', role: 'COMPANY_ADMIN', firm: 'Radhe Krishna Emb.' },
    { name: 'Sanjay Mehta (Supervisor)', mobile: '9825099001', role: 'SUPERVISOR', firm: 'Radhe Krishna Emb.' },
    { name: 'Kantibhai (Munim/CA)', mobile: '9825099999', role: 'MUNIM', firm: 'Kantibhai & Co.' },
    { name: 'Ghanshyam Shah (Owner 2)', mobile: '9825054321', role: 'COMPANY_ADMIN', firm: 'Shree Ram Textiles' },
  ];

  const navItems = [
    { href: '/', label: 'DASHBOARD', icon: <Layers className="w-3.5 h-3.5" />, feature: 'dashboard' },
    { href: '/shift', label: 'SHIFTS', icon: <Clock className="w-3.5 h-3.5" />, feature: 'shift_production' },
    { href: '/machines', label: 'MACHINES', icon: <Wrench className="w-3.5 h-3.5" />, feature: 'machines' },
    { href: '/karigars', label: 'KARIGARS', icon: <Users className="w-3.5 h-3.5" />, feature: 'karigars' },
    { href: '/challans', label: 'INWARD LOTS', icon: <Truck className="w-3.5 h-3.5" />, feature: 'inward_challans' },
    { href: '/parties', label: 'PARTIES', icon: <Briefcase className="w-3.5 h-3.5" />, feature: 'parties' },
    { href: '/invoices', label: 'INVOICES', icon: <FileText className="w-3.5 h-3.5" />, feature: 'outward_invoices' },
    { href: '/purchases', label: 'PURCHASES', icon: <ShoppingBag className="w-3.5 h-3.5" />, feature: 'purchases' },
    { href: '/expenses', label: 'EXPENSES', icon: <Receipt className="w-3.5 h-3.5" />, feature: 'expenses' },
    { href: '/reports', label: 'REPORTS', icon: <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />, feature: 'reports' },
    { href: '/munim/dashboard', label: 'MUNIM', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />, feature: 'munim_portal' },
  ];

  const headerActions = [
    {
      id: 'log-shift',
      label: 'Log Shift',
      icon: <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      onClick: () => openDrawer('LOG_SHIFT', {}),
      feature: 'shift_production',
    },
    {
      id: 'add-lot',
      label: 'Add Lot',
      icon: <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      onClick: () => openDrawer('ADD_CHALLAN', {}),
      feature: 'inward_challans',
    },
    {
      id: 'add-party',
      label: 'Add Parties',
      icon: <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      onClick: () => openDrawer('ADD_PARTY', {}),
      feature: 'parties',
    },
    {
      id: 'add-invoice',
      label: 'Add Invoice',
      icon: <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      onClick: () => openDrawer('CREATE_INVOICE', {}),
      feature: 'outward_invoices',
    },
    {
      id: 'add-purchase',
      label: 'Add Purchase',
      icon: <ShoppingBag className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
      onClick: () => openDrawer('CREATE_PURCHASE', {}),
      feature: 'purchases',
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      onClick: () => openDrawer('CREATE_EXPENSE', {}),
      feature: 'expenses',
    },
    {
      id: 'speech-data-entry',
      label: 'Voice Entry',
      icon: <Mic className="w-4 h-4 text-rose-500 animate-pulse" />,
      onClick: () => window.dispatchEvent(new CustomEvent('open-speech-data-entry')),
      feature: 'speech_data_entry',
    },
  ];

  const isFeatureAllowed = (featureKey?: string) => {
    if (!featureKey || featureKey === 'dashboard') return true;
    if (!mounted) return true; // Stable SSR fallback
    return hasCompanyFeature(featureKey) && isEnabled(featureKey);
  };


  const visibleNavItems = navItems.filter((item) => isFeatureAllowed(item.feature));
  const visibleHeaderActions = headerActions.filter((action) => isFeatureAllowed(action.feature));

  const handlePersonaSwitch = async (persona: typeof personas[0]) => {
    try {
      await login(persona.mobile, 'Password@123');
      toast.success(`Switched persona to ${persona.name}`);
      setProfileDropdownOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error('Login failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    try {
      await switchCompany(companyId);
      toast.success('Company context switched');
      setCompanyDropdownOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error('Failed to switch company: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  if (pathname === '/login' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border)] select-none">
      {/* Top Telemetry Header */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 h-11 sm:h-12 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Brand & Company Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-md bg-[var(--text-main)] flex items-center justify-center text-[var(--bg-surface)] font-bold text-xs shadow-xs">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-[var(--text-main)] font-sans">
                ETMS
              </span>
              <span className="hidden sm:inline-block text-[0.625rem] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-1.5 py-0.2 rounded">
                SAC 9988
              </span>
            </div>
          </Link>

          {/* Company Context Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] transition text-left rounded-md max-w-[100px] xs:max-w-[130px] sm:max-w-[190px]"
            >
              <Building2 className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              <span className="font-semibold text-[var(--text-main)] truncate text-[0.7rem] sm:text-xs">
                {activeCompany?.name || t.selectCompany || 'Select Company'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-[var(--text-muted)] shrink-0" />
            </button>

            {companyDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-64 sm:w-72 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg rounded-lg z-50 p-1.5 space-y-1 text-xs"
              >
                <div className="px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                  {t.switchCompanyDropdownTitle || 'Active Tenant Organizations'}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {allAvailableCompanies.map((c) => {
                    const isSelected = c.id === activeCompany?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCompanySelect(c.id)}
                        className={`w-full p-2 text-left text-xs flex items-center justify-between rounded-md transition ${
                          isSelected
                            ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold'
                            : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate font-semibold">{c.name}</div>
                          <div className={`text-[0.6875rem] font-mono ${isSelected ? 'text-[var(--bg-surface)]/80' : 'text-[var(--text-muted)]'}`}>
                            GST: {c.gstin || 'N/A'} • [{c.role}]
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--bg-surface)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Utility: Action Symbols, Spotlight, Settings, User Menu */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Action Symbols (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {visibleHeaderActions.map((action) => (
              <div key={action.id} className="relative group">
                <button
                  type="button"
                  onClick={action.onClick}
                  className="w-7.5 h-7.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] transition text-xs flex items-center justify-center rounded-md cursor-pointer active:scale-95"
                  aria-label={action.label}
                  title={action.label}
                >
                  {action.icon}
                </button>
                {/* Floating Tooltip */}
                <div className="pointer-events-none absolute -bottom-6.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-[var(--text-main)] text-[var(--bg-surface)] text-[0.625rem] font-semibold rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {action.label}
                </div>
              </div>
            ))}
          </div>

          {/* Spotlight Quick Nav & Action Trigger (Ctrl+Space) */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-spotlight'))}
              className="w-7.5 h-7.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] transition text-xs flex items-center justify-center rounded-md cursor-pointer active:scale-95"
              aria-label="Quick Search & Actions (Ctrl+Space)"
              title="Quick Search & Actions (Ctrl+Space)"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
            </button>
            <div className="hidden sm:block pointer-events-none absolute -bottom-6.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-[var(--text-main)] text-[var(--bg-surface)] text-[0.625rem] font-semibold rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Find (Ctrl+Space)
            </div>
          </div>

          {/* Configuration Gear Icon Button (Houses Language & Theme) */}
          <div className="relative group">
            <button
              type="button"
              onClick={openConfigDrawer}
              className="w-7.5 h-7.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] transition text-xs flex items-center justify-center rounded-md group/btn cursor-pointer active:scale-95"
              aria-label={t.configDrawerTooltip || t.settingsTitle || 'Company Configuration & Settings'}
              title="Settings (Language & Theme)"
            >
              <Settings className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-90 text-[var(--text-muted)] group-hover/btn:text-[var(--text-main)]" />
            </button>
            <div className="hidden sm:block pointer-events-none absolute -bottom-6.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-[var(--text-main)] text-[var(--bg-surface)] text-[0.625rem] font-semibold rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Settings
            </div>
          </div>

          {/* User Profile & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="h-7.5 px-1.5 sm:px-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] font-semibold rounded-md transition flex items-center gap-1 sm:gap-1.5"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--text-main)]">
                <User className="w-2.5 h-2.5" />
              </div>
              <span className="hidden sm:inline truncate max-w-[80px] text-2xs">
                {user?.fullName?.split(' ')[0] || 'Operator'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-[var(--text-muted)]" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-60 sm:w-64 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg rounded-lg z-50 p-1.5 space-y-1 text-xs"
              >
                <div className="p-2 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] rounded-md">
                  <div className="font-bold text-[var(--text-main)] truncate">{user?.fullName}</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">Tel: {user?.mobile}</div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium mt-0.5">Role: <span className="text-[var(--text-main)] font-semibold">{activeCompany?.role || 'OPERATOR'}</span></div>
                </div>

                <div className="px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t.fastPersonaSwitchTitle || 'Fast Persona Switch'}
                </div>

                <div className="space-y-0.5">
                  {personas.map((p) => {
                    const isSelected = user?.mobile === p.mobile;
                    return (
                      <button
                        key={p.mobile}
                        onClick={() => handlePersonaSwitch(p)}
                        className={`w-full px-2 py-1 text-left flex items-center justify-between text-xs rounded-md transition ${
                          isSelected
                            ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold'
                            : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)]'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className={`text-[0.65rem] truncate ${isSelected ? 'text-[var(--bg-surface)]/80' : 'text-[var(--text-muted)]'}`}>
                            {p.role} • {p.firm}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--bg-surface)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await logout();
                      window.location.href = '/login';
                    }}
                    className="w-full px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left flex items-center gap-1.5 font-semibold rounded-md transition text-xs cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-7.5 h-7.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-main)] rounded-md flex items-center justify-center cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation HUD: Swipeable on both Mobile & Desktop */}
      <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 flex items-center gap-0.5 sm:gap-1 overflow-x-auto h-8 border-t border-[var(--border)] no-scrollbar">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`px-2 py-0.5 text-[0.6875rem] font-sans font-medium flex items-center gap-1 rounded transition whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] font-semibold border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]/50'
              }`}
            >
              <span className={isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border)] p-2.5 space-y-2 font-sans animate-in slide-in-from-top-1 duration-150">
          {/* Quick Action Grid for Mobile */}
          {visibleHeaderActions.length > 0 && (
            <div>
              <div className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 px-0.5">
                Quick Actions (Create)
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {visibleHeaderActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      action.onClick();
                    }}
                    className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-md flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95"
                  >
                    {action.icon}
                    <span className="text-[0.65rem] font-semibold text-[var(--text-main)] truncate max-w-full">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Modules List */}
          <div className="pt-1.5 border-t border-[var(--border)] space-y-0.5">
            <div className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 px-0.5">
              Modules Navigation
            </div>
            <div className="grid grid-cols-2 gap-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-1.5 text-[0.6875rem] font-medium flex items-center gap-1.5 rounded-md transition ${
                      isActive
                        ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold'
                        : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] border border-transparent'
                    }`}
                  >
                    <span className={isActive ? 'text-[var(--bg-surface)]' : 'text-[var(--text-muted)]'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Configuration Fullscreen Drawer */}
      <CompanyConfigDrawer />
    </header>
  );
};

