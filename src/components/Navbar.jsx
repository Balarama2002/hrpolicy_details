import React from 'react';
import { 
  Bot, 
  Activity, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  onRefresh, 
  isRefreshing, 
  onOpenSettings, 
  config,
  isConnected,
  theme,
  onToggleTheme
}) {
  const isDark = theme === 'dark';
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                TGH HR Agent Analytics
              </h1>
            </div>
          </div>

          {/* Right: Actions, Theme Toggle, User Profile & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Connection Badge */}
            <div 
              onClick={onOpenSettings}
              className="cursor-pointer px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm"
              title="Connected to n8n Live Real-Time Feed"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Live Real-Time Feed (n8n)</span>
              <span className="sm:hidden">Live</span>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95 flex items-center justify-center group"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
              title="Configure n8n REST API"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                  title={`Logged in as ${user.email}`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {initial}
                  </div>
                  <span className="hidden md:inline font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-500/10 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
                  title="Sign Out of Dashboard"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
