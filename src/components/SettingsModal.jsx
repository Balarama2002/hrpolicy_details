import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Globe, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Shield, 
  Info,
  Server
} from 'lucide-react';
import { testN8nConnection, saveConfig, DEFAULT_CONFIG } from '../services/n8nApi';

export default function SettingsModal({ config, onSaveConfig, onClose }) {
  const [formData, setFormData] = useState({ ...config });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testN8nConnection(formData.baseUrl, formData.apiKey);
      setTestResult({
        success: true,
        message: res.message,
        latency: res.latencyMs,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to n8n instance.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveConfig(formData);
    onSaveConfig(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Option B: Direct n8n REST API Connection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect the UI directly to your self-hosted n8n instance via API Key
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-800 dark:text-blue-300">How Direct API Connection works:</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                The dashboard securely queries live execution runs and audit log records using the configured API credentials.
              </p>
            </div>
          </div>

          {/* n8n Base URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>API Instance URL</span>
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://n8n.srv1901759.hstgr.cloud"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* n8n API Key */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>REST API Key</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Create an API key in your server settings &rarr; <em>API</em> &rarr; <em>Create API key</em>.
            </p>
          </div>

          {/* Target IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Workflow Execution ID</span>
              </label>
              <input
                type="text"
                value={formData.workflowId}
                onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Audit Log Data Table ID</span>
              </label>
              <input
                type="text"
                value={formData.dataTableId}
                onChange={(e) => setFormData({ ...formData, dataTableId: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Live REST Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.useLiveData}
                onChange={(e) => setFormData({ ...formData, useLiveData: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Enable Live REST API Polling
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  When enabled, queries will be fetched live from n8n instead of using the local synchronized dataset.
                </span>
              </div>
            </label>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !formData.baseUrl}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Connecting to n8n...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5 text-blue-500" />
                  <span>Test Connection (Ping n8n API)</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`mt-2.5 p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-semibold">{testResult.message}</div>
                  {testResult.latency && (
                    <div className="font-mono text-[11px] opacity-80">
                      Response latency: {testResult.latency}ms
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 -mx-5 -mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
