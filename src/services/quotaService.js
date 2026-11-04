/**
 * Quota & Proactive Teams Alerting Service for TechyGeekHub
 * Manages daily message limits and token limits per employee,
 * and proactively triggers n8n Webhook alerts for Microsoft Teams.
 */

import { getProxiedUrl } from './n8nApi.js';

const QUOTA_CONFIG_KEY = 'tgh_quota_config';
const QUOTA_ALERTS_HISTORY_KEY = 'tgh_quota_alerts_history';
const QUOTA_SENT_CACHE_KEY = 'tgh_quota_sent_cache';
const QUOTA_RESETS_KEY = 'tgh_quota_resets';

export const DEFAULT_QUOTA_CONFIG = {
  dailyMessageLimit: 5, // Default: 5 questions allowed per employee per day
  dailyTokenLimit: 25000, // Max tokens allowed per employee per day
  alertIntervalHours: 6, // Alert reminder cooldown: 6 hours (configurable: 1, 6, 12, 24)
  teamsWebhookUrl: 'https://n8n.srv1901759.hstgr.cloud/webhook/quota-alert',
  alertsEnabled: true,
};

/**
 * Retrieves saved quota configuration from localStorage
 */
export function getQuotaConfig() {
  try {
    const saved = localStorage.getItem(QUOTA_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_QUOTA_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse quota config:', e);
  }
  return DEFAULT_QUOTA_CONFIG;
}

/**
 * Saves quota configuration to localStorage and syncs with backend server
 */
export function saveQuotaConfig(config) {
  try {
    localStorage.setItem(QUOTA_CONFIG_KEY, JSON.stringify(config));
    fetch('/api/quota.php?action=set-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save quota config:', e);
  }
}

/**
 * Retrieves past alert history
 */
export function getAlertHistory() {
  try {
    const saved = localStorage.getItem(QUOTA_ALERTS_HISTORY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return [];
}

/**
 * Records an alert in local history
 */
export function recordAlertHistory(alert) {
  try {
    const history = getAlertHistory();
    const updated = [alert, ...history.slice(0, 49)]; // Keep last 50
    localStorage.setItem(QUOTA_ALERTS_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {}
}

/**
 * Retrieves all admin quota reset records
 */
export function getEmployeeQuotaResets() {
  try {
    const saved = localStorage.getItem(QUOTA_RESETS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Admin action: Resets an employee's quota usage for today
 * Usage starts fresh from 0, and any alert cooldown is cleared.
 */
export function resetEmployeeQuota(employeeName) {
  try {
    const resets = getEmployeeQuotaResets();
    const key = employeeName.trim().toLowerCase();
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    resets[key] = {
      employeeName: employeeName.trim(),
      resetAt: nowIso,
      resetTimestamp: Date.now(),
      dateStr: todayStr,
    };
    localStorage.setItem(QUOTA_RESETS_KEY, JSON.stringify(resets));

    // Clear alert cooldown cache for this user so they are immediately clean
    const cache = JSON.parse(localStorage.getItem(QUOTA_SENT_CACHE_KEY) || '{}');
    delete cache[key];
    delete cache[`${key}_${todayStr}`];
    localStorage.setItem(QUOTA_SENT_CACHE_KEY, JSON.stringify(cache));

    recordAlertHistory({
      id: 'reset_' + Date.now(),
      event: 'QUOTA_RESET',
      employeeName: employeeName.trim(),
      summary: `Admin manually reset daily quota for ${employeeName.trim()}. Usage counter reset to 0.`,
      timestamp: nowIso,
      status: 'Quota Reset by Admin',
      success: true,
    });

    fetch('/api/quota.php?action=reset-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName: employeeName.trim() }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to reset quota for employee:', e);
  }
}

/**
 * Admin action: Resets quotas for ALL employees today
 */
export function resetAllEmployeeQuotas() {
  try {
    const nowIso = new Date().toISOString();
    localStorage.removeItem(QUOTA_RESETS_KEY);
    localStorage.removeItem(QUOTA_SENT_CACHE_KEY);
    localStorage.setItem('tgh_global_quota_reset_at', nowIso);

    recordAlertHistory({
      id: 'reset_all_' + Date.now(),
      event: 'QUOTA_RESET_ALL',
      employeeName: 'All Employees',
      summary: `Admin reset quotas for all employees today. Usage counters reset to 0.`,
      timestamp: nowIso,
      status: 'All Quotas Reset',
      success: true,
    });

    fetch('/api/quota.php?action=reset-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to reset all quotas:', e);
  }
}

/**
 * Checks if an alert is currently in cooldown for an employee.
 * Uses the admin-configured alertIntervalHours (e.g. 6 hours or 12 hours).
 */
export function isAlertInCooldown(employeeName, alertIntervalHours = 6) {
  try {
    const cache = JSON.parse(localStorage.getItem(QUOTA_SENT_CACHE_KEY) || '{}');
    const key = employeeName.trim().toLowerCase();
    const entry = cache[key];
    if (!entry || !entry.sentAt) return false;

    const elapsedHours = (Date.now() - new Date(entry.sentAt).getTime()) / (1000 * 60 * 60);
    return elapsedHours < alertIntervalHours;
  } catch (e) {
    return false;
  }
}

/**
 * Retrieves the remaining cooldown info for an employee
 */
export function getAlertCooldownStatus(employeeName, alertIntervalHours = 6) {
  try {
    const cache = JSON.parse(localStorage.getItem(QUOTA_SENT_CACHE_KEY) || '{}');
    const key = employeeName.trim().toLowerCase();
    const entry = cache[key];
    if (!entry || !entry.sentAt) return { inCooldown: false, remainingHours: 0, lastSentAt: null };

    const elapsedHours = (Date.now() - new Date(entry.sentAt).getTime()) / (1000 * 60 * 60);
    const inCooldown = elapsedHours < alertIntervalHours;
    const remainingHours = inCooldown ? Math.max(0.1, Number((alertIntervalHours - elapsedHours).toFixed(1))) : 0;
    return { inCooldown, remainingHours, lastSentAt: entry.sentAt };
  } catch (e) {
    return { inCooldown: false, remainingHours: 0, lastSentAt: null };
  }
}

/**
 * Marks an alert as sent with current timestamp
 */
export function markAlertSent(employeeName) {
  try {
    const cache = JSON.parse(localStorage.getItem(QUOTA_SENT_CACHE_KEY) || '{}');
    const key = employeeName.trim().toLowerCase();
    cache[key] = { sentAt: new Date().toISOString() };
    localStorage.setItem(QUOTA_SENT_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
}

/**
 * Dispatches Quota Exceeded alert payload to n8n Webhook
 */
export async function dispatchTeamsQuotaAlert(alertData, webhookUrl = DEFAULT_QUOTA_CONFIG.teamsWebhookUrl) {
  const targetUrl = getProxiedUrl(webhookUrl);

  const payload = {
    event: 'QUOTA_EXCEEDED',
    alertType: 'DAILY_LIMIT_BREACH',
    severity: 'WARNING',
    employeeName: alertData.employeeName,
    employeeEmail: alertData.employeeEmail,
    department: alertData.department || 'Engineering & IT',
    todayQueries: alertData.todayQueries,
    queryLimit: alertData.queryLimit,
    queryPercentage: alertData.queryPercentage,
    todayTokens: alertData.todayTokens,
    tokenLimit: alertData.tokenLimit,
    tokenPercentage: alertData.tokenPercentage,
    exceededMetric: alertData.exceededMetric, // 'queries', 'tokens', or 'both'
    date: alertData.dateStr,
    timestamp: new Date().toISOString(),
    channel: 'Microsoft Teams',
    summary: `⚠️ Quota Alert: ${alertData.employeeName} exceeded daily allowance: ${alertData.todayQueries}/${alertData.queryLimit} queries, ${alertData.todayTokens.toLocaleString()}/${alertData.tokenLimit.toLocaleString()} tokens.`,
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const isSuccess = response.ok;
    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch {}

    const alertRecord = {
      id: 'alert_' + Date.now(),
      ...payload,
      status: isSuccess ? 'Delivered to n8n' : `Failed (${response.status})`,
      success: isSuccess,
    };

    recordAlertHistory(alertRecord);
    return { success: isSuccess, status: response.status, data: responseBody };
  } catch (error) {
    const alertRecord = {
      id: 'alert_' + Date.now(),
      ...payload,
      status: `Network Error: ${error.message}`,
      success: false,
    };
    recordAlertHistory(alertRecord);
    throw error;
  }
}

/**
 * Aggregates today's usage per employee and evaluates against daily limits.
 * Honors Admin Quota Resets: queries made prior to an admin reset are excluded.
 */
export function evaluateTodayQuotaUsage(logs = [], quotaConfig = getQuotaConfig(), refDate = new Date()) {
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();
  const todayStr = refDate.toISOString().slice(0, 10);

  const { dailyMessageLimit, dailyTokenLimit } = quotaConfig;
  const resets = getEmployeeQuotaResets();
  const globalResetAt = typeof localStorage !== 'undefined' ? localStorage.getItem('tgh_global_quota_reset_at') : null;
  const globalResetTime = globalResetAt ? new Date(globalResetAt).getTime() : 0;

  // 1. Group today's logs by employee
  const employeeUsage = {};

  logs.forEach((log) => {
    const d = new Date(log.createdAt);
    if (d.getFullYear() === refYear && d.getMonth() === refMonth && d.getDate() === refDay) {
      const name = (log.name || log.NAME || log.user_name || log.EmployeeName || 'Unknown Employee').trim();
      const email = log.user_email || log.EMAIL || log.email || `${name.toLowerCase().replace(/\s+/g, '.')}@techygeekhub.com`;
      const logTime = d.getTime();

      // Ensure employee record always exists so it displays in telemetry table even if count is 0
      if (!employeeUsage[name]) {
        employeeUsage[name] = {
          name,
          email,
          todayQueries: 0,
          todayTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          lastQueryTime: log.createdAt,
          rawTotalQueries: 0,
        };
      }

      employeeUsage[name].rawTotalQueries++;

      // Check global admin reset: ignore logs that occurred prior to global reset
      if (globalResetTime && logTime <= globalResetTime) return;

      // Check per-employee admin reset: ignore logs that occurred prior to reset
      const empReset = resets[name.toLowerCase()];
      if (empReset) {
        const empResetTime = empReset.resetTimestamp || new Date(empReset.resetAt).getTime();
        if (logTime <= empResetTime) return;
      }

      employeeUsage[name].todayQueries++;
      const rowTokens = log.totalTokens || ((log.promptTokens || 0) + (log.completionTokens || 0)) || 0;
      employeeUsage[name].todayTokens += rowTokens;
      employeeUsage[name].promptTokens += (log.promptTokens || 0);
      employeeUsage[name].completionTokens += (log.completionTokens || 0);
    }
  });

  // 2. Evaluate limits for each active employee
  const results = Object.values(employeeUsage).map((emp) => {
    const queryPct = dailyMessageLimit > 0 ? Math.round((emp.todayQueries / dailyMessageLimit) * 100) : 0;
    const tokenPct = dailyTokenLimit > 0 ? Math.round((emp.todayTokens / dailyTokenLimit) * 100) : 0;

    const queryExceeded = emp.todayQueries > dailyMessageLimit;
    const tokenExceeded = emp.todayTokens > dailyTokenLimit;
    const isExceeded = queryExceeded || tokenExceeded;

    let exceededMetric = 'none';
    if (queryExceeded && tokenExceeded) exceededMetric = 'both';
    else if (queryExceeded) exceededMetric = 'queries';
    else if (tokenExceeded) exceededMetric = 'tokens';

    const isNearLimit = !isExceeded && (queryPct >= 80 || tokenPct >= 80);
    const empReset = resets[emp.name.toLowerCase()];
    const wasReset = Boolean(empReset || globalResetTime > 0);

    return {
      ...emp,
      dateStr: todayStr,
      queryLimit: dailyMessageLimit,
      tokenLimit: dailyTokenLimit,
      queryPercentage: queryPct,
      tokenPercentage: tokenPct,
      queryExceeded,
      tokenExceeded,
      isExceeded,
      isNearLimit,
      exceededMetric,
      wasResetToday: wasReset,
      resetAt: empReset?.resetAt || globalResetAt || null,
      status: wasReset && !isExceeded ? 'Reset by Admin' : isExceeded ? 'Exceeded' : isNearLimit ? 'Near Limit' : 'Normal',
    };
  });

  return results.sort((a, b) => b.todayTokens - a.todayTokens);
}

// In-flight guard to prevent duplicate concurrent dispatches during async network requests
const inFlightQuotaAlerts = new Set();

/**
 * Checks all employees' today usage and fires automatic alerts for breaches.
 * Respects the admin-configured alertIntervalHours (e.g. 6 hours or 12 hours) cooldown.
 */
export async function checkAndDispatchQuotaAlerts(logs = [], quotaConfig = getQuotaConfig()) {
  if (!quotaConfig.alertsEnabled) return [];

  const todayUsage = evaluateTodayQuotaUsage(logs, quotaConfig);
  const newlyTriggeredAlerts = [];
  const intervalHours = quotaConfig.alertIntervalHours || 6;

  for (const emp of todayUsage) {
    if (emp.isExceeded) {
      const lockKey = `${emp.name}_${emp.dateStr}`.toLowerCase();
      
      // Cooldown check: if an alert was already sent within the last X hours (6h / 12h), skip!
      if (isAlertInCooldown(emp.name, intervalHours) || inFlightQuotaAlerts.has(lockKey)) {
        continue;
      }

      // Lock immediately and record sent timestamp
      inFlightQuotaAlerts.add(lockKey);
      markAlertSent(emp.name);

      try {
        await dispatchTeamsQuotaAlert({
          employeeName: emp.name,
          employeeEmail: emp.email,
          todayQueries: emp.todayQueries,
          queryLimit: emp.queryLimit,
          queryPercentage: emp.queryPercentage,
          todayTokens: emp.todayTokens,
          tokenLimit: emp.tokenLimit,
          tokenPercentage: emp.tokenPercentage,
          exceededMetric: emp.exceededMetric,
          dateStr: emp.dateStr,
        }, quotaConfig.teamsWebhookUrl);

        newlyTriggeredAlerts.push(emp);
        console.log(`[QUOTA ALERT] Dispatched Teams notification to n8n for ${emp.name} (${emp.exceededMetric}, cooldown: ${intervalHours}h)`);
      } catch (err) {
        console.error(`[QUOTA ALERT ERROR] Failed to dispatch alert for ${emp.name}:`, err.message);
      } finally {
        inFlightQuotaAlerts.delete(lockKey);
      }
    }
  }

  return newlyTriggeredAlerts;
}
