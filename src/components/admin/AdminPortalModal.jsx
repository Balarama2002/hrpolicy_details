import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Shield, X, Check, AlertCircle, Loader2, 
  Trash2, RefreshCw, RotateCcw, Crown, Code2, Mail, Building, Clock, Search, ChevronDown, ChevronUp,
  Zap, Send, Bell, Sliders, MessageSquare, AlertTriangle, CheckCircle2, Plus, Minus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail } from '../../utils/validation';
import { 
  getQuotaConfig, 
  saveQuotaConfig, 
  evaluateTodayQuotaUsage, 
  dispatchTeamsQuotaAlert, 
  getAlertHistory,
  resetEmployeeQuota,
  resetAllEmployeeQuotas,
  getAlertCooldownStatus,
  DEFAULT_QUOTA_CONFIG 
} from '../../services/quotaService';

export default function AdminPortalModal({ isOpen, onClose, logs = [] }) {
  const { user: currentUser, listUsers, addUser, updateUserRole, deleteUser } = useAuth();
  
  // Navigation tabs: 'users' | 'quotas'
  const [activeTab, setActiveTab] = useState('users');

  // Users Directory state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('technical');
  const [newDepartment, setNewDepartment] = useState('Engineering & IT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quota & Teams Alerting State
  const [quotaConfig, setQuotaConfig] = useState(getQuotaConfig());
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [alertHistory, setAlertHistory] = useState(getAlertHistory());
  const [testUserAlerting, setTestUserAlerting] = useState(null);
  const [viewDateMode, setViewDateMode] = useState('auto'); // 'auto' | 'all-recent'
  const [quotaVersion, setQuotaVersion] = useState(0);

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await listUsers();
      const userList = Array.isArray(data) ? data : (data?.users || []);
      setUsers(userList);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load user list.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setIsAdding(false);
      setSuccessMessage('');
      setErrorMessage('');
      setQuotaConfig(getQuotaConfig());
      setAlertHistory(getAlertHistory());
      setTestResult(null);
    }
  }, [isOpen]);

  // Evaluate quota usage across logs
  const quotaUsageData = useMemo(() => {
    // If today has 0 queries and viewDateMode is 'auto', evaluate on the most recent active date or today
    let refDate = new Date();
    if (viewDateMode === 'all-recent' && logs.length > 0) {
      const latestLog = logs[0];
      if (latestLog?.createdAt) {
        refDate = new Date(latestLog.createdAt);
      }
    }
    return evaluateTodayQuotaUsage(logs, quotaConfig, refDate);
  }, [logs, quotaConfig, viewDateMode, quotaVersion]);

  const quotaViolationsCount = useMemo(() => {
    return quotaUsageData.filter(u => u.isExceeded).length;
  }, [quotaUsageData]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // USER PROVISIONING HANDLERS
  // -------------------------------------------------------------
  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    let cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@techygeekhub.com`;
    }

    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) {
      setErrorMessage(domainErr);
      return;
    }

    if (!newFullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await addUser({
        full_name: newFullName.trim(),
        email: cleanEmail,
        role: newRole,
        department: newDepartment,
      });

      const displayName = newUser?.full_name || newUser?.user?.full_name || newFullName.trim();
      setSuccessMessage(`✓ User ${displayName} (${cleanEmail}) has been provisioned as ${newRole.toUpperCase()}!`);
      setNewFullName('');
      setNewEmail('');
      setIsAdding(false);
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to provision user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (!newRole || targetUser.role === newRole) return;
    try {
      await updateUserRole(targetUser.email, newRole);
      setSuccessMessage(`✓ Role for ${targetUser.full_name} updated to ${newRole.toUpperCase()}`);
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.email === currentUser?.email) {
      alert("You cannot delete your own admin account.");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${targetUser.full_name} (${targetUser.email})? They will no longer be able to log in.`)) {
      return;
    }

    try {
      await deleteUser(targetUser.email);
      setSuccessMessage(`✓ Removed user ${targetUser.full_name}`);
      await loadUsers();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete user.');
    }
  };

  // -------------------------------------------------------------
  // QUOTA & TEAMS ALERTING HANDLERS
  // -------------------------------------------------------------
  const handleSaveQuotaConfig = (e) => {
    e?.preventDefault();
    setIsSavingQuota(true);
    saveQuotaConfig(quotaConfig);
    setTimeout(() => {
      setIsSavingQuota(false);
      setSuccessMessage('✓ Daily quota limits and n8n Teams webhook settings saved successfully!');
    }, 300);
  };

  const handleTestTeamsWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    const sampleAlert = {
      employeeName: currentUser?.full_name || 'Hanish Thatikonda',
      employeeEmail: currentUser?.email || 'hanish.thatikonda@techygeekhub.com',
      department: 'Engineering & IT',
      todayQueries: 14,
      queryLimit: quotaConfig.dailyMessageLimit,
      queryPercentage: Math.round((14 / quotaConfig.dailyMessageLimit) * 100),
      todayTokens: 28650,
      tokenLimit: quotaConfig.dailyTokenLimit,
      tokenPercentage: Math.round((28650 / quotaConfig.dailyTokenLimit) * 100),
      exceededMetric: 'both',
      dateStr: new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await dispatchTeamsQuotaAlert(sampleAlert, quotaConfig.teamsWebhookUrl);
      setTestResult({
        success: true,
        message: `Alert dispatched to n8n webhook! (HTTP ${res.status})`,
        data: sampleAlert,
      });
      setAlertHistory(getAlertHistory());
    } catch (err) {
      setTestResult({
        success: false,
        message: `Failed to reach n8n webhook: ${err.message}. Make sure your n8n workflow webhook is active.`,
        data: sampleAlert,
      });
      setAlertHistory(getAlertHistory());
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSendManualAlert = async (emp) => {
    setTestUserAlerting(emp.name);
    try {
      await dispatchTeamsQuotaAlert({
        employeeName: emp.name,
        employeeEmail: emp.email,
        department: 'Engineering & IT',
        todayQueries: emp.todayQueries,
        queryLimit: emp.queryLimit,
        queryPercentage: emp.queryPercentage,
        todayTokens: emp.todayTokens,
        tokenLimit: emp.tokenLimit,
        tokenPercentage: emp.tokenPercentage,
        exceededMetric: emp.exceededMetric !== 'none' ? emp.exceededMetric : 'manual_test',
        dateStr: emp.dateStr,
      }, quotaConfig.teamsWebhookUrl);

      setSuccessMessage(`✓ Quota alert for ${emp.name} sent to n8n Teams webhook!`);
      setAlertHistory(getAlertHistory());
    } catch (err) {
      setErrorMessage(`Failed to send alert for ${emp.name}: ${err.message}`);
    } finally {
      setTestUserAlerting(null);
    }
  };

  const handleResetUserQuota = (empName) => {
    resetEmployeeQuota(empName);
    setQuotaVersion(v => v + 1);
    setSuccessMessage(`✓ Quota consumption for ${empName} has been reset to 0 for today.`);
    setAlertHistory(getAlertHistory());
  };

  const handleResetAllQuotas = () => {
    if (!confirm('Are you sure you want to reset all employee quotas for today? All usage counters will restart from 0.')) {
      return;
    }
    resetAllEmployeeQuotas();
    setQuotaVersion(v => v + 1);
    setSuccessMessage('✓ All employee quotas have been reset to 0 for today.');
    setAlertHistory(getAlertHistory());
  };

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = safeUsers.filter(u => u.role === 'admin').length;
  const technicalCount = safeUsers.filter(u => u.role !== 'admin').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  TGH Executive Admin Portal
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user access, role assignments, daily quotas, and proactive Microsoft Teams breach alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory & Roles</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {safeUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'quotas'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Daily Quotas & Teams Alerts</span>
            {quotaViolationsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                {quotaViolationsCount} Exceeded
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
            <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: USERS DIRECTORY & ROLES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
            
            {/* Top Summary Stats Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {safeUsers.length}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Total Provisioned</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Corporate Accounts</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Full Analytics & Admin</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{adminCount} Admins</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Personal Scope Only</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{technicalCount} Technical Staff</div>
                </div>
              </div>
            </div>

            {/* Action Row: Search & Add User Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAdding ? 'Cancel Provisioning' : 'Provision New User'}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Provisioning Form */}
            {isAdding && (
              <form onSubmit={handleAddUser} className="p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-200/80 dark:border-slate-700/80 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Provision Corporate Access
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    New users authenticate with a 6-digit OTP sent to their corporate email
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cherukuri Bala Rama Krishna"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Corporate Email *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cbala@techygeekhub.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="Engineering & IT"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Role Access Scope
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="technical">Technical (Personal Scope Only)</option>
                      <option value="admin">Admin (Full Organization Telemetry)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-blue-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Save User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Provisioned Users Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Employee Name</th>
                    <th className="py-3 px-4 font-bold">Corporate Email</th>
                    <th className="py-3 px-4 font-bold">Department</th>
                    <th className="py-3 px-4 font-bold">Role Assignment</th>
                    <th className="py-3 px-4 font-bold">Last Activity</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span>Loading user directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No matching users found in the directory.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isUserAdmin = u.role === 'admin';
                      const isSelf = u.email === currentUser?.email;

                      return (
                        <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isUserAdmin 
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' 
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}>
                              {(u.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <span>{u.full_name}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {u.email}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {u.department || 'Engineering & IT'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative inline-flex items-center">
                              <select
                                value={u.role || 'technical'}
                                onChange={(e) => handleRoleChange(u, e.target.value)}
                                className={`text-[11px] font-bold rounded-xl pl-2.5 pr-7 py-1.5 border appearance-none cursor-pointer transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                                  isUserAdmin
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:border-purple-500/50'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:border-blue-500/50'
                                }`}
                              >
                                <option value="technical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold">
                                  Technical (Personal Scope)
                                </option>
                                <option value="admin" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold">
                                  Admin (Full Access)
                                </option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-400" />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never logged in'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? 'Cannot delete yourself' : 'Remove user'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DAILY QUOTAS & TEAMS ALERTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'quotas' && (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
            
            {/* 1. Threshold Configuration Form */}
            <form onSubmit={handleSaveQuotaConfig} noValidate className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Daily Quota Thresholds
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Proactive Teams Alerting Active</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Daily Message Limit */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>Daily Messages</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">queries/day</span>
                  </div>
                  
                  {/* Stepper with click arrows and number input */}
                  <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quotaConfig.dailyMessageLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuotaConfig({ ...quotaConfig, dailyMessageLimit: isNaN(val) ? '' : Math.max(1, val) });
                      }}
                      className="w-full py-2 px-3 text-center font-mono text-xl font-black text-slate-900 dark:text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 w-10 shrink-0 self-stretch">
                      <button
                        type="button"
                        onClick={() => setQuotaConfig(prev => ({ ...prev, dailyMessageLimit: (Number(prev.dailyMessageLimit) || 0) + 1 }))}
                        className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 transition-colors border-b border-slate-200 dark:border-slate-800 cursor-pointer active:scale-95"
                        title="Increase limit (▲)"
                      >
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuotaConfig(prev => ({ ...prev, dailyMessageLimit: Math.max(1, (Number(prev.dailyMessageLimit) || 1) - 1) }))}
                        className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-900/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                        title="Decrease limit (▼)"
                      >
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Daily Token Limit */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Daily Tokens</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">tokens/day</span>
                  </div>

                  {/* Stepper with click arrows and token input */}
                  <div className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/30">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quotaConfig.dailyTokenLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuotaConfig({ ...quotaConfig, dailyTokenLimit: isNaN(val) ? '' : Math.max(1, val) });
                      }}
                      className="w-full py-2 px-3 text-center font-mono text-xl font-black text-slate-900 dark:text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 w-10 shrink-0 self-stretch">
                      <button
                        type="button"
                        onClick={() => setQuotaConfig(prev => ({ ...prev, dailyTokenLimit: (Number(prev.dailyTokenLimit) || 0) + 1000 }))}
                        className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 transition-colors border-b border-slate-200 dark:border-slate-800 cursor-pointer active:scale-95"
                        title="Increase by 1,000 tokens (▲)"
                      >
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuotaConfig(prev => ({ ...prev, dailyTokenLimit: Math.max(500, (Number(prev.dailyTokenLimit) || 1000) - 1000) }))}
                        className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                        title="Decrease by 1,000 tokens (▼)"
                      >
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Alert Repeat Frequency / Cooldown */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>Teams Alert Frequency</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">cooldown</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/30">
                    <select
                      value={quotaConfig.alertIntervalHours || 6}
                      onChange={(e) => setQuotaConfig({ ...quotaConfig, alertIntervalHours: parseInt(e.target.value, 10) || 6 })}
                      className="w-full py-2.5 px-3 text-center font-mono text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Every 1 Hour</option>
                      <option value={6} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Every 6 Hours (Recommended)</option>
                      <option value={12} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Every 12 Hours</option>
                      <option value={24} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Every 24 Hours</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Action Buttons for Settings */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Proactive monitoring runs automatically on every live query sync</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTestingWebhook}
                    onClick={handleTestTeamsWebhook}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingWebhook ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Teams...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-blue-500" />
                        <span>Test Teams Alert</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingQuota}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Quota Settings</span>
                  </button>
                </div>
              </div>

              {/* Webhook Test Result Notice */}
              {testResult && (
                <div className={`p-3.5 rounded-xl border text-xs animate-fadeIn ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{testResult.success ? 'Teams Alert Dispatched' : 'Notice on Teams Webhook'}</span>
                  </div>
                  <p>{testResult.message}</p>
                </div>
              )}
            </form>

            {/* 2. Today's Active Employee Quota Consumption Monitor */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Active Employee Quota Telemetry</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time tracking of employee queries and tokens consumed vs daily allocated limits
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetAllQuotas}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Reset all employees' quota consumption for today to 0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All Today</span>
                  </button>

                  <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewDateMode('auto')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        viewDateMode === 'auto' 
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewDateMode('all-recent')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        viewDateMode === 'all-recent' 
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Recent Active Window
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold">Employee</th>
                      <th className="py-3 px-4 font-bold">Daily Messages (Limit: {quotaConfig.dailyMessageLimit})</th>
                      <th className="py-3 px-4 font-bold">Daily Tokens (Limit: {quotaConfig.dailyTokenLimit.toLocaleString()})</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {quotaUsageData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No query activity recorded for this period. Try switching to "Recent Active Window" above to test active employee records.
                        </td>
                      </tr>
                    ) : (
                      quotaUsageData.map((emp) => {
                        const isQueryOver = emp.todayQueries > quotaConfig.dailyMessageLimit;
                        const isTokenOver = emp.todayTokens > quotaConfig.dailyTokenLimit;
                        const isOver = isQueryOver || isTokenOver;
                        const cd = getAlertCooldownStatus(emp.name, quotaConfig.alertIntervalHours || 6);

                        return (
                          <tr key={emp.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{emp.email}</div>
                            </td>

                            {/* Message Progress */}
                            <td className="py-3.5 px-4 min-w-[150px]">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`font-mono font-semibold ${isQueryOver ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {emp.todayQueries} / {quotaConfig.dailyMessageLimit}
                                </span>
                                <span className={`text-[10px] font-mono ${isQueryOver ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                  {emp.queryPercentage}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div 
                                  className={`h-full transition-all rounded-full ${
                                    isQueryOver ? 'bg-rose-500' : emp.queryPercentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(emp.queryPercentage, 100)}%` }}
                                />
                              </div>
                            </td>

                            {/* Token Progress */}
                            <td className="py-3.5 px-4 min-w-[170px]">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`font-mono font-semibold ${isTokenOver ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {emp.todayTokens.toLocaleString()} / {(quotaConfig.dailyTokenLimit / 1000).toLocaleString()}k
                                </span>
                                <span className={`text-[10px] font-mono ${isTokenOver ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                  {emp.tokenPercentage}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div 
                                  className={`h-full transition-all rounded-full ${
                                    isTokenOver ? 'bg-rose-500' : emp.tokenPercentage >= 80 ? 'bg-amber-500' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${Math.min(emp.tokenPercentage, 100)}%` }}
                                />
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {emp.wasResetToday && !isOver ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                  title={`Reset by Admin today at ${emp.resetAt ? new Date(emp.resetAt).toLocaleTimeString() : 'recently'}`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Reset
                                </span>
                              ) : isOver ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    <AlertTriangle className="w-3 h-3" />
                                    Exceeded
                                  </span>
                                  {cd.inCooldown && (
                                    <span className="text-[10px] text-slate-400 font-mono" title={`Next reminder in ~${cd.remainingHours}h`}>
                                      ({cd.remainingHours}h)
                                    </span>
                                  )}
                                </div>
                              ) : emp.isNearLimit ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Near Limit
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Normal
                                </span>
                              )}
                            </td>

                            {/* Actions: Reset Quota + Notify Teams */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResetUserQuota(emp.name)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title={`Reset usage for ${emp.name} to 0`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={testUserAlerting === emp.name}
                                  onClick={() => handleSendManualAlert(emp)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-500/10 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Send breach notification payload to n8n Teams webhook now"
                                >
                                  {testUserAlerting === emp.name ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                  <span>Notify Teams</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>


            {/* 4. Recent Alerts Dispatch History */}
            {alertHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Teams Alerts Dispatched</span>
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-4 font-bold">Timestamp</th>
                        <th className="py-2.5 px-4 font-bold">Employee</th>
                        <th className="py-2.5 px-4 font-bold">Breached Limit</th>
                        <th className="py-2.5 px-4 font-bold">Dispatched Payload</th>
                        <th className="py-2.5 px-4 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {alertHistory.slice(0, 5).map((alert, i) => (
                        <tr key={alert.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {alert.employeeName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px]">
                            {alert.todayQueries}/{alert.queryLimit} queries • {alert.todayTokens?.toLocaleString()}/{alert.tokenLimit?.toLocaleString()} tkn
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-500 truncate max-w-xs">
                            {alert.summary}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              alert.success 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {alert.status || 'Delivered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
