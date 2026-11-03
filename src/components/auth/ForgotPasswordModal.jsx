import React, { useState, useEffect } from 'react';
import { 
  Mail, Key, X, CheckCircle2, AlertCircle, Loader2, 
  ArrowRight, ShieldAlert, Check, ShieldCheck, Inbox, Lock, Terminal 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail } from '../../utils/validation';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onEmailSent }) {
  const { requestTemporaryPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (isOpen) {
      setIsSent(false);
      setErrorMessage('');
    }
  }, [initialEmail, isOpen]);

  if (!isOpen) return null;

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

  const handleDone = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Spacious Desktop Enterprise Modal Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transition-all duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Self-Service Password Recovery
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Secure Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Issue a one-time temporary password directly to your verified corporate email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {!isSent ? (
            /* Input Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-blue-600 dark:text-blue-400 text-xs">
                    Corporate Email Verification Required
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    Enter your official <strong>@techygeekhub.com</strong> email. Our identity service will generate a secure, single-use temporary password and email it directly to you.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Corporate Work Email
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Must end with @techygeekhub.com
                  </span>
                </div>
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

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            /* Spacious Enterprise Success Confirmation State (NO Phone Format) */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Temporary Password Dispatched!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    A secure one-time temporary password has been generated and sent to:
                  </p>
                  <div className="inline-block mt-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {email}
                  </div>
                </div>
              </div>

              {/* 3-Step Clear Action Grid (Desktop Multi-Column) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <Inbox className="w-4 h-4" />
                    <span>1. Check Inbox</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Look for an email from <strong>TGH IT Security</strong> (also check your spam/junk folder).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>2. Enter Password</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Copy the 6-digit code (e.g. <code className="font-mono text-slate-700 dark:text-slate-300">TGH-XXXXXX</code>) into the sign-in screen.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>3. Reset Required</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upon signing in, you will be prompted immediately to set your new permanent password.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
