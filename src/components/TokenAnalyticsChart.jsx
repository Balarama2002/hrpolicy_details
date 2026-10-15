import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Label
} from 'recharts';
import { Cpu, Zap, DollarSign } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function TokenAnalyticsChart({ data = [], granularity = 'day', theme = 'dark' }) {
  if (!data || data.length === 0) {
    return null;
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const axisLabelColor = isDark ? '#cbd5e1' : '#475569';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const prompt = payload.find(p => p.dataKey === 'promptTokens')?.value || 0;
      const completion = payload.find(p => p.dataKey === 'completionTokens')?.value || 0;
      const total = prompt + completion;
      const cost = payload.find(p => p.dataKey === 'cost')?.value || 0;

      return (
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs text-slate-800 dark:text-slate-100">
          <div className="font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">{total.toLocaleString()} Tokens</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Prompt / Input Tokens:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{prompt.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Completion / Output:</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{completion.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Est. Gemini API Cost:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${cost.toFixed(5)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              LLM Token Consumption Breakdown
            </h3>
            <InfoTooltip 
              title="Token Consumption Breakdown"
              description="Visualizes stacked Input (Prompt) vs Output (Completion) tokens consumed by AI models over the selected timeframe."
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {granularity === 'hour'
              ? 'Hourly prompt & completion tokens consumed'
              : 'Input vs Output tokens per time window'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Gemini 3.5 Flash Lite Rates</span>
        </div>
      </div>

      <div className="h-[350px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 15, right: 15, left: 20, bottom: 35 }}>
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
              yAxisId="left"
              stroke={tickColor} 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            >
              <Label 
                value="Tokens (Prompt + Completion)" 
                angle={-90} 
                position="insideLeft" 
                offset={-10} 
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
            />
            <Bar 
              yAxisId="left"
              dataKey="promptTokens" 
              name="Prompt / In Tokens" 
              stackId="a" 
              fill="#3b82f6" 
              radius={[0, 0, 0, 0]} 
            />
            <Bar 
              yAxisId="left"
              dataKey="completionTokens" 
              name="Completion / Out Tokens" 
              stackId="a" 
              fill="#a855f7" 
              radius={[4, 4, 0, 0]} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
