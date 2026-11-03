/**
 * Hostinger MySQL Authentication Service for TechyGeekHub
 * Connects directly to the Hostinger PHP backend (/api/auth.php)
 */

import { validateCompanyEmail } from '../utils/validation';

const SESSION_STORAGE_KEY = 'tgh_hostinger_user_session';

/**
 * Gets base API URL. In production on Hostinger, it's relative `/api/auth.php`.
 * In dev mode, it points to local proxy or relative.
 */
function getApiEndpoint(action) {
  const base = import.meta.env.VITE_HOSTINGER_API_URL || '/api/auth.php';
  return `${base}?action=${encodeURIComponent(action)}`;
}

export const hostingerAuthService = {
  /**
   * Retrieves currently cached session from localStorage
   */
  getSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse cached session:', e);
      return null;
    }
  },

  /**
   * Stores session into localStorage
   */
  setSession(user, token) {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ user, token, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  },

  /**
   * Clears cached session
   */
  clearSession() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  },

  /**
   * Signs in a user using Hostinger MySQL database
   * @param {string} email 
   * @param {string} password 
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) {
      throw new Error(domainErr);
    }

    const response = await fetch(getApiEndpoint('login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to authenticate with Hostinger Database.');
    }

    this.setSession(data.user, data.token);
    return data;
  },

  /**
   * Signs up a new user and stores in Hostinger MySQL table `user_information`
   * @param {string} email 
   * @param {string} password 
   * @param {Object} metadata 
   */
  async signUp(email, password, { fullName, department } = {}) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) {
      throw new Error(domainErr);
    }

    const response = await fetch(getApiEndpoint('signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        fullName: fullName?.trim(),
        department: department?.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create account in Hostinger Database.');
    }

    this.setSession(data.user, data.token);
    return data;
  },

  /**
   * Triggers password reset request
   * @param {string} email 
   */
  async resetPassword(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) {
      throw new Error(domainErr);
    }

    const response = await fetch(getApiEndpoint('reset-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit password reset.');
    }

    return data;
  },

  /**
   * Tests the Hostinger database connection
   */
  async testConnection() {
    try {
      const response = await fetch('/api/test.php');
      const data = await response.json();
      return data;
    } catch (e) {
      return { connected: false, error: e.message };
    }
  },
};
