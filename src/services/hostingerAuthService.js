/**
 * Hostinger MySQL & OTP Authentication Service for TechyGeekHub
 * Connects directly to the backend (/api/auth.php or /api/auth)
 */

import { validateCompanyEmail } from '../utils/validation';

const SESSION_STORAGE_KEY = 'tgh_hostinger_user_session';

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
   * Sends a 6-digit OTP to the employee's corporate email.
   * Only succeeds if the account was provisioned by an Administrator.
   * @param {string} emailOrUsername 
   */
  async sendOtp(emailOrUsername) {
    let clean = (emailOrUsername || '').trim().toLowerCase();
    if (!clean.includes('@')) {
      clean = `${clean}@techygeekhub.com`;
    }

    const domainErr = validateCompanyEmail(clean);
    if (domainErr) {
      throw new Error(domainErr);
    }

    const response = await fetch(getApiEndpoint('send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to send OTP code.');
    }

    return data;
  },

  /**
   * Verifies the 6-digit OTP and logs the user in
   * @param {string} email 
   * @param {string} otp 
   */
  async verifyOtp(email, otp) {
    let cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@techygeekhub.com`;
    }

    const cleanOtp = (otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP code.');
    }

    const response = await fetch(getApiEndpoint('verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Invalid or expired OTP code.');
    }

    this.setSession(data.user, data.token);
    return data;
  },

  /**
   * Signs in a user using legacy email + password (backward compatibility)
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) throw new Error(domainErr);

    const response = await fetch(getApiEndpoint('login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to authenticate.');
    }

    this.setSession(data.user, data.token);
    return data;
  },

  /**
   * ADMIN PORTAL: Lists all provisioned users
   */
  async listUsers() {
    const response = await fetch(getApiEndpoint('list-users'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to retrieve user list.');
    }

    return data.users || [];
  },

  /**
   * ADMIN PORTAL: Provisions a new corporate user
   * @param {Object} userData - { email, full_name, role, department }
   */
  async addUser(userData) {
    let cleanEmail = (userData.email || '').trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@techygeekhub.com`;
    }

    const domainErr = validateCompanyEmail(cleanEmail);
    if (domainErr) throw new Error(domainErr);

    const response = await fetch(getApiEndpoint('add-user'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        email: cleanEmail,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to provision user.');
    }

    return data.user;
  },

  /**
   * ADMIN PORTAL: Updates a user's role ('admin' vs 'technical')
   * @param {string} email 
   * @param {string} role 
   */
  async updateUserRole(email, role) {
    const response = await fetch(getApiEndpoint('update-user-role'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update user role.');
    }

    return data;
  },

  /**
   * ADMIN PORTAL: Deletes/removes a user
   * @param {string} email 
   */
  async deleteUser(email) {
    const response = await fetch(getApiEndpoint('delete-user'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete user.');
    }

    return data;
  },

  /**
   * Tests connection
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
