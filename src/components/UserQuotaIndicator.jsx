import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  MessageSquare, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  ChevronDown, 
  HelpCircle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { getQuotaConfig, evaluateUserDailyQuota } from '../services/quotaService';

export default function UserQuotaIndicator({ 
  user, 
  logs = [], 
  variant = 'compact', // 'compact' (navbar) | 'banner' (in dashboard)
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const quotaConfig = getQuotaConfig();
  const quota = evaluateUserDailyQuota(user, logs, quotaConfig);

  const {
    todayQueries = 0,
    todayTokens = 0,
    queryLimit = quotaConfig.dailyMessageLimit || 5,
    tokenLimit = quotaConfig.dailyTokenLimit || 25000,
    queryPercentage = 0,
    tokenPercentage = 0,
    isExceeded = false,
    isNearLimit = false,
    wasResetToday = false,
  } = quota;

  const remainingQueries = Math.max(0, queryLimit - todayQueries);
  const remainingTokens = Math.max(0, tokenLimit - todayTokens);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Color theme determination
  const statusColor = isExceeded 
    ? 'rose' 
    : isNearLimit 
    ? 'amber' 
    : wasResetToday 
    ? 'cyan' 
    : 'emerald';

  const statusBg = isExceeded
    ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
    : isNearLimit
    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
    : wasResetToday
    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';

  const dotColor = isExceeded
    ? 'bg-rose-500'
    : isNearLimit
    ? 'bg-amber-500'
    : wasResetToday
    ? 'bg-cyan-500'
    : 'bg-emerald-500';

  // Format tokens into compact string (e.g. 5,679 -> 5.7k)
  const formatTokens = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString();
  };

  // 1. Compact Navbar Pill Variant
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer ${
            isExceeded
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-400 dark:border-rose-500/60 text-rose-700 dark:text-rose-300'
              : isNearLimit
              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-400 dark:border-amber-500/60 text-amber-700 dark:text-amber-300'
              : wasResetToday
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400 dark:border-cyan-500/60 text-cyan-700 dark:text-cyan-300'
              : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
          title="Click to view your daily question and token quota status"
        >
          {/* Status Dot */}
          <span className="relative flex h-2 w-2">
            {isExceeded && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
          </span>

          <span className="flex items-center gap-1 font-semibold">
            <Zap className={`w-3.5 h-3.5 ${
              isExceeded ? 'text-rose-500' : isNearLimit ? 'text-amber-500' : 'text-blue-500'
            }`} />
            <span className="hidden sm:inline">Usage:</span>
            <span className="font-mono">{todayQueries}/{queryLimit} Q</span>
            <span className="opacity-40">•</span>
            <span className="font-mono">{formatTokens(todayTokens)}/{formatTokens(tokenLimit)}</span>
          </span>

          {isExceeded ? (
            <span className="hidden md:inline px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-rose-500 text-white">
              Exceeded
            </span>
          ) : isNearLimit ? (
            <span className="hidden md:inline px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-500 text-white">
              85%+
            </span>
          ) : null}

          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Popover Card */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                  isExceeded ? 'bg-rose-500/20 text-rose-500' : 
                  isNearLimit ? 'bg-amber-500/20 text-amber-500' : 
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  {isExceeded ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Daily Usage Limits</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Personal allocations for today</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                {isExceeded ? 'Limit Exceeded' : isNearLimit ? 'Near Limit (85%+)' : wasResetToday ? 'Reset by Admin' : 'Healthy Quota'}
              </span>
            </div>

            {/* Meters */}
            <div className="py-3.5 space-y-3.5">
              {/* Daily Queries Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    Daily Questions
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {todayQueries} <span className="font-normal text-slate-400">/ {queryLimit}</span>
                    <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      ({queryPercentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded 
                        ? 'bg-rose-500' 
                        : queryPercentage >= 85 
                        ? 'bg-amber-500' 
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(queryPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-slate-400">
                  <span>{remainingQueries > 0 ? `${remainingQueries} remaining today` : 'No queries remaining'}</span>
                  <span>Limit: {queryLimit}/day</span>
                </div>
              </div>

              {/* Daily Gemini Tokens Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" />
                    Gemini AI Tokens
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {todayTokens.toLocaleString()} <span className="font-normal text-slate-400">/ {tokenLimit.toLocaleString()}</span>
                    <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      ({tokenPercentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      tokenPercentage >= 100 
                        ? 'bg-rose-500' 
                        : tokenPercentage >= 85 
                        ? 'bg-amber-500' 
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1 text-slate-400">
                  <span>{remainingTokens > 0 ? `${remainingTokens.toLocaleString()} tokens remaining` : 'No tokens remaining'}</span>
                  <span>Limit: {tokenLimit.toLocaleString()}/day</span>
                </div>
              </div>
            </div>

            {/* Note / Guidance Footer */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Resets daily at 12:00 AM IST</span>
              </div>
              {isExceeded && (
                <span className="text-rose-600 dark:text-rose-400 font-bold">Contact HR for limit bump</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Banner Meters Variant (Rendered in App.jsx User Banner)
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 w-full sm:w-auto ${className}`}>
      {/* Daily Queries Meter */}
      <div className="px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs min-w-[210px]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            Questions Today
          </span>
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
            {todayQueries} <span className="font-normal text-slate-400 text-[11px]">/ {queryLimit}</span>
          </span>
        </div>
        <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isExceeded 
                ? 'bg-rose-500 shadow-xs shadow-rose-500/50' 
                : queryPercentage >= 85 
                ? 'bg-amber-500 shadow-xs shadow-amber-500/50' 
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(queryPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          <span>{remainingQueries > 0 ? `${remainingQueries} queries left` : 'Limit reached'}</span>
          <span className="font-semibold">{queryPercentage}%</span>
        </div>
      </div>

      {/* Daily Gemini Tokens Meter */}
      <div className="px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs min-w-[210px]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            Gemini Tokens
          </span>
          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
            {formatTokens(todayTokens)} <span className="font-normal text-slate-400 text-[11px]">/ {formatTokens(tokenLimit)}</span>
          </span>
        </div>
        <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              tokenPercentage >= 100 
                ? 'bg-rose-500 shadow-xs shadow-rose-500/50' 
                : tokenPercentage >= 85 
                ? 'bg-amber-500 shadow-xs shadow-amber-500/50' 
                : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          <span>{remainingTokens > 0 ? `${formatTokens(remainingTokens)} left` : 'Limit reached'}</span>
          <span className="font-semibold">{tokenPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
