import React, { useState, useEffect } from 'react';
import { 
  Mail, Key, ArrowLeft, ArrowRight, CheckCircle2, 
  AlertCircle, Loader2, ShieldCheck, Inbox, Lock, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail } from '../../utils/validation';

export default function ForgotPasswordView({ initialEmail = '', onBackToLogin, onEmailSent }) {
  const { requestTemporaryPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const domainError = validateCompanyEmail(cleanEmail);
    if (domainError) {
      setErrorMessage(domainError);
      return;
    }

    setIsLoading(true);
    try {
      await requestTemporaryPassword(cleanEmail);
      setIsSent(true);
      if (onEmailSent) {
        onEmailSent(cleanEmail);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to request temporary password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
          <Key className="w-6 h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Self-Service Password Recovery
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Enter your official <strong>@techygeekhub.com</strong> corporate email. We will generate and email a one-time temporary password to your inbox.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {!isSent ? (
        /* Form View */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                Authorized Personnel Only
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Temporary passwords can only be dispatched to active accounts registered under the <strong>techygeekhub.com</strong> domain.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Corporate Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoFocus
                placeholder="e.g. cbala@techygeekhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <span>Send Temporary Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Sent Confirmation View (Edge-to-edge within full-screen right column) */
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Temporary Password Dispatched!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A single-use temporary password was emailed to:
              </p>
              <div className="inline-block mt-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {email}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
              <Inbox className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>1. Check Inbox:</strong> Look for an email from <strong>TGH IT Security</strong> (check your spam or junk folder if needed).
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
              <Key className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>2. Enter Password:</strong> Copy the code (e.g. <span className="font-mono font-bold text-blue-600 dark:text-blue-400">TGH-XXXXXX</span>) and paste it into the sign-in password box.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>3. Set Permanent Password:</strong> Upon signing in, you will be prompted to create your new permanent password.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
