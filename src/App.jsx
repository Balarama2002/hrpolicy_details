import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import TimeFilter from './components/TimeFilter';
import KpiCards from './components/KpiCards';
import SearchTrendChart from './components/SearchTrendChart';
import TokenAnalyticsChart from './components/TokenAnalyticsChart';
import ResolutionPieChart from './components/ResolutionPieChart';
import TopTokenUsersCard from './components/TopTokenUsersCard';
import AuditLogTable from './components/AuditLogTable';
import QueryDetailModal from './components/QueryDetailModal';
import TokenAccuracyExplainer from './components/TokenAccuracyExplainer';
import { 
  getStoredConfig, 
  saveConfig, 
  fetchAuditLogs, 
  testN8nConnection,
  parseFeedback,
} from './services/n8nApi';
import { EMPLOYEE_DIRECTORY } from './data/employeeDirectory';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ForceResetPasswordModal from './components/auth/ForceResetPasswordModal';
import AdminPortalModal from './components/admin/AdminPortalModal';
import UserQuotaIndicator from './components/UserQuotaIndicator';
import { checkAndDispatchQuotaAlerts, getQuotaConfig, syncQuotaConfigFromServer, evaluateUserDailyQuota } from './services/quotaService';
import { Bot, Loader2, Code2, Users, Bell, AlertTriangle, RotateCcw, X } from 'lucide-react';

