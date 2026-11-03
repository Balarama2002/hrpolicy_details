import React, { useState } from 'react';
import { Bot, Sun, Moon, Database, Shield, Server } from 'lucide-react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import DatabaseConfigModal from './DatabaseConfigModal';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage({ theme = 'dark', onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { authProvider, dbStatus } = useAuth();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden font-sans">
      
      {/* Background decorative glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Theme Toggle & Hostinger DB Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
          title="Database Details & Setup"
        >
          <Server className="w-3.5 h-3.5 text-blue-500" />
          <span>{authProvider === 'hostinger' ? 'Hostinger MySQL' : 'Supabase Cloud'}</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm active:scale-95"
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

      {/* Main Glassmorphic Card */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-200 z-10">
        
        {/* Branding & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10 mb-3">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            TGH HR Agent Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Sign in to access real-time query executions, usefulness metrics, and token economics.
          </p>
        </div>

        {/* Tab Switcher: Login / Sign Up */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Render Selected Form */}
        {activeTab === 'login' ? (
          <LoginForm 
            onSwitchToSignUp={() => setActiveTab('signup')}
            onOpenSupabaseConfig={() => setIsConfigModalOpen(true)}
          />
        ) : (
          <SignUpForm 
            onSwitchToLogin={() => setActiveTab('login')}
            onOpenSupabaseConfig={() => setIsConfigModalOpen(true)}
          />
        )}

        {/* Security badge footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Hostinger Database • Bcrypt Hashed • @techygeekhub.com Restricted</span>
        </div>
      </div>

      {/* Database Setup & Config Modal */}
      <DatabaseConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />
    </div>
  );
}
