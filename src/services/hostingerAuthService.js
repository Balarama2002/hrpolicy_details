/**
 * Hostinger MySQL & OTP Authentication Service for TechyGeekHub
 * Connects directly to the backend (/api/auth.php or configured Hostinger VPS URL)
 */

import { validateCompanyEmail } from '../utils/validation';

const SESSION_STORAGE_KEY = 'tgh_hostinger_user_session';
const BACKEND_URL_KEY = 'tgh_hostinger_backend_url';

export function getBackendBaseUrl() {
  return (
    localStorage.getItem(BACKEND_URL_KEY) ||
    import.meta.env.VITE_HOSTINGER_API_URL ||
    '/api/auth.php'
  );
}

export function setBackendBaseUrl(url) {
  if (url) {
    localStorage.setItem(BACKEND_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(BACKEND_URL_KEY);
  }
}

function getApiEndpoint(action) {
  const base = getBackendBaseUrl();
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}action=${encodeURIComponent(action)}`;
}

/**
 * Robust JSON request helper that catches non-JSON/404 responses from static hosts
 */
async function requestApi(action, options = {}) {
  const url = getApiEndpoint(action);
  let response;

  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(
      `Network Error: Cannot connect to backend API at "${url}". Ensure your Hostinger server or local dev server is running.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('Malformed JSON received from backend API.');
    }
  } else {
    const raw = await response.text();
    // Static host or 404 handler
    if (response.status === 404 || raw.includes('<!DOCTYPE') || raw.includes('<html')) {
      throw new Error(
        `Backend API not available on this domain (${response.status}). Static hosts like GitHub Pages do not execute PHP/Node. Pull this repository to your Hostinger server where PHP and MySQL are active.`
      );
    }
    throw new Error(`Unexpected response (${response.status}): ${raw.slice(0, 120)}`);
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
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

    return await requestApi('send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean }),
    });
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

    const data = await requestApi('verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
    });

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

    const data = await requestApi('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    this.setSession(data.user, data.token);
    return data;
  },

  /**
   * ADMIN PORTAL: Lists all provisioned users
   */
  async listUsers() {
    const res = await requestApi('list-users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return Array.isArray(res) ? res : (res?.users || []);
  },

  /**
   * ADMIN PORTAL: Provisions a new corporate user
   * @param {Object} userData 
   */
  async addUser(userData) {
    const email = (userData.email || '').trim().toLowerCase();
    const domainErr = validateCompanyEmail(email);
    if (domainErr) throw new Error(domainErr);

    return await requestApi('add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        full_name: userData.full_name || userData.fullName,
        department: userData.department || 'Engineering & IT',
        role: userData.role || 'technical',
      }),
    });
  },

  /**
   * ADMIN PORTAL: Updates role of an existing employee (admin vs technical)
   * @param {string} email 
   * @param {'admin'|'technical'} role 
   */
  async updateUserRole(email, role) {
    return await requestApi('update-user-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
  },

  /**
   * ADMIN PORTAL: Deletes/removes a user
   * @param {string} email 
   */
  async deleteUser(email) {
    return await requestApi('delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
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
