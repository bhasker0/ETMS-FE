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
  ArrowLeft,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset, verifyAndResetPassword } = useAuth();
  const { t } = useI18n();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Step 1: Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      toast.error(t.auth_digitsHint ? `${t.auth_mobileLabel} (10 digits)` : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(mobile);
      if (res.success) {
        toast.success(res.message);
        setStep(2);
        startResendCountdown();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('Failed to send OTP: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startResendCountdown = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter a valid OTP code');
      return;
    }
    toast.success('OTP verified successfully!');
    setStep(3);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t.fp_passMinLength || 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyAndResetPassword(mobile, otp, newPassword);
      if (res.success) {
        toast.success(res.message);
        setStep(4);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('Password reset failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[var(--bg-canvas)]">
      {/* Middle/Left Branding Section (60-65% width) */}
      <div className="lg:w-3/5 relative bg-gradient-to-br from-[#0e1726] via-[#19263e] to-[#336699] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Ambient Glow */}
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
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs text-[#cee3f8] font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.fp_backToSignIn || 'Back to Sign In'}</span>
            </Link>
          </div>
        </div>

        {/* Hero Branding Content */}
        <div className="relative z-10 my-10 lg:my-0 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cee3f8]/20 border border-[#cee3f8]/40 text-[#eff7ff] rounded-full text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-[#9494ff]" />
              <span>{t.fp_heroTag || 'Secure Password Reset System'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {t.fp_heroTitle || 'Instant Account Recovery for Factory Owners & Staff'}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {t.fp_heroDesc || 'Reset your password securely via SMS OTP verification. Your factory shift logs, SAC 9988 invoices, and Karigar wage records remain 100% safe and encrypted.'}
            </p>
          </div>

          {/* Workflow Guidance Pills */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div
              className={`p-3.5 rounded-2xl border transition ${
                step === 1
                  ? 'bg-[#336699] border-[#9494ff] text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-[#cee3f8] mb-1">{t.fp_step01Badge || 'Step 01'}</div>
              <div className="text-xs font-bold">{t.fp_step1 || '1. Enter Mobile'}</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition ${
                step === 2
                  ? 'bg-[#336699] border-[#9494ff] text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-[#cee3f8] mb-1">{t.fp_step02Badge || 'Step 02'}</div>
              <div className="text-xs font-bold">{t.fp_step2 || '2. Verify OTP'}</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition ${
                step >= 3
                  ? 'bg-[#336699] border-[#9494ff] text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-[#cee3f8] mb-1">{t.fp_step03Badge || 'Step 03'}</div>
              <div className="text-xs font-bold">{t.fp_step3 || '3. New Password'}</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#cee3f8]/90 font-mono">
          <span>{t.fp_protection || 'Surat Textile Hub Protection'}</span>
          <span>{t.fp_helpdesk || 'Helpdesk: +91 98250 12345'}</span>
        </div>
      </div>

      {/* Right Section: Forgot Password Form Card (35-40% width) */}
      <div className="lg:w-2/5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center bg-[var(--bg-canvas)]">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href="/login"
                className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover,#9494ff)] flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.fp_backToSignIn || 'Sign In Screen'}</span>
              </Link>
              <span className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] text-[var(--primary)] border border-[var(--border)] rounded-full text-2xs font-bold font-mono">
                {step === 1 ? (t.fp_step01Badge || 'Step 01') : step === 2 ? (t.fp_step02Badge || 'Step 02') : (t.fp_step03Badge || 'Step 03')}
              </span>
            </div>

            {/* STEP 1: Enter Mobile Number */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {t.fp_title || 'Forgot Password?'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.fp_step1Desc || 'Enter your registered 10-digit mobile number to receive a verification OTP code.'}
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)]">
                      {t.auth_mobileLabel || 'Registered Mobile'}
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

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[var(--primary)] hover:bg-[#9494ff] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{submitting ? (t.fp_sendingOtp || 'Sending OTP...') : (t.fp_sendOtpBtn || 'Send OTP')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {t.fp_step2Title || 'Enter Verification OTP'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.fp_step2Desc || 'Enter the 6-digit OTP sent to'} <span className="font-mono font-bold text-[var(--text-main)]">+91 {mobile}</span>.
                  </p>
                  <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl text-2xs text-[var(--text-main)] font-semibold flex items-center justify-between">
                    <span>{t.fp_demoOtpNotice || 'Demo Verification Code:'}</span>
                    <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-[var(--border)] shadow-2xs">123456</span>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)]">
                      {t.fp_otpLabel || '6-Digit OTP Code'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-center text-lg tracking-widest font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-[var(--text-muted)]">
                    <span>{t.fp_noCode || "Didn't receive code?"}</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-[var(--primary)]">{resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={startResendCountdown}
                        className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{t.fp_resendBtn || 'Resend OTP'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[var(--primary)] hover:bg-[#9494ff] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{t.fp_verifyBtn || 'Verify & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {t.fp_step3Title || 'Set New Password'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.fp_step3Desc || 'Create a new strong password for your account.'}
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)]">{t.fp_newPassLabel || 'New Password'}</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-main)]">{t.fp_confirmPassLabel || 'Confirm Password'}</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl space-y-1 text-2xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{t.fp_passReqs || 'Password Requirements'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className={`w-3 h-3 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{t.fp_passMinLength || 'At least 6 characters long'}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[var(--primary)] hover:bg-[#9494ff] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{submitting ? (t.fp_updating || 'Updating...') : (t.fp_resetBtn || 'Reset Password')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: Success Screen */}
            {step === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {t.fp_successTitle || 'Password Reset Successful!'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.fp_successDesc || 'Your account password has been updated. You can now sign in with your new credentials.'}
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3.5 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{t.fp_proceedToSignIn || 'Proceed to Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
