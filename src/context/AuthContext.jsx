import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hostingerAuthService } from '../services/hostingerAuthService';
import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  saveSupabaseConfig, 
  getSupabaseConfig 
} from '../services/supabaseClient';
import { validateCompanyEmail } from '../utils/validation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState('hostinger'); // 'hostinger' | 'supabase'
  const [dbStatus, setDbStatus] = useState({
    connected: true,
    host: 'localhost',
    dbName: 'Hostinger MySQL',
    tableExists: true,
    isChecking: false,
  });

  // Supabase fallback config state
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());

  // Check DB status on mount
  const checkDatabaseStatus = useCallback(async () => {
    setDbStatus(prev => ({ ...prev, isChecking: true }));
    try {
      const res = await hostingerAuthService.testConnection();
      setDbStatus({
        connected: res.connected !== false,
        host: res.database_host || 'localhost',
        dbName: res.database_name || 'Hostinger MySQL',
        tableExists: res.table_exists !== false,
        isChecking: false,
      });
    } catch (err) {
      setDbStatus(prev => ({ ...prev, connected: false, isChecking: false }));
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // 1. Check cached Hostinger session
      const cached = hostingerAuthService.getSession();
      if (cached && cached.user) {
        const u = cached.user;
        setUser({
          ...u,
          user_metadata: {
            full_name: u.full_name || u.name || '',
            department: u.department || 'Human Resources (HR)',
          },
        });
        setSession(cached);
      }

      // 2. Test Hostinger database status
      await checkDatabaseStatus();

      setIsLoading(false);
    };

    initAuth();
  }, [checkDatabaseStatus]);

  // Sign In using Hostinger MySQL database
  const signIn = useCallback(async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const domainError = validateCompanyEmail(cleanEmail);
    if (domainError) {
      throw new Error(domainError);
    }

    if (authProvider === 'supabase' && isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase not configured');
      const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      setUser(data.user);
      setSession(data.session);
      return data;
    }

    // Default: Hostinger MySQL Database
    const res = await hostingerAuthService.signIn(cleanEmail, password);
    const u = res.user;
    const formattedUser = {
      ...u,
      user_metadata: {
        full_name: u.full_name || u.name || '',
        department: u.department || 'Human Resources (HR)',
      },
    };
    setUser(formattedUser);
    setSession({ user: formattedUser, token: res.token });
    return res;
  }, [authProvider]);

  // Sign Up and save to Hostinger MySQL table `user_information`
  const signUp = useCallback(async (email, password, { fullName, department } = {}) => {
    const cleanEmail = email.trim().toLowerCase();
    const domainError = validateCompanyEmail(cleanEmail);
    if (domainError) {
      throw new Error(domainError);
    }

    if (authProvider === 'supabase' && isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase not configured');
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || '',
            department: department?.trim() || '',
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      }
      return data;
    }

    // Default: Hostinger MySQL Database
    const res = await hostingerAuthService.signUp(cleanEmail, password, { fullName, department });
    const u = res.user;
    const formattedUser = {
      ...u,
      user_metadata: {
        full_name: u.full_name || u.name || '',
        department: u.department || 'Human Resources (HR)',
      },
    };
    setUser(formattedUser);
    setSession({ user: formattedUser, token: res.token });
    return res;
  }, [authProvider]);

  // Sign Out
  const signOut = useCallback(async () => {
    hostingerAuthService.clearSession();
    const client = getSupabaseClient();
    if (client) {
      try { await client.auth.signOut(); } catch (e) { /* ignore */ }
    }
    setUser(null);
    setSession(null);
  }, []);

  // Password Reset
  const resetPassword = useCallback(async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    const domainError = validateCompanyEmail(cleanEmail);
    if (domainError) {
      throw new Error(domainError);
    }

    if (authProvider === 'supabase' && isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase not configured');
      return await client.auth.resetPasswordForEmail(cleanEmail);
    }

    return await hostingerAuthService.resetPassword(cleanEmail);
  }, [authProvider]);

  // Update Supabase configuration if user switches to Supabase mode
  const updateConfig = useCallback((url, anonKey) => {
    saveSupabaseConfig(url, anonKey);
    setSupabaseConfig({ url, anonKey });
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user),
    isLoading,
    authProvider,
    setAuthProvider,
    dbStatus,
    checkDatabaseStatus,
    isConfigured: true, // Hostinger DB is primary and configured
    config: supabaseConfig,
    updateConfig,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
