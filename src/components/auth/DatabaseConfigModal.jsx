import React, { useState } from 'react';
import { Database, Server, Key, ExternalLink, X, Check, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DatabaseConfigModal({ isOpen, onClose }) {
  const { 
    authProvider, 
    setAuthProvider, 
    dbStatus, 
    checkDatabaseStatus, 
    config, 
    updateConfig 
  } = useAuth();

  const [supabaseUrl, setSupabaseUrl] = useState(config?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(config?.anonKey || '');
  const [activeTab, setActiveTab] = useState(authProvider || 'hostinger');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await checkDatabaseStatus();
      const res = await fetch('/api/test.php');
      const data = await res.json();
      setTestResult({
        success: data.connected !== false,
        message: data.connected !== false 
          ? `Connected to ${data.database_name} on ${data.database_host}. Table user_information is ${data.table_exists ? 'ready' : 'not found'}.`
          : (data.error || 'Connection failed'),
      });
    } catch (e) {
      setTestResult({
        success: false,
        message: e.message || 'Could not reach /api/test.php endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    updateConfig(supabaseUrl, supabaseKey);
    setAuthProvider('supabase');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden transition-all">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Database & Authentication Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Self-hosted on Hostinger MySQL or external cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: Hostinger MySQL vs Supabase */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800">
            <button
              onClick={() => { setActiveTab('hostinger'); setAuthProvider('hostinger'); }}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'hostinger'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Hostinger MySQL (Active)</span>
            </button>
            <button
              onClick={() => { setActiveTab('supabase'); setAuthProvider('supabase'); }}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'supabase'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Cloud</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Hostinger MySQL Details */}
        {activeTab === 'hostinger' && (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Self-Hosted on Hostinger
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Native Hostinger Database
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Your user credentials and authentication data are stored directly inside your own Hostinger MySQL database in the <code className="font-mono text-blue-600 dark:text-blue-400">user_information</code> table. Passwords are encrypted with industry-standard <strong>Bcrypt</strong>.
              </p>
            </div>

            {/* Diagnostics and Setup */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hostinger Database Settings (in <code className="text-blue-500">public_html/api/db.php</code>):
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                <div><span className="text-slate-500">DB_HOST:</span> 'localhost'</div>
                <div><span className="text-slate-500">DB_NAME:</span> 'u123456789_hragent' (from Hostinger hPanel)</div>
                <div><span className="text-slate-500">DB_USER:</span> 'u123456789_hruser'</div>
                <div><span className="text-slate-500">DB_PASS:</span> 'YourHostingerPassword'</div>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test DB Connection</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href="/api/setup.php"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <span>1-Click Table Setup</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Supabase Alternative */}
        {activeTab === 'supabase' && (
          <form onSubmit={handleSaveSupabase} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://vsihdsgoebpkxmztqqil.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Supabase Anon Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                Use Supabase
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
