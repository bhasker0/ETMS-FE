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
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/lib/config-context';
import { CompanyConfigDrawer } from './CompanyConfigDrawer';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';

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
    { href: '/', label: t.navDashboard || 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { href: '/shift', label: t.navShiftList || 'Shift Logs', icon: <Clock className="w-4 h-4" /> },
    { href: '/machines', label: t.activeMachines || 'Machines', icon: <Wrench className="w-4 h-4" /> },
    { href: '/karigars', label: t.navKarigars || 'Karigars', icon: <Users className="w-4 h-4" /> },
    { href: '/challans', label: t.navChallans || 'Inward Lots', icon: <Truck className="w-4 h-4" /> },
    { href: '/parties', label: t.navParties || 'Parties', icon: <Briefcase className="w-4 h-4" /> },
    { href: '/karigar/uchapat', label: t.navKarigarUchapat || 'Uchapat', icon: <Wallet className="w-4 h-4" /> },
    { href: '/invoices', label: t.navInvoices || 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { href: '/karigar/hisab', label: t.settleHisab || 'Wage Hisab', icon: <Calculator className="w-4 h-4" /> },
    { href: '/munim/dashboard', label: t.navMunimDashboard || 'Munim Portal', icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" /> },
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand & Company Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#0099B8] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                ETMS Surat
              </span>
              <span className="text-2xs font-semibold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                SAC 9988
              </span>
            </div>
          </Link>

          {/* Company Context Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs transition text-left"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0099B8] shrink-0" />
              <div className="flex flex-col truncate max-w-[130px] sm:max-w-[180px]">
                <span className="font-semibold text-slate-900 truncate">
                  {activeCompany?.name || 'Select Company'}
                </span>
                {activeCompany?.role && (
                  <span className="text-2xs text-slate-500 font-mono">
                    {activeCompany.role}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {companyDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 space-y-1">
                <div className="px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  {t.switchCompanyDropdownTitle || 'Switch Active Company'}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {allAvailableCompanies.map((c) => {
                    const isSelected = c.id === activeCompany?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCompanySelect(c.id)}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-[#0099B8]/10 text-[#0099B8] font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate font-medium text-slate-900">{c.name}</div>
                          <div className="text-2xs text-slate-400 font-mono">
                            {c.gstin} • {c.role}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0099B8] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Utility: Status, Action, User Menu */}
        <div className="flex items-center gap-2">
          {/* Backend Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-2xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>:4000 Connected</span>
          </div>

          {/* New Shift Action */}
          <Link
            href="/shift/new"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#0099B8] hover:bg-[#0E7090] text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Shift</span>
          </Link>

          {/* Language Switcher Dropdown */}
          <LanguageSwitcher />

          {/* Configuration Gear Icon Button */}
          <button
            onClick={openConfigDrawer}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#0099B8] rounded-lg transition text-xs flex items-center justify-center shadow-2xs group"
            title="Company Configuration & Settings"
          >
            <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
          </button>

          {/* User Profile & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 transition"
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                <User className="w-3 h-3" />
              </div>
              <span className="hidden md:inline font-medium text-slate-800 truncate max-w-[120px]">
                {user?.fullName?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 space-y-1 text-xs">
                <div className="p-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{user?.fullName}</div>
                  <div className="text-2xs text-slate-500 font-mono">{user?.mobile}</div>
                </div>

                <div className="px-2 py-1 text-2xs font-bold uppercase tracking-wider text-slate-400">
                  {t.fastPersonaSwitchTitle || 'Fast Persona Switch'}
                </div>

                <div className="space-y-0.5">
                  {personas.map((p) => {
                    const isSelected = user?.mobile === p.mobile;
                    return (
                      <button
                        key={p.mobile}
                        onClick={() => handlePersonaSwitch(p)}
                        className={`w-full px-2 py-1.5 rounded-lg text-left flex items-center justify-between text-2xs transition ${
                          isSelected
                            ? 'bg-[#0099B8]/10 text-[#0099B8] font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-slate-500 font-mono">{p.role}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0099B8]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      router.push('/login');
                    }}
                    className="w-full px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-left flex items-center gap-1.5 font-medium transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 border-t border-slate-100 hidden md:flex items-center gap-1 overflow-x-auto h-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#0099B8]/10 text-[#0099B8] font-bold'
                  : 'text-slate-600 hover:text-[#0099B8] hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                  isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
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
