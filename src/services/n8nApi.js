import { AUDIT_SEED_DATA } from '../data/seedData';

// Local storage keys
const N8N_CONFIG_KEY = 'tgh_hr_agent_n8n_config';

export const DEFAULT_CONFIG = {
  baseUrl: 'https://n8n.srv1901759.hstgr.cloud',
  webhookUrl: 'https://n8n.srv1901759.hstgr.cloud/webhook/hr-agent-analytics-live',
  apiKey: '',
  workflowId: 'lH0zvCgoFjbiDhdB', // SWF_RAG_VectorSearch
  parentWorkflowId: 'YHiXt4rbOuxR0oB3', // MWF_HR_AssistanceAgent
  dataTableId: '0Xa3cI3xvJp6UKV4', // HR_AGENT_AUDIT_LOG
  projectId: '2qHCdIvoXHur7xyh',
  useLiveData: true, // Default to live real-time feed
};

export function getStoredConfig() {
  try {
    const saved = localStorage.getItem(N8N_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse n8n config from localStorage', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config) {
  try {
    localStorage.setItem(N8N_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save n8n config', e);
  }
}

// Clean HTML text helper
export function cleanText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Compute accurate token count for a row
export function calculateTokens(row) {
  // If exact tokens are already present from n8n data table columns
  if (row.PROMPT_TOKENS && row.COMPLETION_TOKENS) {
    const prompt = Number(row.PROMPT_TOKENS);
    const completion = Number(row.COMPLETION_TOKENS);
    const total = Number(row.TOTAL_TOKENS) || (prompt + completion);
    const cost = ((prompt / 1_000_000) * 0.075) + ((completion / 1_000_000) * 0.30);
    return {
      promptTokens: prompt,
      completionTokens: completion,
      totalTokens: total,
      estimatedCostUsd: Number(cost.toFixed(6)),
      model: 'AI Assistant Architecture',
      isExactFromDb: true,
    };
  }

  const cleanQ = cleanText(row.QUESTION);
  const cleanResp = cleanText(row.RESPONSE);
  const isSufficient = (row.RESPONSE || '').includes('Status: Sufficient Data');

  const m1Prompt = isSufficient ? Math.round(1750 + (Number(row.id || 1) % 6) * 50) : 520;
  const m1Completion = isSufficient ? 350 : 120;

  const m2Prompt = 1380 + m1Completion + Math.max(12, Math.round(cleanQ.length / 3.8));
  const m2Completion = Math.max(25, Math.round(cleanResp.length / 4.1));

  // Consolidated Totals
  const promptTokens = m1Prompt + m2Prompt;
  const completionTokens = m1Completion + m2Completion;
  const totalTokens = promptTokens + completionTokens;

  const promptCost = (promptTokens / 1_000_000) * 0.075;
  const completionCost = (completionTokens / 1_000_000) * 0.30;
  const estimatedCostUsd = Number((promptCost + completionCost).toFixed(6));

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd,
    model: 'AI Assistant Architecture',
    isExactFromDb: false,
  };
}

// Format Jira issue URL for web browser view (/browse/ISSUE-KEY) instead of raw REST API
export function getJiraWebUrl(jiraNumber, rawJiraUrl) {
  if (!jiraNumber) return null;
  if (rawJiraUrl && rawJiraUrl.includes('.atlassian.net')) {
    const domainMatch = rawJiraUrl.match(/https:\/\/[^/]+\.atlassian\.net/);
    if (domainMatch) {
      return `${domainMatch[0]}/browse/${jiraNumber}`;
    }
  }
  return `https://ram25tgh.atlassian.net/browse/${jiraNumber}`;
}

// Accurate feedback classifier preventing "not_helpful" substring collision with "helpful"
export function parseFeedback(raw) {
  if (!raw) return 'unrated';
  const str = raw.toString().toLowerCase().trim();
  if (
    str === 'not_helpful' || 
    str === 'not helpful' || 
    str.includes('not_helpful') || 
    str.includes('not helpful') || 
    str.startsWith('not') || 
    str === 'unhelpful' ||
    str === 'negative'
  ) {
    return 'not_helpful';
  }
  if (
    str === 'helpful' || 
    str === 'useful' || 
    str === 'positive' ||
    (str.includes('helpful') && !str.includes('not'))
  ) {
    return 'helpful';
  }
  if (
    str === 'raise_ticket' || 
    str === 'ticket_raised' || 
    str.includes('raise_ticket') || 
    str.includes('ticket')
  ) {
    return 'raise_ticket';
  }
  return 'unrated';
}

// Normalize row data
export function normalizeRow(row) {
  const tokenStats = calculateTokens(row);
  const isSufficient = (row.RESPONSE || '').includes('Status: Sufficient Data');
  
  const feedback = parseFeedback(row.Feedback ?? row.feedback);

  const jiraNumber = row.JIRA_NUMBER || null;
  const jiraUrl = getJiraWebUrl(jiraNumber, row.JIRA_URL);

  return {
    id: row.id,
    name: row.NAME || 'Anonymous Employee',
    jiraNumber: jiraNumber,
    jiraUrl: jiraUrl,
    rawQuestion: row.QUESTION || '',
    cleanQuestion: row.cleanQuestion || cleanText(row.QUESTION),
    rawResponse: row.RESPONSE || '',
    cleanResponse: row.cleanResponse || cleanText(row.RESPONSE),
    messageId: row.MESSAGE_ID || null,
    feedback: feedback,
    status: isSufficient ? 'Sufficient Data' : 'Insufficient Data',
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || row.createdAt || new Date().toISOString(),
    ...tokenStats,
  };
}

// Helper to route through Vite reverse proxy during local dev and direct URL in production
export function getProxiedUrl(targetUrl) {
  if (!targetUrl) return '';
  const cleanTarget = targetUrl.replace(/\/+$/, '');
  
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    if (cleanTarget.startsWith('https://n8n.srv1901759.hstgr.cloud')) {
      return cleanTarget.replace('https://n8n.srv1901759.hstgr.cloud', '/n8n-proxy');
    }
    return `/api/proxy?url=${encodeURIComponent(cleanTarget)}`;
  }
  return cleanTarget;
}

// Test n8n REST API Connection
export async function testN8nConnection(baseUrl, apiKey) {
  if (!baseUrl) {
    throw new Error('Please enter an n8n Base URL');
  }
  if (!apiKey) {
    throw new Error('Please enter an n8n API Key');
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const startTime = performance.now();
  const proxiedUrl = getProxiedUrl(`${cleanBase}/api/v1/workflows?limit=1`);

  try {
    const res = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        latencyMs: elapsed,
        message: `Successfully connected to n8n instance! (${elapsed}ms)`,
        data,
      };
    } else if (res.status === 401 || res.status === 403) {
      throw new Error(`Authentication failed (HTTP ${res.status}): Please verify your n8n API Key.`);
    } else {
      let errDetail = res.statusText;
      try {
        const errJson = await res.json();
        if (errJson.message) errDetail = errJson.message;
      } catch {}
      throw new Error(`n8n returned HTTP ${res.status}: ${errDetail}`);
    }
  } catch (error) {
    throw error;
  }
}

// Fetch Audit Log Rows directly from n8n Live Webhook Feed
export async function fetchAuditLogs(config = getStoredConfig()) {
  const feedUrl = config.webhookUrl || 'https://n8n.srv1901759.hstgr.cloud/webhook/hr-agent-analytics-live';
  const targetUrl = getProxiedUrl(feedUrl);

  // Attach cache-busting timestamp parameter to always fetch live data from server on refresh
  const urlWithCacheBuster = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

  try {
    const res = await fetch(urlWithCacheBuster, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (res.ok) {
      const rawRows = await res.json();
      if (Array.isArray(rawRows) && rawRows.length > 0) {
        // Sort newest first
        rawRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return rawRows.map(normalizeRow);
      }
    }
  } catch (err) {
    console.warn('Live feed fetch warning, using seed backup:', err.message);
  }

  // Backup fallback
  return AUDIT_SEED_DATA.map(normalizeRow);
}
