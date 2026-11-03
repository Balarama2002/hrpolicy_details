import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, AlertCircle, Loader2, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForceResetPasswordModal({ isOpen }) {
  const { user, changePassword, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  }, [newPassword]);

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(newPassword);
      setSuccessMessage('Password reset successfully! Redirecting to analytics dashboard...');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden transition-all duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Set Permanent Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mandatory account security step for first-time / temporary sign-in
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Temporary Password Expiring
            </div>
            <p className="text-[11px] leading-relaxed">
              You logged in with a one-time temporary password. For the security of <strong>{user?.email}</strong>, you must choose a permanent password to proceed.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Password strength:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none transition-all font-sans ${
                  !passwordsMatch 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30' 
                    : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
                }`}
              />
            </div>
            {!passwordsMatch && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={signOut}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || !newPassword}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <span>Save New Password & Continue</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
