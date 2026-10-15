import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ThumbsUp, ShieldCheck, Ticket } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const FEEDBACK_COLORS = {
  helpful: '#10b981',     // emerald
  not_helpful: '#f43f5e', // rose
  raise_ticket: '#f59e0b',// amber
  unrated: '#64748b',     // slate
};

const SUFFICIENCY_COLORS = {
  'Sufficient Data': '#3b82f6',   // blue
  'Insufficient Data': '#eab308', // yellow
};

export default function ResolutionPieChart({ stats, theme = 'dark' }) {
  const {
    helpfulCount = 0,
    notHelpfulCount = 0,
    raiseTicketCount = 0,
    unratedCount = 0,
    sufficientCount = 0,
    insufficientCount = 0,
    totalSearches = 0,
  } = stats;

  const feedbackData = [
    { name: 'Helpful 👍', value: helpfulCount, color: FEEDBACK_COLORS.helpful },
    { name: 'Not Helpful 👎', value: notHelpfulCount, color: FEEDBACK_COLORS.not_helpful },
    { name: 'Ticket Raised 🎟️', value: raiseTicketCount, color: FEEDBACK_COLORS.raise_ticket },
    { name: 'Unrated', value: unratedCount, color: FEEDBACK_COLORS.unrated },
  ].filter(d => d.value > 0);

  const sufficiencyData = [
    { name: 'Sufficient Data (Resolved)', value: sufficientCount, color: SUFFICIENCY_COLORS['Sufficient Data'] },
    { name: 'Insufficient Data (Ticket Created)', value: insufficientCount, color: SUFFICIENCY_COLORS['Insufficient Data'] },
  ].filter(d => d.value > 0);

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalSearches > 0 ? ((data.value / totalSearches) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2.5 shadow-xl backdrop-blur-md text-xs text-slate-800 dark:text-slate-100">
          <div className="font-semibold text-slate-900 dark:text-slate-200">{data.name}</div>
          <div className="text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-mono font-bold text-slate-900 dark:text-white">{data.value}</span> queries ({percent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 1. Feedback Distribution Donut */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Feedback Distribution
              </h3>
              <InfoTooltip 
                title="Employee Feedback Distribution"
                description="Categorization of user satisfaction button responses recorded after receiving an answer."
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {helpfulCount + notHelpfulCount + raiseTicketCount} rated
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            User feedback responses recorded from employee interactions
          </p>
        </div>

        <div className="h-52 w-full flex items-center justify-center relative">
          {feedbackData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feedbackData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {feedbackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">No feedback data recorded.</div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {feedbackData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Knowledge Sufficiency vs Escalations */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Answer Sufficiency
              </h3>
              <InfoTooltip 
                title="Answer Sufficiency Rate"
                description="Classifies whether company policy documentation had adequate answers (Sufficient Data) or required a support ticket (Insufficient Data)."
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {totalSearches} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Resolution rate across all processed queries
          </p>
        </div>

        <div className="h-52 w-full flex items-center justify-center relative">
          {sufficiencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sufficiencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sufficiencyData.map((entry, index) => (
                    <Cell key={`cell-suff-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400">No resolution data recorded.</div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {sufficiencyData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
