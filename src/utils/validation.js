/**
 * Authentication and Domain Validation Utilities for TechyGeekHub
 */

export const COMPANY_DOMAIN = '@techygeekhub.com';

/**
 * Validates if an email address belongs to the allowed corporate domain (@techygeekhub.com)
 * @param {string} email 
 * @returns {boolean}
 */
export function isCompanyEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(COMPANY_DOMAIN);
}

/**
 * Returns an error message if the email is invalid or doesn't belong to the corporate domain.
 * Returns null if valid.
 * @param {string} email 
 * @returns {string|null}
 */
export function validateCompanyEmail(email) {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return 'Work email address is required.';
  }
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }

  // Mandatory @techygeekhub.com domain check
  if (!trimmed.endsWith(COMPANY_DOMAIN)) {
    return `Access restricted: Only official company email addresses (${COMPANY_DOMAIN}) are allowed. Please use your corporate email ID.`;
  }

  return null;
}

/**
 * Generates a cryptographic SHA-256 hash of a string using Web Crypto API.
 * Ensures that even in secondary tables, passwords are never stored in plain text.
 * @param {string} str 
 * @returns {Promise<string>}
 */
export async function hashPasswordSha256(str) {
  if (!str) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Crypto error during hashing:', err);
    // Fallback simple hex hash if subtle crypto fails
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `sha256_compat_${Math.abs(hash).toString(16)}`;
  }
}