export default function App() {
  const { isAuthenticated, user, isAdmin, mustResetPassword, isLoading: isAuthLoading } = useAuth();
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [proactiveAlertNotice, setProactiveAlertNotice] = useState('');
  const [quotaTick, setQuotaTick] = useState(0);
  const [config, setConfig] = useState(getStoredConfig());
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [timePreset, setTimePreset] = useState('all'); // 'today' | '7d' | 'month' | 'year' | 'all'
  const [dateRange, setDateRange] = useState({ from: '', to: '' }); // Full calendar From & To date filter
  const [selectedLog, setSelectedLog] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTokenHelpOpen, setIsTokenHelpOpen] = useState(false);

  // Theme Management (Light / Dark)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('tgh_hr_theme');
      if (saved) return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('tgh_hr_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load audit data (silent background polling every 8s)
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const data = await fetchAuditLogs(config);
      setLogs(data);

      // Synchronize latest quota limits and resets from database
      syncQuotaConfigFromServer().then(() => setQuotaTick(t => t + 1)).catch(() => {});

      // Proactively check for daily message/token limit breaches & trigger Teams alerts
      checkAndDispatchQuotaAlerts(data).then((triggered) => {
        if (triggered && triggered.length > 0) {
          const names = triggered.map(t => t.name).join(', ');
          setProactiveAlertNotice(`⚠️ Teams Alert Sent: ${names} exceeded daily limits today. Check Admin Portal.`);
        }
      }).catch(() => {});

      if (config.apiKey && config.baseUrl) {
        try {
          await testN8nConnection(config.baseUrl, config.apiKey);
          setIsConnected(true);
        } catch {
          setIsConnected(false);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-poll every 8 seconds if live connection or user enabled
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [config]);

  // Listen for Admin Quota Resets in real time
  useEffect(() => {
    const handleResetUpdate = () => {
      setQuotaTick(t => t + 1);
    };
    window.addEventListener('quota_reset_updated', handleResetUpdate);
    return () => window.removeEventListener('quota_reset_updated', handleResetUpdate);
  }, []);

  // Reference Date: Always use the real current date (today) for presets,
  // or the explicitly selected single date if a single-day custom filter is active.
  const referenceDate = useMemo(() => {
    if (dateRange.from && dateRange.from === dateRange.to) {
      const d = new Date(dateRange.from);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [dateRange.from, dateRange.to]);

  // 1. Role-Based Access Control (RBAC) Scoping:
  // - Administrator: Sees complete organization data across all employees
  // - Technical / Member: Sees strictly the queries and tokens utilized by themselves
  const userScopedLogs = useMemo(() => {
    if (isAdmin) return logs;
    const userFullName = (user?.full_name || user?.user_metadata?.full_name || user?.name || '').trim().toLowerCase();
    const userEmail = (user?.email || '').trim().toLowerCase();
    const usernamePart = userEmail.split('@')[0].toLowerCase();
    
    // Split user's name into word tokens (e.g. "Hanish Thatikonda" -> ["hanish", "thatikonda"])
    const userParts = userFullName ? userFullName.split(/\s+/).filter(p => p.length >= 3) : [];

    return logs.filter((item) => {
      const logName = (item.name || item.user_name || item.NAME || item.EmployeeName || '').trim().toLowerCase();
      const logEmail = (item.user_email || item.EMAIL || item.email || '').trim().toLowerCase();

      // 1. Exact or substring match on full name
      if (userFullName && logName) {
        if (logName.includes(userFullName) || userFullName.includes(logName)) return true;
        // Check if individual first/last name matches (e.g. "hanish" in "hanish thatikonda")
        if (userParts.some(part => logName.includes(part))) return true;
      }

      // 2. Direct corporate email match
      if (userEmail && logEmail && logEmail === userEmail) return true;

      // 3. Username prefix match (e.g. "hanish" from "hanish@techygeekhub.com" matches "Hanish Thatikonda")
      if (usernamePart && logName) {
        if (logName.includes(usernamePart) || usernamePart.includes(logName)) return true;
      }

      return false;
    });
  }, [logs, isAdmin, user]);

  // Filter logs by preset or full calendar date range
  const filteredLogs = useMemo(() => {
    if (!userScopedLogs.length) return [];

    // Full calendar From & To date range filter takes priority if active
    if (dateRange.from || dateRange.to) {
      return userScopedLogs.filter((item) => {
        const itemDateStr = new Date(item.createdAt).toISOString().slice(0, 10);
        if (dateRange.from && dateRange.to) {
          return itemDateStr >= dateRange.from && itemDateStr <= dateRange.to;
        }
        if (dateRange.from) {
          return itemDateStr >= dateRange.from;
        }
        if (dateRange.to) {
          return itemDateStr <= dateRange.to;
        }
        return true;
      });
    }

    if (timePreset === 'all') return userScopedLogs;

    const ref = referenceDate;
    const refYear = ref.getFullYear();
    const refMonth = ref.getMonth();
    const refDate = ref.getDate();

    return userScopedLogs.filter((item) => {
      const d = new Date(item.createdAt);
      const itemYear = d.getFullYear();
      const itemMonth = d.getMonth();
      const itemDate = d.getDate();

      if (timePreset === 'today') {
        return itemYear === refYear && itemMonth === refMonth && itemDate === refDate;
      }
      if (timePreset === '7d') {
        const diffDays = (ref - d) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timePreset === 'month') {
        return itemYear === refYear && itemMonth === refMonth;
      }
      if (timePreset === 'year') {
        return itemYear === refYear;
      }
      return true;
    });
  }, [userScopedLogs, timePreset, dateRange, referenceDate]);

  // Counts for all presets
  const countsByPreset = useMemo(() => {
    if (!userScopedLogs.length) return { today: 0, '7d': 0, month: 0, year: 0, all: 0 };
    const ref = referenceDate;
    const refYear = ref.getFullYear();
    const refMonth = ref.getMonth();
    const refDate = ref.getDate();

    let today = 0, d7 = 0, month = 0, year = 0;

    userScopedLogs.forEach((item) => {
      const d = new Date(item.createdAt);
      const itemYear = d.getFullYear();
      const itemMonth = d.getMonth();
      const itemDate = d.getDate();

      if (itemYear === refYear && itemMonth === refMonth && itemDate === refDate) {
        today++;
      }
      const diffDays = (ref - d) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) {
        d7++;
      }
      if (itemYear === refYear && itemMonth === refMonth) {
        month++;
      }
      if (itemYear === refYear) {
        year++;
      }
    });

    return {
      today,
      '7d': d7,
      month,
      year,
      all: logs.length,
    };
  }, [logs, referenceDate]);

  // Compute Employee Token Stats & Top Token Consumer across all 150 employees from Employee Details
  const employeeStats = useMemo(() => {
    const directoryMap = new Map();

    // 1. Seed with all employees from Employee Details directory
    EMPLOYEE_DIRECTORY.forEach((emp) => {
      if (!emp.EmployeeName) return;
      const cleanName = emp.EmployeeName.trim();
      const key = cleanName.toLowerCase();
      if (!directoryMap.has(key)) {
        directoryMap.set(key, {
          name: cleanName,
          manager: emp.ManagerName || 'N/A',
          queryCount: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
        });
      }
    });

    let totalOrgTokens = 0;

    // 2. Aggregate actual query logs into directory records
    filteredLogs.forEach((item) => {
      const rawName = (item.name || 'Anonymous Employee').trim();
      const key = rawName.toLowerCase();
      let empRecord = directoryMap.get(key);
      if (!empRecord) {
        empRecord = {
          name: rawName,
          manager: 'N/A',
          queryCount: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
        };
        directoryMap.set(key, empRecord);
      }

      empRecord.queryCount++;
      empRecord.promptTokens += (item.promptTokens || 0);
      empRecord.completionTokens += (item.completionTokens || 0);
      const rowTotal = item.totalTokens || ((item.promptTokens || 0) + (item.completionTokens || 0));
      empRecord.totalTokens += rowTotal;
      empRecord.cost += (item.estimatedCostUsd || 0);
      totalOrgTokens += rowTotal;
    });

    // 3. Compute percentage share of organization tokens
    const list = Array.from(directoryMap.values());
    list.forEach((emp) => {
      emp.percentage = totalOrgTokens > 0 
        ? Number(((emp.totalTokens / totalOrgTokens) * 100).toFixed(1)) 
        : 0;
    });

    // 4. Sort: Highest token consumers first, then query count, then alphabetically
    list.sort((a, b) => {
      if (b.totalTokens !== a.totalTokens) return b.totalTokens - a.totalTokens;
      if (b.queryCount !== a.queryCount) return b.queryCount - a.queryCount;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [filteredLogs]);

  const topConsumer = employeeStats.find(e => e.totalTokens > 0) || null;

  // Aggregate Stats for KPI Cards
  const stats = useMemo(() => {
    let helpfulCount = 0;
    let notHelpfulCount = 0;
    let raiseTicketCount = 0;
    let unratedCount = 0;
    let sufficientCount = 0;
    let insufficientCount = 0;
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCost = 0;

    filteredLogs.forEach((l) => {
      const fb = parseFeedback(l.feedback || l.Feedback);
      const hasTicket = Boolean(l.jiraNumber || l.jiraUrl || l.JIRA_NUMBER || l.JIRA_URL || fb === 'raise_ticket');

      if (fb === 'helpful') helpfulCount++;
      else if (fb === 'not_helpful') notHelpfulCount++;

      if (hasTicket && fb !== 'helpful') raiseTicketCount++;
      if (fb === 'unrated' && !hasTicket) unratedCount++;

      if (l.status === 'Sufficient Data' && !hasTicket) sufficientCount++;
      else insufficientCount++;

      totalTokens += (l.totalTokens || 0);
      promptTokens += (l.promptTokens || 0);
      completionTokens += (l.completionTokens || 0);
      totalCost += (l.estimatedCostUsd || 0);
    });

    const totalSearches = filteredLogs.length;
    const avgTokens = totalSearches > 0 ? Math.round(totalTokens / totalSearches) : 0;

    return {
      totalSearches,
      helpfulCount,
      notHelpfulCount,
      raiseTicketCount,
      unratedCount,
      sufficientCount,
      insufficientCount,
      totalTokens,
      promptTokens,
      completionTokens,
      avgTokens,
      totalCost,
      topConsumer,
    };
  }, [filteredLogs, topConsumer]);

  // Time Series Chart Data (Grouped by hour for 'today' or single date, or by date for 7d, month, year, all)
  const chartData = useMemo(() => {
    if (!filteredLogs.length) return [];

    const isSingleDay = timePreset === 'today' || (Boolean(dateRange?.from) && dateRange?.from === dateRange?.to);
    const is7d = timePreset === '7d' && !dateRange?.from && !dateRange?.to;
    const isMonth = timePreset === 'month' && !dateRange?.from && !dateRange?.to;

    if (isSingleDay) {
      // 1. Group by hour of the day to produce a meaningful chronological trend across the day
      const hoursMap = {};
      filteredLogs.forEach((item) => {
        const d = new Date(item.createdAt);
        const hour = d.getHours(); // 0 to 23
        if (!hoursMap[hour]) hoursMap[hour] = [];
        hoursMap[hour].push(item);
      });

      // Find active hours
      const activeHours = Object.keys(hoursMap).map(Number).sort((a, b) => a - b);
      let minHour = activeHours.length > 0 ? Math.min(...activeHours) : 9;
      let maxHour = activeHours.length > 0 ? Math.max(...activeHours) : 18;

      // Expand slightly to create a continuous realistic timeline curve
      minHour = Math.max(0, Math.min(minHour - 1, 8));
      maxHour = Math.min(23, Math.max(maxHour + 1, 19));

      const grouped = {};
      for (let h = minHour; h <= maxHour; h++) {
        const temp = new Date(referenceDate);
        temp.setHours(h, 0, 0, 0);
        const hourLabel = temp.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
        });

        grouped[hourLabel] = {
          date: hourLabel,
          timestamp: h,
          total: 0,
          helpful: 0,
          notHelpful: 0,
          raiseTicket: 0,
          unrated: 0,
          sufficient: 0,
          insufficient: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
        };

        const itemsInHour = hoursMap[h] || [];
        itemsInHour.forEach((item) => {
          grouped[hourLabel].total++;
          const fb = parseFeedback(item.feedback || item.Feedback);
          const hasTicket = Boolean(item.jiraNumber || item.jiraUrl || item.JIRA_NUMBER || item.JIRA_URL || fb === 'raise_ticket');

          if (fb === 'helpful') {
            grouped[hourLabel].helpful++;
          }
          if (fb === 'not_helpful') {
            grouped[hourLabel].notHelpful++;
          }
          if (hasTicket && fb !== 'helpful') {
            grouped[hourLabel].raiseTicket++;
          }
          if (fb === 'unrated' && !hasTicket) {
            grouped[hourLabel].unrated++;
          }

          if (item.status === 'Sufficient Data') grouped[hourLabel].sufficient++;
          else grouped[hourLabel].insufficient++;

          grouped[hourLabel].promptTokens += (item.promptTokens || 0);
          grouped[hourLabel].completionTokens += (item.completionTokens || 0);
          grouped[hourLabel].cost += (item.estimatedCostUsd || 0);
        });
      }

      return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
    } else if (is7d) {
      // 2. Continuous 7-day timeline (from ref - 6 days through ref date)
      const grouped = {};
      const ref = new Date(referenceDate);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(ref);
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        grouped[dateKey] = {
          date: dateKey,
          timestamp: d.getTime(),
          total: 0,
          helpful: 0,
          notHelpful: 0,
          raiseTicket: 0,
          unrated: 0,
          sufficient: 0,
          insufficient: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
        };
      }

      filteredLogs.forEach((item) => {
        const d = new Date(item.createdAt);
        const dateKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (grouped[dateKey]) {
          grouped[dateKey].total++;
          const fb = parseFeedback(item.feedback || item.Feedback);
          const hasTicket = Boolean(item.jiraNumber || item.jiraUrl || item.JIRA_NUMBER || item.JIRA_URL || fb === 'raise_ticket');

          if (fb === 'helpful') {
            grouped[dateKey].helpful++;
          }
          if (fb === 'not_helpful') {
            grouped[dateKey].notHelpful++;
          }
          if (hasTicket && fb !== 'helpful') {
            grouped[dateKey].raiseTicket++;
          }
          if (fb === 'unrated' && !hasTicket) {
            grouped[dateKey].unrated++;
          }

          if (item.status === 'Sufficient Data') grouped[dateKey].sufficient++;
          else grouped[dateKey].insufficient++;

          grouped[dateKey].promptTokens += (item.promptTokens || 0);
          grouped[dateKey].completionTokens += (item.completionTokens || 0);
          grouped[dateKey].cost += (item.estimatedCostUsd || 0);
        }
      });

      return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
    } else if (isMonth) {
      // 3. Continuous daily timeline for current month (from 1st of month to current day, min 7 days)
      const grouped = {};
      const ref = new Date(referenceDate);
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const currentDay = ref.getDate();
      const numDays = Math.max(currentDay, 7);

      for (let day = 1; day <= numDays; day++) {
        const d = new Date(year, month, day);
        const dateKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        grouped[dateKey] = {
          date: dateKey,
          timestamp: d.getTime(),
          total: 0,
          helpful: 0,
          notHelpful: 0,
          raiseTicket: 0,
          unrated: 0,
          sufficient: 0,
          insufficient: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
        };
      }

      filteredLogs.forEach((item) => {
        const d = new Date(item.createdAt);
        const dateKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (grouped[dateKey]) {
          grouped[dateKey].total++;
          const fb = parseFeedback(item.feedback || item.Feedback);
          const hasTicket = Boolean(item.jiraNumber || item.jiraUrl || item.JIRA_NUMBER || item.JIRA_URL || fb === 'raise_ticket');

          if (fb === 'helpful') {
            grouped[dateKey].helpful++;
          }
          if (fb === 'not_helpful') {
            grouped[dateKey].notHelpful++;
          }
          if (hasTicket && fb !== 'helpful') {
            grouped[dateKey].raiseTicket++;
          }
          if (fb === 'unrated' && !hasTicket) {
            grouped[dateKey].unrated++;
          }

          if (item.status === 'Sufficient Data') grouped[dateKey].sufficient++;
          else grouped[dateKey].insufficient++;

          grouped[dateKey].promptTokens += (item.promptTokens || 0);
          grouped[dateKey].completionTokens += (item.completionTokens || 0);
          grouped[dateKey].cost += (item.estimatedCostUsd || 0);
        }
      });

      return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
    } else {
      // 4. Group by calendar date for Year and All Time
      const grouped = {};
      filteredLogs.forEach((item) => {
        const d = new Date(item.createdAt);
        const dateKey = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            timestamp: new Date(item.createdAt).getTime(),
            total: 0,
            helpful: 0,
            notHelpful: 0,
            raiseTicket: 0,
            unrated: 0,
            sufficient: 0,
            insufficient: 0,
            promptTokens: 0,
            completionTokens: 0,
            cost: 0,
          };
        }

        grouped[dateKey].total++;
        const fb = parseFeedback(item.feedback || item.Feedback);
        const hasTicket = Boolean(item.jiraNumber || item.jiraUrl || item.JIRA_NUMBER || item.JIRA_URL || fb === 'raise_ticket');

        if (fb === 'helpful') {
          grouped[dateKey].helpful++;
        }
        if (fb === 'not_helpful') {
          grouped[dateKey].notHelpful++;
        }
        if (hasTicket && fb !== 'helpful') {
          grouped[dateKey].raiseTicket++;
        }
        if (fb === 'unrated' && !hasTicket) {
          grouped[dateKey].unrated++;
        }

        if (item.status === 'Sufficient Data') grouped[dateKey].sufficient++;
        else grouped[dateKey].insufficient++;

        grouped[dateKey].promptTokens += (item.promptTokens || 0);
        grouped[dateKey].completionTokens += (item.completionTokens || 0);
        grouped[dateKey].cost += (item.estimatedCostUsd || 0);
      });

      const resultList = Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);

      // If only 1 day has activity (e.g. personal technical role data), pad adjacent days so AreaChart renders a smooth peak
      if (resultList.length === 1) {
        const singlePoint = resultList[0];
        const centerDate = new Date(singlePoint.timestamp);

        const prevDate = new Date(centerDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevKey = prevDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const nextDate = new Date(centerDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextKey = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return [
          { date: prevKey, timestamp: prevDate.getTime(), total: 0, helpful: 0, notHelpful: 0, raiseTicket: 0, unrated: 0, sufficient: 0, insufficient: 0, promptTokens: 0, completionTokens: 0, cost: 0 },
          singlePoint,
          { date: nextKey, timestamp: nextDate.getTime(), total: 0, helpful: 0, notHelpful: 0, raiseTicket: 0, unrated: 0, sufficient: 0, insufficient: 0, promptTokens: 0, completionTokens: 0, cost: 0 },
        ];
      }

      return resultList;
    }
  }, [filteredLogs, timePreset, dateRange, referenceDate]);

  // Date summary text
  const dateRangeSummary = useMemo(() => {
    if (dateRange.from || dateRange.to) {
      if (dateRange.from && dateRange.to) {
        return `Custom: ${dateRange.from} to ${dateRange.to} (${filteredLogs.length} Queries)`;
      }
      if (dateRange.from) {
        return `From: ${dateRange.from} onward (${filteredLogs.length} Queries)`;
      }
      return `Up to: ${dateRange.to} (${filteredLogs.length} Queries)`;
    }
    if (timePreset === 'today') {
      return `Today: ${referenceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (timePreset === '7d') {
      return 'Last 7 Active Days';
    }
    if (timePreset === 'month') {
      return `${referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    if (timePreset === 'year') {
      return `Year ${referenceDate.getFullYear()}`;
    }
    return isAdmin 
      ? `All Recorded History (${logs.length} Queries)`
      : `Personal History (${userScopedLogs.length} Queries)`;
  }, [timePreset, dateRange, filteredLogs.length, referenceDate, logs.length, userScopedLogs.length, isAdmin]);

  const periodLabel = useMemo(() => {
    if (dateRange.from || dateRange.to) {
      return 'Custom Range';
    }
    if (timePreset === 'today') return 'Today';
    if (timePreset === '7d') return '7 Days';
    if (timePreset === 'month') return 'This Month';
    if (timePreset === 'year') return 'This Year';
    return 'All Time';
  }, [timePreset, dateRange]);

  const chartGranularity = (timePreset === 'today' || (dateRange.from && dateRange.from === dateRange.to)) ? 'hour' : 'day';

  // 1. Initial auth state check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20 animate-pulse">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // 2. If not authenticated, render Login / Sign Up page
  if (!isAuthenticated) {
    return <AuthPage theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. Header / Navbar with Theme Toggle & Admin Portal */}
      <Navbar
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        logs={logs}
      />

      {/* 2. Main Dashboard Content (Full Width Desktop Layout) */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 space-y-6">
        
        {/* Personal Scope Indicator for Technical Staff */}
        {!isAdmin && (() => {
          const qc = getQuotaConfig();
          const userQuota = evaluateUserDailyQuota(user, logs, qc);
          const isExceeded = userQuota.isExceeded;
          const isNear = userQuota.isNearLimit;
          const wasReset = userQuota.wasResetToday && !isExceeded;

          return (
            <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs transition-colors ${
              isExceeded 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300' 
                : isNear 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' 
                : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
            } animate-fadeIn`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  isExceeded ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 
                  isNear ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 
                  'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {isExceeded ? <AlertTriangle className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>{user?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                    {isExceeded ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                        Daily Quota Exceeded
                      </span>
                    ) : isNear ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        Near Daily Limit (85%+)
                      </span>
                    ) : wasReset ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" /> Quota Reset by Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Healthy Quota
                      </span>
                    )}
                  </div>
                  {isExceeded ? (
                    <p className="text-[11px] opacity-90 mt-0.5 text-rose-600 dark:text-rose-400 font-medium">
                      You have reached your allocated quota. Please reach out to HR for additional resources.
                    </p>
                  ) : isNear ? (
                    <p className="text-[11px] opacity-90 mt-0.5 text-amber-600 dark:text-amber-400 font-medium">
                      You are approaching your daily allocated quota (85%+ used).
                    </p>
                  ) : wasReset ? (
                    <p className="text-[11px] opacity-80 mt-0.5 text-cyan-600 dark:text-cyan-400 font-medium">
                      Your quota has been refreshed by an Administrator. Usage counter is at 0.
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-80 mt-0.5 text-slate-500 dark:text-slate-400 font-medium">
                      Personal telemetry active. Daily limits reset automatically at 12:00 AM IST.
                    </p>
                  )}
                </div>
              </div>

              {/* Usage Limit Meters & Total Filtered Queries */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <UserQuotaIndicator 
                  user={user} 
                  logs={logs} 
                  variant="banner" 
                />
                <span className={`px-3 py-2 rounded-xl border text-xs font-bold font-mono shrink-0 self-stretch sm:self-auto flex items-center justify-center ${
                  isExceeded ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400' : 
                  isNear ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400' : 
                  'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {filteredLogs.length} Questions Found
                </span>
              </div>
            </div>
          );
        })()}

        {/* Admin Proactive Quota Alert Notification Banner */}
        {isAdmin && proactiveAlertNotice && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">Teams Quota Notification Dispatched</div>
                <p className="text-[11px] opacity-90">{proactiveAlertNotice}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdminPortalOpen(true)}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition shadow-xs cursor-pointer"
              >
                Review in Admin Portal
              </button>
              <button
                type="button"
                onClick={() => setProactiveAlertNotice('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Controls: Time Presets & Calendar Date Range Picker */}
        <TimeFilter
          currentPreset={timePreset}
          onSelectPreset={(p) => {
            setDateRange({ from: '', to: '' });
            setTimePreset(p);
          }}
          countsByPreset={countsByPreset}
          dateRangeSummary={dateRangeSummary}
          totalLogsCount={userScopedLogs.length}
          dateRange={dateRange}
          onSelectDateRange={(dr) => {
            setDateRange(dr);
            if (dr.from || dr.to) {
              setTimePreset('custom_range');
            }
          }}
          theme={theme}
        />

        {/* 3. Hero Metric Cards (Including Top Token Consumer % share) */}
        <KpiCards stats={stats} periodLabel={periodLabel} logs={logs} />

        {/* 4. Search Volume & Feedback Trend Chart */}
        <SearchTrendChart 
          data={chartData} 
          granularity={chartGranularity} 
          theme={theme} 
        />

        {/* 5. Token Breakdown Chart & Resolution Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenAnalyticsChart 
            data={chartData} 
            granularity={chartGranularity} 
            theme={theme} 
          />
          <ResolutionPieChart 
            stats={stats} 
            theme={theme} 
          />
        </div>

        {/* 6. Query & Execution Audit Log Table */}
        <AuditLogTable 
          logs={filteredLogs} 
          onSelectRow={setSelectedLog} 
        />

        {/* 7. Employee Token Consumption Directory (Strictly visible to Admin only) */}
        {isAdmin && (
          <TopTokenUsersCard 
            employeeStats={employeeStats} 
            totalOrgTokens={stats.totalTokens} 
          />
        )}

      </main>

      {/* 8. Footer (Full Width) */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-4 text-center text-xs text-slate-500 transition-colors duration-200">
        <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <p>
            TGH HR Assistance Agent Analytics • Powered by n8n Workflow Automation & Google Gemini Flash
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        logs={logs}
      />
      <ForceResetPasswordModal isOpen={mustResetPassword} />
      {selectedLog && (
        <QueryDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {isTokenHelpOpen && (
        <TokenAccuracyExplainer
          onClose={() => setIsTokenHelpOpen(false)}
        />
      )}

    </div>
  );
}
