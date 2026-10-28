import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Building, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, Loader2, ShieldCheck, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail, COMPANY_DOMAIN } from '../../utils/validation';

const DEPARTMENTS = [
  'Human Resources (HR)',
  'Engineering & IT',
  'Operations & Admin',
  'Finance & Legal',
  'Executive Leadership',
  'Other',
];

export default function SignUpForm({ onSwitchToLogin, onOpenSupabaseConfig }) {
  const { signUp, isConfigured } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Human Resources (HR)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Good', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  }, [password]);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isConfigured) {
      onOpenSupabaseConfig();
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    const domainError = validateCompanyEmail(email);
    if (domainError) {
      setErrorMessage(domainError);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await signUp(email, password, {
        fullName,
        department,
      });

      // If Supabase has email confirmation enabled
      if (data.user && !data.session) {
        setSuccessMessage(
          'Registration successful! Supabase sent a verification email. Please check your inbox and click the confirmation link before signing in.'
        );
      } else {
        setSuccessMessage('Registration successful! Redirecting to analytics dashboard...');
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      let msg = err.message || 'Failed to create account.';
      if (msg.toLowerCase().includes('already registered')) {
        msg = 'An account with this email already exists. Please sign in instead.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
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

      {/* Full Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            autoComplete="name"
            placeholder="Cherukuri Bala Rama Krishna"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Work Email */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Work Email
          </label>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            @techygeekhub.com only
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="yourname@techygeekhub.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans"
          />
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Must be your official TechyGeekHub corporate email
        </p>
      </div>

      {/* Department / Role */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Department / Role
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Building className="w-4 h-4" />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-sans appearance-none"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="dark:bg-slate-900">
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Create Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
              <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
              <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
              <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {passwordStrength.label}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none transition-all font-sans ${
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

      {/* Security & Encryption Banner */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <LockKeyhole className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Passwords are cryptographically encrypted using industry-standard bcrypt hashing.</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !passwordsMatch}
        className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign In
        </button>
      </div>
    </form>
  );
}
