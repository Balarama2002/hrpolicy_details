import React from 'react';
import { 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  DollarSign, 
  Ticket, 
  Sparkles,
  TrendingUp,
  Zap,
  Award,
  UserCheck
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function KpiCards({ stats, periodLabel }) {
  const {
    totalSearches = 0,
    helpfulCount = 0,
    notHelpfulCount = 0,
    raiseTicketCount = 0,
    unratedCount = 0,
    sufficientCount = 0,
    insufficientCount = 0,
    totalTokens = 0,
    promptTokens = 0,
    completionTokens = 0,
    avgTokens = 0,
    totalCost = 0,
    topConsumer = null, // { name, tokens, percentage, queries, manager }
  } = stats;

  const totalRated = helpfulCount + notHelpfulCount;
  const feedbackPercent = totalRated > 0 
    ? Math.round((helpfulCount / totalRated) * 100) 
    : 0;

  const sufficiencyPercent = totalSearches > 0 
    ? Math.round((sufficientCount / totalSearches) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      {/* 1. Total Searches Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Searches ({periodLabel})
          </span>
          <div className="flex items-center gap-1">
            <InfoTooltip 
              title="Total Search Executions"
              description="Total count of HR policy questions asked by team members during the selected time period."
            />
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalSearches.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">queries</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{sufficientCount} Resolved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{insufficientCount} Tickets</span>
          </div>
        </div>
      </div>

      {/* 2. Feedback % Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80 transition-all group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-colors pointer-events-none ${
          totalRated === 0 ? 'bg-slate-500/5' : feedbackPercent >= 70 ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : feedbackPercent >= 40 ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'
        }`} />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Feedback %
          </span>
          <div className="flex items-center gap-1">
            <InfoTooltip 
              title="Employee Feedback %"
              description="Percentage of queries marked as helpful out of all queries with recorded employee feedback."
            />
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
              totalRated === 0 
                ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' 
                : feedbackPercent >= 70 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : feedbackPercent >= 40
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              <ThumbsUp className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            totalRated === 0 
              ? 'text-slate-400' 
              : feedbackPercent >= 70 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : feedbackPercent >= 40
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {totalRated > 0 ? `${feedbackPercent}%` : 'N/A'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {helpfulCount} 👍 / {notHelpfulCount} 👎
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Ticket className="w-3 h-3 text-amber-500" />
            <span>{raiseTicketCount} Escalated</span>
          </div>
          <span>{unratedCount} Unrated</span>
        </div>
      </div>

      {/* 3. Knowledge Sufficiency Rate */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Knowledge Sufficiency
          </span>
          <div className="flex items-center gap-1">
            <InfoTooltip 
              title="Knowledge Base Sufficiency Rate"
              description="Measures whether company HR policies contained sufficient information to resolve inquiries directly."
            />
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
            {sufficiencyPercent}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Sufficient Data</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${sufficiencyPercent}%` }}
              title={`Sufficient: ${sufficiencyPercent}%`}
            />
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${100 - sufficiencyPercent}%` }}
              title={`Insufficient: ${100 - sufficiencyPercent}%`}
            />
          </div>
        </div>
      </div>

      {/* 4. Total Gemini Tokens Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gemini Tokens
          </span>
          <div className="flex items-center gap-1">
            <InfoTooltip 
              title="Total Tokens Consumed"
              description="Total prompt and completion tokens utilized across all queries along with estimated computing cost."
            />
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalTokens.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-medium">
            ~{avgTokens}/q
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>In: {promptTokens.toLocaleString()}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${totalCost.toFixed(4)}</span>
        </div>
      </div>

      {/* 5. NEW CARD: Top Token Consumer (% of Org Tokens) */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-amber-300/50 dark:border-amber-500/30 rounded-2xl p-4 shadow-sm dark:shadow-lg hover:border-amber-400 dark:hover:border-amber-500/60 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Top Token Consumer</span>
          </span>
          <div className="flex items-center gap-1">
            <InfoTooltip 
              title="Highest Token Consuming Employee"
              description="Identifies the team member who utilized the highest volume of tokens along with their percentage share of total organization usage."
            />
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
            {topConsumer ? `${topConsumer.percentage ?? 0}%` : '0%'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">of total tokens</span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 truncate">
          <span className="font-semibold truncate max-w-[120px]" title={topConsumer?.name || 'N/A'}>
            {topConsumer ? topConsumer.name : 'No data'}
          </span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold ml-auto shrink-0">
            {topConsumer ? `${(topConsumer.totalTokens ?? topConsumer.tokens ?? 0).toLocaleString()} tkn` : '0'}
          </span>
        </div>
      </div>

    </div>
  );
}
