import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Sun, Moon, Shield, Server, Activity, Users, 
  Sparkles, CheckCircle2, Lock, ArrowRight, ArrowLeft, Loader2, 
  KeyRound, Mail, AlertCircle, RefreshCw, Zap, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail } from '../../utils/validation';

export default function AuthPage({ theme = 'dark', onToggleTheme }) {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputRefs = useRef([]);
  const isDark = theme === 'dark';

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    let clean = identifier.trim().toLowerCase();
    if (!clean) {
      setErrorMessage('Please enter your corporate username or email.');
      return;
    }

    if (!clean.includes('@')) {
      clean = `${clean}@techygeekhub.com`;
    }

    const domainErr = validateCompanyEmail(clean);
    if (domainErr) {
      setErrorMessage(domainErr);
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(clean);
      setSentEmail(res.email || clean);
      if (res.dev_otp) {
        setDevOtpCode(res.dev_otp);
      } else {
        setDevOtpCode('');
      }
      setStep('otp');
      setResendCountdown(60);
      setSuccessNotice(`✓ Verification code dispatched to ${res.email || clean}`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle 6-Digit OTP inputs
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasted multi-digit string
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(sentEmail, fullOtp);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 digits are typed
  useEffect(() => {
    if (otpDigits.every(d => d !== '') && step === 'otp') {
      handleVerifyOtp();
    }
  }, [otpDigits, step]);

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendOtp(sentEmail);
      if (res.dev_otp) {
        setDevOtpCode(res.dev_otp);
      }
      setSuccessNotice(`✓ New 6-digit code dispatched to ${sentEmail}`);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden font-sans">
      
      {/* =========================================================================
          LEFT SIDE: FULL-SCREEN ENTERPRISE HERO & TELEMETRY (Edge-to-Edge)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-7/12 min-h-screen flex-col justify-between p-12 xl:p-20 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60 border-r border-slate-800/80 relative overflow-hidden select-none">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-[42rem] h-[42rem] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[38rem] h-[38rem] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold tracking-widest uppercase text-blue-400 font-mono">
                  TechyGeekHub
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Zero Trust • OTP Auth
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                HR Agent Analytics
              </h1>
            </div>
          </div>

          {/* Main Headline */}
          <div className="max-w-2xl">
            <h2 className="text-3xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] mb-6">
              AI Query Intelligence & <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Role-Based Employee Telemetry
              </span>
            </h2>

            <p className="text-sm xl:text-base text-slate-300 leading-relaxed mb-10 max-w-xl">
              Passwordless corporate single sign-on with role-based access. Administrators monitor organization-wide token economics while technical staff track personal queries.
            </p>
          </div>

          {/* Real-time Telemetry Showcase Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Resolution Accuracy</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">99.4%</div>
              <p className="text-[10px] text-emerald-400 font-medium">+1.8% vs last week</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Avg Agent Latency</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">380ms</div>
              <p className="text-[10px] text-slate-400 font-medium">Real-time inference</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Access Control</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white tracking-tight">Admin & Technical</div>
              <p className="text-[10px] text-slate-400 font-medium">RBAC data scoping</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Authentication</span>
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-lg font-bold text-white tracking-tight">6-Digit Email OTP</div>
              <p className="text-[10px] text-emerald-400 font-medium">Passwordless security</p>
            </div>
          </div>
        </div>

        {/* Bottom System Status Bar */}
        <div className="relative z-10 pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">
              Hostinger MySQL & n8n Gateway: Fully Operational
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Encrypted Corporate SSO</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE: FULL-SCREEN OTP AUTHENTICATION PANEL (Edge-to-Edge)
          ========================================================================= */}
      <div className="w-full lg:w-5/12 xl:w-5/12 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white dark:bg-slate-900 transition-colors relative">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Corporate Single Sign-On
            </span>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Centered Form Area */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          
          {/* Mobile-Only Header Branding */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              TGH HR Agent Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your 6-digit corporate OTP
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successNotice}</div>
            </div>
          )}

          {step === 'email' ? (
            /* STEP 1: ENTER USERNAME / EMAIL (NO CREATE ACCOUNT) */
            <form onSubmit={handleRequestOtp} className="space-y-6 animate-fadeIn">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sign In to Analytics
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Enter your corporate username or work email. We will send a secure 6-digit one-time code to authenticate your session.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/50 border border-blue-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    Admin-Provisioned Accounts Only
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Public signups are disabled. Accounts must be provisioned by an Administrator in the Admin Portal.
                  </p>
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Username or Corporate Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. cbala@techygeekhub.com or cbala"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Authorized domain: <strong>@techygeekhub.com</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Account...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER 6-DIGIT OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setErrorMessage(''); setSuccessNotice(''); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer mb-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change Username</span>
                </button>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Enter 6-Digit Code
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  We sent a 6-digit verification code to:
                </p>
                <div className="inline-block mt-1 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {sentEmail}
                </div>

              </div>

              {/* 6 Digit Input Boxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 text-center">
                  Verification Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border-2 border-slate-200 dark:border-slate-800 text-center font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    />
                  ))}
                </div>

                {/* Local Dev OTP Notice if SMTP is not configured */}
                {devOtpCode && (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-amber-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Dev OTP Code (Local Testing):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpDigits(devOtpCode.split(''));
                        }}
                        className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-200/80 mt-1">
                      <span>Active Code: <strong className="font-mono text-sm tracking-widest text-amber-100 font-black">{devOtpCode}</strong></span>
                      <span className="text-[10px] text-amber-300/60">(Valid 10 mins)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otpDigits.some(d => d === '')}
                className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={resendCountdown > 0 || isLoading}
                  onClick={handleResend}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendCountdown > 0 
                    ? `Resend code in ${resendCountdown}s` 
                    : "Didn't receive the code? Resend OTP"}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Security Notice */}
        <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Authorized Corporate Personnel Only • TechyGeekHub</span>
          </p>
        </div>

      </div>

    </div>
  );
}
