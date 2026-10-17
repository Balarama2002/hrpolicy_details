import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  saveSupabaseConfig, 
  getSupabaseConfig 
} from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [config, setConfig] = useState(getSupabaseConfig());

  // Initialize session and auth listener
  useEffect(() => {
    let authListener = null;

    const initAuth = async () => {
      setIsLoading(true);
      const client = getSupabaseClient();

      if (!client) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        setIsConfigured(false);
        return;
      }

      setIsConfigured(true);

      try {
        const { data: { session: initialSession }, error } = await client.auth.getSession();
        if (error) {
          console.warn('Error fetching Supabase session:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error('Unexpected auth init error:', err);
      } finally {
        setIsLoading(false);
      }

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      });

      authListener = subscription;
    };

    initAuth();

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, [config]);

  // Update Supabase configuration from UI
  const updateConfig = useCallback((url, anonKey) => {
    saveSupabaseConfig(url, anonKey);
    setConfig({ url, anonKey });
    setIsConfigured(isSupabaseConfigured());
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured yet. Please enter your Supabase Project URL and Anon Key.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    setUser(data.user);
    setSession(data.session);
    return data;
  }, []);

  // Sign up with email, password, and metadata (full name, department)
  const signUp = useCallback(async (email, password, { fullName, department } = {}) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured yet. Please enter your Supabase Project URL and Anon Key.');
    }

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
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
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err.message);
      }
    }
    setUser(null);
    setSession(null);
  }, []);

  // Password Reset
  const resetPassword = useCallback(async (email) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user),
    isLoading,
    isConfigured,
    config,
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
