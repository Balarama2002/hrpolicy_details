import React from 'react';
import { 
  Bot, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Users, 
  Crown, 
  Code2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserQuotaIndicator from './UserQuotaIndicator';

export default function Navbar({ 
  onRefresh, 
  isRefreshing, 
  onOpenAdminPortal,
  theme, 
  onToggleTheme,
  logs = [] 
}) {
  const isDark = theme === 'dark';
  const { user, signOut, isAdmin } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200 shadow-xs dark:shadow-none">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-13">
          
          {/* Left: Branding & Role Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/10 shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  TGH HR Agent Analytics
                </h1>
                {isAdmin ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    <Code2 className="w-3 h-3" />
                    Technical
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions, Theme Toggle, Admin Portal, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Admin Portal Button (Strictly Visible to Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdminPortal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                title="Manage users, access permissions, and assign roles"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95 flex items-center justify-center group cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
              )}
            </button>

            {/* User Daily Quota Indicator (Visible to Employees & Technical Staff) */}
            {!isAdmin && user && (
              <UserQuotaIndicator 
                user={user} 
                logs={logs} 
                variant="compact" 
              />
            )}

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                  title={`Logged in as ${user.email} (${user.role || 'technical'})`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    isAdmin 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                      : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                  }`}>
                    {initial}
                  </div>
                  <span className="hidden md:inline font-medium text-slate-700 dark:text-slate-200 max-w-[130px] truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-500/10 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Sign Out"
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
