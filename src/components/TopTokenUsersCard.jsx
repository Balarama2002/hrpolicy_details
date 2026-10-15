import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Cpu, 
  TrendingUp, 
  User, 
  Zap, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Users,
  Filter
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function TopTokenUsersCard({ employeeStats = [], totalOrgTokens = 0 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'zero'
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const activeEmployees = useMemo(() => {
    return employeeStats.filter(e => (e.totalTokens || 0) > 0);
  }, [employeeStats]);

  const zeroEmployees = useMemo(() => {
    return employeeStats.filter(e => (e.totalTokens || 0) === 0);
  }, [employeeStats]);

  const topUser = activeEmployees.length > 0 ? activeEmployees[0] : null;

  // Filtered employees by search and category
  const filteredEmployees = useMemo(() => {
    return employeeStats.filter(emp => {
      // Category filter
      if (filterType === 'active' && (emp.totalTokens || 0) === 0) return false;
      if (filterType === 'zero' && (emp.totalTokens || 0) > 0) return false;

      // Text search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (emp.name || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [employeeStats, filterType, searchTerm]);

  // Pagination calculation
  const totalItems = filteredEmployees.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 'all') return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors duration-200">
      
      {/* 1. Box Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Employee Token Consumption
            </h3>
            <InfoTooltip 
              title="Employee Token Consumption"
              description="Displays token consumption for all employees in the organization (150 employees). Ranks them by total AI tokens consumed and calculates percentage share."
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete directory of employees with AI token volume, queries asked, and % share of organization total
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-lg font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Total: {(totalOrgTokens || 0).toLocaleString()} Tokens
          </span>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-semibold">
            {employeeStats.length} Employees
          </span>
        </div>
      </div>

      {/* 2. Top Consumer Spotlight Banner (if active queries exist) */}
      {topUser && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30 font-extrabold text-base shrink-0">
              #1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {topUser.name}
                </span>
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Highest Consumer
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{topUser.queryCount || 0} {(topUser.queryCount === 1) ? 'search' : 'searches'}</span>
                <span>•</span>
                <span>Prompt: {(topUser.promptTokens || 0).toLocaleString()}</span>
                <span>•</span>
                <span>Completion: {(topUser.completionTokens || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:border-l sm:border-amber-500/20 sm:pl-4">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {topUser.percentage ?? 0}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Share of Org Tokens
              </div>
            </div>

            <div className="text-right">
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                {(topUser.totalTokens || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                ${(topUser.cost || 0).toFixed(4)} USD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => { setFilterType('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Employees ({employeeStats.length})
          </button>
          <button
            onClick={() => { setFilterType('active'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'active'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Active Consumers ({activeEmployees.length})
          </button>
          <button
            onClick={() => { setFilterType('zero'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'zero'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Zero Usage ({zeroEmployees.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. Complete Employee Table */}
      <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Rank</th>
              <th className="py-2.5 px-3">Employee Name</th>
              <th className="py-2.5 px-3">Queries</th>
              <th className="py-2.5 px-3">Tokens (Prompt / Out)</th>
              <th className="py-2.5 px-3">Total Tokens</th>
              <th className="py-2.5 px-3 w-36">Share of Total (%)</th>
              <th className="py-2.5 px-3 text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                  No employees found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp, idx) => {
                const globalIndex = pageSize === 'all' 
                  ? idx 
                  : (currentPage - 1) * pageSize + idx;
                const rank = globalIndex + 1;
                const hasTokens = (emp.totalTokens || 0) > 0;
                const isFirst = rank === 1 && hasTokens;

                return (
                  <tr 
                    key={emp.name + '-' + idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-bold font-mono">
                      {isFirst ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 items-center justify-center text-xs">
                          🥇
                        </span>
                      ) : rank === 2 && hasTokens ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 items-center justify-center text-xs">
                          🥈
                        </span>
                      ) : rank === 3 && hasTokens ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 items-center justify-center text-xs">
                          🥉
                        </span>
                      ) : hasTokens ? (
                        <span className="text-slate-500 font-semibold">{rank}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          hasTokens 
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {(emp.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                      {emp.queryCount || 0}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {hasTokens ? (
                        <>
                          <span className="text-blue-600 dark:text-blue-400">{(emp.promptTokens || 0).toLocaleString()}</span>
                          <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
                          <span className="text-purple-600 dark:text-purple-400">{(emp.completionTokens || 0).toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">0 / 0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {(emp.totalTokens || 0).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={`font-bold ${hasTokens ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                            {emp.percentage ?? 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFirst 
                                ? 'bg-amber-500' 
                                : rank <= 3 && hasTokens
                                ? 'bg-blue-500' 
                                : hasTokens
                                ? 'bg-indigo-400'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${Math.min(100, emp.percentage ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ${(emp.cost || 0).toFixed(4)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value="all">All ({totalItems})</option>
          </select>
          <span>
            Showing {totalItems === 0 ? 0 : pageSize === 'all' ? totalItems : `${Math.min((currentPage - 1) * pageSize + 1, totalItems)} - ${Math.min(currentPage * pageSize, totalItems)}`} of {totalItems}
          </span>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
