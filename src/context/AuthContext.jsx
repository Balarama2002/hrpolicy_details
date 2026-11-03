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
  const [authProvider, setAuthProvider] = useState('hostinger');
  const [dbStatus, setDbStatus] = useState({
    connected: true,
    host: 'localhost',
    dbName: 'Hostinger MySQL',
    tableExists: true,
    isChecking: false,
  });

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

      // 1. Check cached session
      const cached = hostingerAuthService.getSession();
      if (cached && cached.user) {
        const u = cached.user;
        setUser({
          ...u,
          role: u.role || 'technical',
          user_metadata: {
            full_name: u.full_name || u.name || '',
            department: u.department || 'Engineering & IT',
          },
        });
        setSession(cached);
      }

      // 2. Test database status
      await checkDatabaseStatus();

      setIsLoading(false);
    };

    initAuth();
  }, [checkDatabaseStatus]);

  // Request 6-digit OTP
  const sendOtp = useCallback(async (emailOrUsername) => {
    return await hostingerAuthService.sendOtp(emailOrUsername);
  }, []);

  // Verify 6-digit OTP and login
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await hostingerAuthService.verifyOtp(email, otp);
    const u = res.user;
    const formattedUser = {
      ...u,
      role: u.role || 'technical',
      user_metadata: {
        full_name: u.full_name || u.name || '',
        department: u.department || 'Engineering & IT',
      },
    };
    setUser(formattedUser);
    setSession({ user: formattedUser, token: res.token });
    return res;
  }, []);

  // Sign In using password (fallback)
  const signIn = useCallback(async (email, password) => {
    const res = await hostingerAuthService.signIn(email, password);
    const u = res.user;
    const formattedUser = {
      ...u,
      role: u.role || 'technical',
      user_metadata: {
        full_name: u.full_name || u.name || '',
        department: u.department || 'Engineering & IT',
      },
    };
    setUser(formattedUser);
    setSession({ user: formattedUser, token: res.token });
    return res;
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    hostingerAuthService.clearSession();
    setUser(null);
    setSession(null);
  }, []);

  // Admin Portal methods
  const listUsers = useCallback(async () => {
    return await hostingerAuthService.listUsers();
  }, []);

  const addUser = useCallback(async (userData) => {
    return await hostingerAuthService.addUser(userData);
  }, []);

  const updateUserRole = useCallback(async (email, role) => {
    const res = await hostingerAuthService.updateUserRole(email, role);
    // If updating current user's role, update state
    if (user && user.email === email) {
      setUser(prev => ({ ...prev, role }));
    }
    return res;
  }, [user]);

  const deleteUser = useCallback(async (email) => {
    return await hostingerAuthService.deleteUser(email);
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isLoading,
    authProvider,
    setAuthProvider,
    dbStatus,
    checkDatabaseStatus,
    isConfigured: true,
    sendOtp,
    verifyOtp,
    signIn,
    signOut,
    listUsers,
    addUser,
    updateUserRole,
    deleteUser,
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
