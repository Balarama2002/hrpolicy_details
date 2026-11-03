import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, X, Check, AlertCircle, Loader2, 
  Trash2, RefreshCw, Crown, Code2, Mail, Building, Clock, Search, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateCompanyEmail } from '../../utils/validation';

export default function AdminPortalModal({ isOpen, onClose }) {
  const { user: currentUser, listUsers, addUser, updateUserRole, deleteUser } = useAuth();
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

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load user list.');
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

      setSuccessMessage(`✓ User ${newUser.full_name} (${cleanEmail}) has been provisioned as ${newRole.toUpperCase()}!`);
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

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const technicalCount = users.filter(u => u.role !== 'admin').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  Admin User & Role Management
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provision corporate accounts, grant access, and assign RBAC scopes (Admin vs. Technical)
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

        {/* Top Summary Stats Bar */}
        <div className="px-6 py-4 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {users.length}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Provisioned</div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">Corporate Users</div>
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Personal Scope Only</div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">{technicalCount} Technical Staff</div>
            </div>
          </div>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="m-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="m-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          
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
                  New users authenticate with a 6-digit OTP sent to their email
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
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="Engineering & IT">Engineering & IT</option>
                    <option value="Human Resources (HR)">Human Resources (HR)</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Assigned Role (RBAC Scope)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
                  >
                    <option value="technical">Technical Staff (Personal Analytics Only)</option>
                    <option value="admin">Administrator (Full Company Data & User Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                  <th className="py-3 px-4 font-bold">Role Scope</th>
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
                    const isAdmin = u.role === 'admin';
                    const isSelf = u.email === currentUser?.email;

                    return (
                      <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isAdmin 
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
                                isAdmin
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

        {/* Footer */}
        <div className="px-6 py-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Click on any user's role badge to toggle between <strong>Admin</strong> and <strong>Technical</strong> scope.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
}
