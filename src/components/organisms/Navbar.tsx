'use client';

import React, { useState } from 'react';
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
  Wallet,
  Calculator,
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
  Plus,
  Settings,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/lib/config-context';
import { CompanyConfigDrawer } from './CompanyConfigDrawer';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';
import { HighContrastToggle } from '../molecules/HighContrastToggle';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeCompany, allAvailableCompanies, switchCompany, logout, login } = useAuth();
  const { t } = useI18n();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openConfigDrawer } = useConfig();

  // Quick test personas
  const personas = [
    { name: 'Bhavesh Patel (Owner)', mobile: '9825012345', role: 'COMPANY_ADMIN', firm: 'Radhe Krishna Emb.' },
    { name: 'Sanjay Mehta (Supervisor)', mobile: '9825099001', role: 'SUPERVISOR', firm: 'Radhe Krishna Emb.' },
    { name: 'Kantibhai (Munim/CA)', mobile: '9825099999', role: 'MUNIM', firm: 'Kantibhai & Co.' },
    { name: 'Ghanshyam Shah (Owner 2)', mobile: '9825054321', role: 'COMPANY_ADMIN', firm: 'Shree Ram Textiles' },
  ];

  const navItems = [
    { href: '/', label: 'DASHBOARD', icon: <Layers className="w-3.5 h-3.5" /> },
    { href: '/shift', label: 'SHIFTS', icon: <Clock className="w-3.5 h-3.5" /> },
    { href: '/machines', label: 'MACHINES', icon: <Wrench className="w-3.5 h-3.5" /> },
    { href: '/karigars', label: 'KARIGARS', icon: <Users className="w-3.5 h-3.5" /> },
    { href: '/challans', label: 'INWARD LOTS', icon: <Truck className="w-3.5 h-3.5" /> },
    { href: '/parties', label: 'PARTIES', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { href: '/karigar/uchapat', label: 'UCHAPAT', icon: <Wallet className="w-3.5 h-3.5" /> },
    { href: '/invoices', label: 'INVOICES', icon: <FileText className="w-3.5 h-3.5" /> },
    { href: '/karigar/hisab', label: 'WAGE HISAB', icon: <Calculator className="w-3.5 h-3.5" /> },
    { href: '/munim/dashboard', label: 'MUNIM PORTAL', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-accent" /> },
  ];

  const handlePersonaSwitch = async (persona: typeof personas[0]) => {
    try {
      await login(persona.mobile, 'Password@123');
      toast.success(`Switched persona to ${persona.name}`);
      setProfileDropdownOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error('Login failed: ' + e.message);
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    try {
      await switchCompany(companyId);
      toast.success('Company context switched');
      setCompanyDropdownOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error('Failed to switch company: ' + e.message);
    }
  };

  if (pathname === '/login' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border)] select-none">
      {/* Top Telemetry Header */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand & Company Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--text-main)] flex items-center justify-center text-[var(--bg-surface)] font-bold text-xs shadow-sm">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm tracking-tight text-[var(--text-main)] font-sans">
                  ETMS Surat
                </span>
                <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                  SAC 9988
                </span>
              </div>
              <span className="text-[0.65rem] text-[var(--text-muted)] font-mono tracking-wider uppercase mt-0.5">
                Embroidery Factory ERP
              </span>
            </div>
          </Link>

          {/* Company Context Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs transition text-left rounded-md"
            >
              <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <div className="flex flex-col truncate max-w-[120px] sm:max-w-[170px]">
                <span className="font-semibold text-[var(--text-main)] truncate text-[0.75rem]">
                  {activeCompany?.name || t.selectCompany || 'Select Company'}
                </span>
                {activeCompany?.role && (
                  <span className="text-[0.65rem] text-[var(--text-muted)] font-mono">
                    {activeCompany.role}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
            </button>

            {companyDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-72 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg rounded-lg z-50 p-1.5 space-y-1 text-xs"
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

        {/* Right Utility: Status, Toggles, Actions, User Menu */}
        <div className="flex items-center gap-2">
          {/* Backend Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-[0.6875rem] font-mono rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online (SAC 9988)</span>
          </div>

          {/* New Shift Action */}
          <Link
            href="/shift/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded-md shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Shift</span>
          </Link>

          {/* High Contrast / Theme Toggle */}
          <HighContrastToggle />

          {/* Language Switcher Dropdown */}
          <LanguageSwitcher />

          {/* Configuration Gear Icon Button */}
          <button
            onClick={openConfigDrawer}
            className="p-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] transition text-xs flex items-center justify-center rounded-md group"
            title={t.configDrawerTooltip || t.settingsTitle || 'Company Configuration & Settings'}
          >
            <Settings className="w-4 h-4 transition-transform group-hover:rotate-90 text-[var(--text-muted)]" />
          </button>

          {/* User Profile & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--text-main)] font-semibold rounded-md transition"
            >
              <div className="w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--text-main)]">
                <User className="w-3 h-3" />
              </div>
              <span className="hidden md:inline truncate max-w-[110px]">
                {user?.fullName?.split(' ')[0] || 'Operator'}
              </span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-1 w-64 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg rounded-lg z-50 p-1.5 space-y-1 text-xs"
              >
                <div className="p-2.5 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] rounded-md">
                  <div className="font-bold text-[var(--text-main)]">{user?.fullName}</div>
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
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between text-xs rounded-md transition ${
                          isSelected
                            ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold'
                            : 'hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className={`text-[0.6875rem] ${isSelected ? 'text-[var(--bg-surface)]/80' : 'text-[var(--text-muted)]'}`}>
                            {p.role} • {p.firm}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--bg-surface)]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 border-t border-[var(--border)]">
                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      router.push('/login');
                    }}
                    className="w-full px-2.5 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left flex items-center gap-1.5 font-semibold rounded-md transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-main)] rounded-md"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation HUD */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 hidden md:flex items-center gap-1 overflow-x-auto h-10 border-t border-[var(--border)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 text-xs font-sans font-medium flex items-center gap-1.5 rounded-md transition whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-main)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]/50'
              }`}
            >
              <span className={isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border)] p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 text-xs font-medium flex items-center justify-between rounded-md ${
                  isActive ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-semibold' : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {/* Configuration Fullscreen Drawer */}
      <CompanyConfigDrawer />
    </header>
  );
};

