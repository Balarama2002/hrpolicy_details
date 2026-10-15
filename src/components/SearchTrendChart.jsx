import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Label
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function SearchTrendChart({ data = [], granularity = 'day', theme = 'dark' }) {
  // Always default to 'area' chart across all views and timeframes
  const [chartType, setChartType] = useState('area');
  const isDark = theme === 'dark';

  const totalHelpful = useMemo(() => data.reduce((s, d) => s + (d.helpful || 0), 0), [data]);
  const totalNotHelpful = useMemo(() => data.reduce((s, d) => s + (d.notHelpful || 0), 0), [data]);
  const totalTicket = useMemo(() => data.reduce((s, d) => s + (d.raiseTicket || 0), 0), [data]);
  const totalUnrated = useMemo(() => data.reduce((s, d) => s + (d.unrated || 0), 0), [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center h-80 text-slate-500 shadow-sm dark:shadow-none">
        <Calendar className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
        <p className="text-sm font-medium">No search trends recorded for the selected time window.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload[0]?.payload?.total ?? payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      const activeEntries = payload.filter(entry => (entry.value || 0) > 0);
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs text-slate-800 dark:text-slate-100">
          <div className="font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{total} Searches</span>
          </div>
          <div className="space-y-1">
            {activeEntries.length > 0 ? (
              activeEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{entry.value}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400 italic">No activity recorded</span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const axisLabelColor = isDark ? '#cbd5e1' : '#475569';

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Search Volume & Usefulness Trend
            </h3>
            <InfoTooltip 
              title="Search Volume & Usefulness Trend"
              description="Visualizes query volume over chronological time windows broken down by employee feedback: Helpful 👍, Not Helpful 👎, Ticket Raised 🎟️, and Unrated."
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {granularity === 'hour' 
              ? 'Hourly breakdown across today with feedback distribution'
              : 'Volume of HR questions and employee feedback over time'}
          </p>
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              chartType === 'area'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Stacked Bar
          </button>
        </div>
      </div>

      <div className="h-[350px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 15, right: 15, left: 15, bottom: 35 }}>
              <defs>
                <linearGradient id="colorHelpful" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorNotHelpful" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorTicket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorUnrated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke={tickColor} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              >
                <Label 
                  value={granularity === 'hour' ? 'Timeline (Hour of Day)' : 'Timeline (Calendar Date)'} 
                  offset={-15} 
                  position="insideBottom" 
                  fill={axisLabelColor} 
                  fontSize={11} 
                  fontWeight={600} 
                />
              </XAxis>
              <YAxis 
                stroke={tickColor} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              >
                <Label 
                  value="Search Query Count" 
                  angle={-90} 
                  position="insideLeft" 
                  offset={-5} 
                  fill={axisLabelColor} 
                  fontSize={11} 
                  fontWeight={600} 
                  style={{ textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                payload={[
                  { value: 'Helpful 👍', type: 'circle', color: '#10b981', id: 'helpful' },
                  { value: 'Not Helpful 👎', type: 'circle', color: '#f43f5e', id: 'notHelpful' },
                  { value: 'Ticket Raised 🎟️', type: 'circle', color: '#f59e0b', id: 'raiseTicket' },
                  { value: 'Answered / Unrated', type: 'circle', color: '#3b82f6', id: 'unrated' },
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="notHelpful" 
                name="Not Helpful 👎" 
                stroke={totalNotHelpful > 0 ? "#f43f5e" : "transparent"} 
                strokeWidth={totalNotHelpful > 0 ? 2 : 0}
                fillOpacity={1} 
                fill="url(#colorNotHelpful)" 
              />
              <Area 
                type="monotone" 
                dataKey="raiseTicket" 
                name="Ticket Raised 🎟️" 
                stroke={totalTicket > 0 ? "#f59e0b" : "transparent"} 
                strokeWidth={totalTicket > 0 ? 2 : 0}
                fillOpacity={1} 
                fill="url(#colorTicket)" 
              />
              <Area 
                type="monotone" 
                dataKey="unrated" 
                name="Answered / Unrated" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorUnrated)" 
              />
              <Area 
                type="monotone" 
                dataKey="helpful" 
                name="Helpful 👍" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHelpful)" 
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 15, right: 15, left: 15, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke={tickColor} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              >
                <Label 
                  value={granularity === 'hour' ? 'Timeline (Hour of Day)' : 'Timeline (Calendar Date)'} 
                  offset={-15} 
                  position="insideBottom" 
                  fill={axisLabelColor} 
                  fontSize={11} 
                  fontWeight={600} 
                />
              </XAxis>
              <YAxis 
                stroke={tickColor} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              >
                <Label 
                  value="Search Query Count" 
                  angle={-90} 
                  position="insideLeft" 
                  offset={-5} 
                  fill={axisLabelColor} 
                  fontSize={11} 
                  fontWeight={600} 
                  style={{ textAnchor: 'middle' }}
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                payload={[
                  { value: 'Helpful 👍', type: 'circle', color: '#10b981', id: 'helpful' },
                  { value: 'Not Helpful 👎', type: 'circle', color: '#f43f5e', id: 'notHelpful' },
                  { value: 'Ticket Raised 🎟️', type: 'circle', color: '#f59e0b', id: 'raiseTicket' },
                  { value: 'Answered / Unrated', type: 'circle', color: '#3b82f6', id: 'unrated' },
                ]}
              />
              <Bar dataKey="notHelpful" name="Not Helpful 👎" stackId="a" fill="#f43f5e" />
              <Bar dataKey="raiseTicket" name="Ticket Raised 🎟️" stackId="a" fill="#f59e0b" />
              <Bar dataKey="unrated" name="Answered / Unrated" stackId="a" fill="#3b82f6" />
              <Bar dataKey="helpful" name="Helpful 👍" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
