'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
      toast.error('Please enter a valid 10-digit mobile number');
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
      toast.error('Password must be at least 6 characters');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Middle/Left Branding Section (60-65% width) */}
      <div className="lg:w-3/5 relative bg-gradient-to-br from-[#021824] via-[#003848] to-[#007088] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#0099B8]/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0E7090]/30 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0099B8] text-white flex items-center justify-center font-bold shadow-lg shadow-[#0099B8]/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight flex items-center gap-2">
                ETMS Surat
                <span className="px-2 py-0.5 bg-[#0099B8]/30 border border-[#0099B8]/50 text-cyan-200 text-2xs font-mono font-semibold rounded-md">
                  SAC 9988
                </span>
              </div>
              <p className="text-2xs text-cyan-200/80 font-medium">
                Surat Embroidery SaaS Micro-ERP • સુરત એમ્બ્રોઇડરી યુનિટ સોફ્ટવેર
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs text-cyan-100 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Hero Branding Content */}
        <div className="relative z-10 my-10 lg:my-0 max-w-2xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 rounded-full text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Secure Password Reset System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Instant Account Recovery for Factory Owners & Staff
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              Reset your password securely via SMS OTP verification. Your factory shift logs, SAC 9988 invoices, and Karigar wage records remain 100% safe and encrypted.
            </p>
          </div>

          {/* Workflow Guidance Pills */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div
              className={`p-3.5 rounded-2xl border transition ${
                step === 1
                  ? 'bg-[#0099B8]/30 border-cyan-300 text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-cyan-200 mb-1">Step 01</div>
              <div className="text-xs font-bold">1. Enter Mobile</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition ${
                step === 2
                  ? 'bg-[#0099B8]/30 border-cyan-300 text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-cyan-200 mb-1">Step 02</div>
              <div className="text-xs font-bold">2. Verify OTP</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border transition ${
                step >= 3
                  ? 'bg-[#0099B8]/30 border-cyan-300 text-white font-bold'
                  : 'bg-white/10 border-white/15 text-slate-300'
              }`}
            >
              <div className="text-2xs uppercase tracking-wider text-cyan-200 mb-1">Step 03</div>
              <div className="text-xs font-bold">3. New Password</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-cyan-200/80 font-mono">
          <span>Surat Textile Hub Protection</span>
          <span>Helpdesk: +91 98250 12345</span>
        </div>
      </div>

      {/* Right Section: Forgot Password Form Card (35-40% width) */}
      <div className="lg:w-2/5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href="/login"
                className="text-xs font-bold text-[#0099B8] hover:text-[#0E7090] flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sign In Screen</span>
              </Link>
              <span className="px-2.5 py-1 bg-[#E0F2FE] text-[#0284C7] rounded-full text-2xs font-bold font-mono">
                Step {step} of 3
              </span>
            </div>

            {/* STEP 1: Enter Mobile Number */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">
                    Forgot Password?
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Enter your registered 10-digit mobile number to receive a verification OTP code.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B]">
                      Registered Mobile (મોબાઈલ નંબર)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#64748B] text-xs font-semibold pr-2 border-r border-[#E2E8F0]">
                        <Phone className="w-4 h-4 text-[#0099B8]" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9825012345"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full pl-20 pr-3 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] font-mono focus:outline-none focus:border-[#0099B8] focus:ring-2 focus:ring-[#0099B8]/20 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#0099B8] hover:bg-[#0E7090] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{submitting ? 'Sending OTP...' : 'Send OTP (ઓટીપી મોકલો)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">
                    Enter Verification OTP
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Enter the 6-digit OTP sent to <span className="font-mono font-bold text-[#1E293B]">+91 {mobile}</span>.
                  </p>
                  <div className="p-3 bg-[#E0F2FE] border border-[#0284C7]/20 rounded-xl text-2xs text-[#0284C7] font-semibold flex items-center justify-between">
                    <span>Demo Verification Code:</span>
                    <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded shadow-xs">123456</span>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B]">
                      6-Digit OTP Code (ઓટીપી)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-lg tracking-widest font-mono text-[#1E293B] focus:outline-none focus:border-[#0099B8] focus:ring-2 focus:ring-[#0099B8]/20 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-[#64748B]">
                    <span>Didn&apos;t receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-[#0099B8]">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={startResendCountdown}
                        className="font-bold text-[#0099B8] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0099B8] hover:bg-[#0E7090] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Verify & Continue (ચકાસણી કરો)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Enter New Password */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">
                    Set New Password
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Create a new strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B]">New Password (નવો પાસવર્ડ)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] font-mono focus:outline-none focus:border-[#0099B8] focus:ring-2 focus:ring-[#0099B8]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1E293B]">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1E293B] font-mono focus:outline-none focus:border-[#0099B8] focus:ring-2 focus:ring-[#0099B8]/20 transition"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1 text-2xs text-[#64748B]">
                    <div className="flex items-center gap-1.5 text-[#1E293B] font-bold mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0099B8]" />
                      <span>Password Requirements</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className={`w-3 h-3 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>At least 6 characters long</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#0099B8] hover:bg-[#0E7090] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{submitting ? 'Updating...' : 'Reset Password (પાસવર્ડ બદલો)'}</span>
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
                  <h2 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">
                    Password Reset Successful!
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Your account password has been updated. You can now sign in with your new credentials.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3.5 bg-[#0099B8] hover:bg-[#0E7090] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In (પ્રવેશ કરો)</span>
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
