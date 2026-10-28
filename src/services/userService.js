import { getSupabaseClient } from './supabaseClient';
import { hashPasswordSha256 } from '../utils/validation';

/**
 * Saves or updates user details in the Supabase 'User information' table.
 * Strictly guarantees that passwords are NEVER stored in plain text.
 * 
 * @param {Object} params
 * @param {Object} params.user - Supabase auth user object
 * @param {string} params.email - User email address
 * @param {string} [params.password] - Raw password (will be cryptographically hashed)
 * @param {string} [params.fullName] - Full name of the user
 * @param {string} [params.department] - Selected department
 * @param {boolean} [params.isLogin] - Whether this call is triggered by a login event
 */
export async function syncUserInformation({
  user,
  email,
  password,
  fullName,
  department,
  isLogin = false,
}) {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Cannot sync User information: Supabase client not initialized');
    return null;
  }

  const cleanEmail = (email || user?.email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const nowIso = new Date().toISOString();
    
    // Hash password if provided (never plain text)
    let passwordHash = null;
    if (password) {
      passwordHash = await hashPasswordSha256(password);
    }

    // Build flexible payload compatible with common schemas
    const basePayload = {
      email: cleanEmail,
      updated_at: nowIso,
    };

    if (isLogin) {
      basePayload.last_login = nowIso;
      basePayload.last_sign_in_at = nowIso;
    } else {
      basePayload.created_at = nowIso;
      basePayload.last_login = nowIso;
      basePayload.last_sign_in_at = nowIso;
      if (fullName) {
        basePayload.full_name = fullName.trim();
        basePayload.name = fullName.trim();
      }
      if (department) {
        basePayload.department = department.trim();
      }
      if (user?.id) {
        basePayload.auth_user_id = user.id;
        basePayload.user_id = user.id;
      }
      if (passwordHash) {
        // Stored cryptographically encrypted / hashed
        basePayload.password = passwordHash;
        basePayload.password_hash = passwordHash;
        basePayload.encrypted_password = passwordHash;
      }
    }

    // Try targeted tables: 'User information' (with space), or 'user_information'
    const tableNames = ['User information', 'user_information', 'users'];
    let lastError = null;
    let savedData = null;

    for (const tableName of tableNames) {
      try {
        // Attempt standard upsert based on email
        const { data, error } = await client
          .from(tableName)
          .upsert(basePayload, { onConflict: 'email' })
          .select();

        if (!error) {
          savedData = data;
          lastError = null;
          break;
        }

        // If error was about extra columns not existing in schema cache,
        // retry with minimal safe payload
        if (error.message?.includes('column') || error.code === 'PGRST204') {
          const minimalPayload = {
            email: cleanEmail,
          };
          if (fullName) minimalPayload.full_name = fullName.trim();
          if (department) minimalPayload.department = department.trim();
          if (passwordHash) minimalPayload.password = passwordHash;

          const retry = await client
            .from(tableName)
            .upsert(minimalPayload, { onConflict: 'email' })
            .select();

          if (!retry.error) {
            savedData = retry.data;
            lastError = null;
            break;
          }
          lastError = retry.error;
        } else {
          lastError = error;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError && !savedData) {
      // Non-blocking warning so user is not locked out if DB table RLS is still being configured
      console.warn('Note: Could not sync into User information table:', lastError.message || lastError);
    }

    return savedData;
  } catch (err) {
    console.warn('Exception while syncing user information:', err);
    return null;
  }
}
