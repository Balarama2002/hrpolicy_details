import { createClient } from '@supabase/supabase-js';

const SUPABASE_STORAGE_KEY = 'tgh_supabase_config';

export function getSupabaseConfig() {
  let envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  let envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url) envUrl = parsed.url;
      if (parsed.anonKey) envKey = parsed.anonKey;
    }
  } catch (e) {
    console.error('Failed to parse Supabase config from localStorage', e);
  }

  return {
    url: envUrl.trim(),
    anonKey: envKey.trim(),
  };
}

export function saveSupabaseConfig(url, anonKey) {
  try {
    localStorage.setItem(
      SUPABASE_STORAGE_KEY,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
  } catch (e) {
    console.error('Failed to save Supabase config to localStorage', e);
  }
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);
}

// Singleton client instance
let supabaseInstance = null;

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (
    !supabaseInstance ||
    supabaseInstance.supabaseUrl !== url ||
    supabaseInstance.supabaseKey !== anonKey
  ) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
  }

  return supabaseInstance;
}
