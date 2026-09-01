'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import {
  Layers,
  ArrowRight,
  UserCheck,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Wrench,
  FileText,
  Wallet,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const [mobile, setMobile] = useState('9825012345');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const testPersonas = [
    {
      role: t.auth_roleOwner || 'Company Owner',
      name: 'Bhavesh Patel',
      firm: 'Radhe Krishna Embroidery',
      mobile: '9825012345',
      badge: 'Full Admin',
    },
    {
      role: t.auth_roleSupervisor || 'Supervisor',
      name: 'Sanjay Mehta',
      firm: 'Radhe Krishna Embroidery',
      mobile: '9825099001',
      badge: 'Shift & Challan',
    },
    {
      role: t.auth_roleMunim || 'Munim / CA',
      name: 'Kantibhai Accountant',
      firm: 'Multi-Firm Client Access',
      mobile: '9825099999',
      badge: 'Tally & GSTR-1',
    },
    {
      role: t.auth_roleOwner2 || 'Tenant Owner',
      name: 'Ghanshyam Shah',
      firm: 'Shree Ram Textiles',
      mobile: '9825054321',
      badge: 'Tenant Isolation',
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(mobile, password);
      toast.success(t.appName ? `${t.appName} - Sign in successful` : 'Login successful! Welcome to ETMS Surat');
      router.push('/');
    } catch (err: any) {
      toast.error('Login failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (pMobile: string) => {
    setMobile(pMobile);
    setPassword('Password@123');
    setSubmitting(true);
    try {
      await login(pMobile, 'Password@123');
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (err: any) {
      toast.error('Login failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--bg-canvas)]">
      {/* Middle/Left Section: Branding Information & Company Showcase (60-65% width) */}
      <div className="lg:w-3/5 relative bg-gradient-to-br from-[#0e1726] via-[#19263e] to-[#336699] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Subtle Background Glow Accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#9494ff]/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#cee3f8]/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Top Header Logo & Pre-Auth Language Switcher */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#336699] border border-[#cee3f8]/40 text-white flex items-center justify-center font-bold shadow-lg shadow-[#336699]/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight flex items-center gap-2">
                {t.brandTitle || 'ETMS Surat'}
                <span className="px-2 py-0.5 bg-[#9494ff]/30 border border-[#9494ff]/50 text-[#cee3f8] text-2xs font-mono font-semibold rounded-md">
                  {t.sac9988Tag || 'SAC 9988'}
                </span>
              </div>
              <p className="text-2xs text-[#cee3f8]/90 font-medium">
                {t.auth_subTitleTag || 'Surat Embroidery SaaS Micro-ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-0.5">
              <LanguageSwitcher />
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-[#cee3f8] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#9494ff]" />
              <span>{t.auth_versionTag || 'v2.5 Production Ready'}</span>
            </div>
          </div>
        </div>

        {/* Hero Branding Content */}
        <div className="relative z-10 my-10 lg:my-0 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cee3f8]/20 border border-[#cee3f8]/40 text-[#eff7ff] rounded-full text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#9494ff]" />
              <span>{t.auth_heroTag || 'Built Specially for Surat Textile & Embroidery Hub'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {t.auth_heroTitle || 'Complete Factory Telemetry & Job-Work Accounting'}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {t.auth_heroDesc || 'Empower your embroidery unit with real-time shift production tracking, SAC 9988 tax invoicing, Karigar advance salary management, and 1-click Munim Tally integration.'}
            </p>
          </div>

          {/* Core Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 hover:bg-white/15 transition">
              <div className="w-8 h-8 rounded-lg bg-[#cee3f8]/20 text-[#cee3f8] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">{t.auth_feat1Title || 'Machine Shift Output'}</h2>
              <p className="text-xs text-slate-300">
                {t.auth_feat1Desc || 'Track Head count, RPM speed, shift meters & total stitches live on floor.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 hover:bg-white/15 transition">
              <div className="w-8 h-8 rounded-lg bg-[#cee3f8]/20 text-[#cee3f8] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">{t.auth_feat2Title || 'SAC 9988 GST Invoicing'}</h2>
              <p className="text-xs text-slate-300">
                {t.auth_feat2Desc || 'Generate compliant job-work invoices with automatic CGST/SGST taxes.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 hover:bg-white/15 transition">
              <div className="w-8 h-8 rounded-lg bg-[#cee3f8]/20 text-[#cee3f8] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">{t.auth_feat3Title || 'Karigar Uchapat & Hisab'}</h2>
              <p className="text-xs text-slate-300">
                {t.auth_feat3Desc || 'Record wage advances, piece-rate payouts, and end-of-month wage balance.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5 hover:bg-white/15 transition">
              <div className="w-8 h-8 rounded-lg bg-[#cee3f8]/20 text-[#cee3f8] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">{t.auth_feat4Title || 'Munim & Tally Integration'}</h2>
              <p className="text-xs text-slate-300">
                {t.auth_feat4Desc || 'Direct export to Tally Prime XML & GSTR-1 JSON for seamless CA filing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Statistics & Trust Badges */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-base font-extrabold text-white">500+ Units</div>
              <div className="text-2xs text-[#cee3f8]">{t.auth_statUnits || 'Surat Factories'}</div>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <div className="text-base font-extrabold text-white">12,000+</div>
              <div className="text-2xs text-[#cee3f8]">{t.auth_statHeads || 'Heads Monitored'}</div>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <div className="text-base font-extrabold text-white">99.9%</div>
              <div className="text-2xs text-[#cee3f8]">{t.auth_statUptime || 'System Uptime'}</div>
            </div>
          </div>

          <div className="text-2xs text-[#cee3f8]/90 font-mono">
            {t.auth_footerBadge || 'Encrypted & Multitenant • GST SAC 9988'}
          </div>
        </div>
      </div>

      {/* Right Section: Login Card & Persona Switcher (35-40% width) */}
      <div className="lg:w-2/5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center bg-[var(--bg-canvas)]">
        <div className="w-full max-w-md space-y-6">
          {/* Main Login Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                  {t.auth_signInTitle || 'Account Sign In'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                {t.auth_welcomeBack || 'Welcome Back'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t.auth_loginSubtitle || 'Enter your registered mobile number and password to access your unit dashboard.'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Mobile Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)] flex items-center justify-between">
                  <span>{t.auth_mobileLabel || 'Registered Mobile'}</span>
                  <span className="text-2xs text-[var(--text-muted)]">{t.auth_digitsHint || '10 Digits'}</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[var(--text-muted)] text-xs font-semibold pr-2 border-r border-[var(--border)]">
                    <Phone className="w-4 h-4 text-[var(--primary)]" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9825012345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-20 pr-3 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">
                  {t.auth_passwordLabel || 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
                  />
                  <span>{t.auth_rememberMe || 'Remember Me'}</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="font-bold text-[var(--primary)] hover:text-[var(--primary-hover,#9494ff)] hover:underline transition"
                >
                  {t.auth_forgotPassword || 'Forgot Password?'}
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[var(--primary)] hover:bg-[#9494ff] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{submitting ? (t.auth_authenticating || 'Authenticating...') : (t.auth_signInBtn || 'Sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)] border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-1.5 text-[var(--primary)]">
                <UserCheck className="w-4 h-4" />
                <span>{t.auth_demoAccounts || '1-Click Demo Accounts'}</span>
              </div>
              <span className="text-2xs text-[var(--text-muted)] font-mono">{t.auth_instantLogin || 'Instant Login'}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {testPersonas.map((p) => (
                <button
                  key={p.mobile}
                  onClick={() => handleQuickLogin(p.mobile)}
                  className="w-full p-2.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-main)] group-hover:text-[var(--primary)] transition">
                        {p.name}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[var(--bg-surface-elevated)] text-[var(--primary)] rounded text-[10px] font-bold font-mono border border-[var(--border)]">
                        {p.badge}
                      </span>
                    </div>
                    <div className="text-2xs text-[var(--text-muted)]">
                      {p.role} • <span className="font-mono text-[var(--primary)]">{p.mobile}</span>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 bg-[var(--primary)]/10 group-hover:bg-[var(--primary)] text-[var(--primary)] group-hover:text-white rounded-lg text-2xs font-bold transition flex items-center gap-1 shrink-0">
                    <span>{t.auth_selectBtn || 'Select'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
