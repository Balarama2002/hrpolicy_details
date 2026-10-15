import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  Ticket, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Cpu, 
  ChevronLeft, 
  ChevronRight,
  Download
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function AuditLogTable({ logs = [], onSelectRow }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = (log.name || '').toLowerCase().includes(q);
        const matchesQuestion = (log.cleanQuestion || '').toLowerCase().includes(q);
        const matchesJira = (log.jiraNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesQuestion && !matchesJira) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (log.status !== statusFilter) return false;
      }

      // Feedback filter
      if (feedbackFilter !== 'all') {
        if (log.feedback !== feedbackFilter) return false;
      }

      return true;
    });
  }, [logs, searchTerm, statusFilter, feedbackFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) return;
    const headers = ['ID', 'Date', 'Employee', 'Question', 'Status', 'Feedback', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Est Cost USD', 'JIRA'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(r => [
        r.id,
        `"${new Date(r.createdAt).toISOString()}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.cleanQuestion.replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${r.feedback}"`,
        r.promptTokens,
        r.completionTokens,
        r.totalTokens,
        r.estimatedCostUsd,
        `"${r.jiraNumber || ''}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hr_agent_searches_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg overflow-hidden transition-colors duration-200">
      
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Query & Execution Audit Log</span>
            <span className="text-xs font-mono font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {filteredLogs.length} queries
            </span>
            <InfoTooltip 
              title="Execution & Query Audit Log"
              description="Detailed record of all employee queries received, including resolution status, user feedback, tickets raised, and token breakdown."
            />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time feed of employee queries with status, feedback, and token usage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question, employee, JIRA..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Sufficient Data">Sufficient Data (Resolved)</option>
            <option value="Insufficient Data">Insufficient Data (Ticket)</option>
          </select>

          {/* Feedback Filter */}
          <select
            value={feedbackFilter}
            onChange={(e) => {
              setFeedbackFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Feedback</option>
            <option value="helpful">Helpful 👍</option>
            <option value="not_helpful">Not Helpful 👎</option>
            <option value="raise_ticket">Ticket Requested 🎟️</option>
            <option value="unrated">Unrated</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Query / Question</th>
              <th className="py-3 px-4">RAG Status</th>
              <th className="py-3 px-4">Feedback</th>
              <th className="py-3 px-4">Tokens (In / Out / Total)</th>
              <th className="py-3 px-4">Jira Ticket</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No matching audit queries found.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isSufficient = log.status === 'Sufficient Data';

                return (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectRow(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {formatTimestamp(log.createdAt)}
                    </td>

                    {/* Employee */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {log.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{log.name}</span>
                      </div>
                    </td>

                    {/* Question */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md truncate" title={log.cleanQuestion}>
                      <span className="text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {log.cleanQuestion || '(Empty or greeting)'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        isSufficient
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                      }`}>
                        {isSufficient ? (
                          <CheckCircle2 className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    {/* Feedback */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.feedback === 'helpful' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </span>
                      )}
                      {log.feedback === 'not_helpful' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          <ThumbsDown className="w-3 h-3" /> Not Helpful
                        </span>
                      )}
                      {log.feedback === 'raise_ticket' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <Ticket className="w-3 h-3" /> Ticket Req
                        </span>
                      )}
                      {log.feedback === 'unrated' && (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                          Unrated
                        </span>
                      )}
                    </td>

                    {/* Token Breakdown */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <span className="text-blue-600 dark:text-blue-400 font-medium" title="Prompt Tokens">
                            {log.promptTokens.toLocaleString()}
                          </span>
                          <span className="text-slate-400 dark:text-slate-600">/</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium" title="Output Tokens">
                            {log.completionTokens.toLocaleString()}
                          </span>
                          <span className="text-slate-400 dark:text-slate-600">/</span>
                          <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded" title="Total Tokens">
                            {log.totalTokens.toLocaleString()}
                          </span>
                        </div>
                        {log.isExactFromDb && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-sans font-semibold">
                            API
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Jira Ticket */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.jiraNumber ? (
                        <a
                          href={log.jiraUrl && log.jiraUrl.includes('/browse/') ? log.jiraUrl : `https://ram25tgh.atlassian.net/browse/${log.jiraNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:border-amber-400/40 transition-colors"
                        >
                          <span>{log.jiraNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(log);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Inspect full query & response"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">
            {filteredLogs.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
          </span> to <span className="font-semibold text-slate-800 dark:text-slate-200">
            {Math.min(currentPage * rowsPerPage, filteredLogs.length)}
          </span> of <span className="font-semibold text-slate-800 dark:text-slate-200">
            {filteredLogs.length}
          </span> queries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
