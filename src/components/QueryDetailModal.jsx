import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  Ticket, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Layers, 
  FileText,
  DollarSign,
  Copy,
  Check
} from 'lucide-react';

export default function QueryDetailModal({ log, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const isSufficient = log.status === 'Sufficient Data';

  const handleCopy = () => {
    navigator.clipboard.writeText(log.cleanResponse || log.rawResponse || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Execution #{log.id}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
                isSufficient 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
              }`}>
                {isSufficient ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {log.status}
              </span>
              {log.jiraNumber && (
                <a
                  href={log.jiraUrl && log.jiraUrl.includes('/browse/') ? log.jiraUrl : `https://ram25tgh.atlassian.net/browse/${log.jiraNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 hover:underline"
                >
                  <Ticket className="w-3 h-3" />
                  <span>Jira: {log.jiraNumber}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">Employee: {log.name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 flex-1">
          
          {/* 1. Employee Question */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Employee Question
              </span>
              <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                ~{Math.round((log.cleanQuestion.length || 10) / 3.8)} Tokens
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap">
              {log.cleanQuestion || '(No text)'}
            </p>
          </div>

          {/* 2. Accurate Token Breakdown Card */}
          <div className="bg-purple-500/10 dark:bg-purple-950/20 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-3">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                LLM Request Token Consumption Profile
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Est. Cost: ${log.estimatedCostUsd.toFixed(6)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/15 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400">System Rules:</div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">1,380</div>
                <div className="text-[10px] text-slate-500">System prompt & guardrails</div>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/15 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400">Retrieved Context:</div>
                <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                  {(Math.max(0, log.promptTokens - 1380 - Math.round((log.cleanQuestion.length || 10) / 3.8))).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Relevant policy knowledge</div>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/15 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400">Response Output:</div>
                <div className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                  {log.completionTokens.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Teams HTML answer</div>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 ring-1 ring-purple-500/30 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400">Total Tokens:</div>
                <div className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono mt-0.5">
                  {log.totalTokens.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Dual Gemini Models</div>
              </div>
            </div>
          </div>

          {/* 3. Assistant Output / Response */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                HR Bot Generated Response
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div 
              className="prose prose-xs max-w-none text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/90 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 font-sans text-xs leading-relaxed space-y-2 shadow-inner dark:shadow-none"
              dangerouslySetInnerHTML={{ __html: log.rawResponse || log.cleanResponse }}
            />
          </div>

          {/* 4. Adaptive Card Feedback State */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-300">User Interaction in Teams:</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Adaptive Card rendered with 👍 Helpful / 👎 Not Helpful / 🎟️ Raise Ticket
              </div>
            </div>

            <div>
              {log.feedback === 'helpful' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <ThumbsUp className="w-3.5 h-3.5" /> User marked response as Helpful
                </span>
              )}
              {log.feedback === 'not_helpful' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  <ThumbsDown className="w-3.5 h-3.5" /> User marked response as Not Helpful
                </span>
              )}
              {log.feedback === 'raise_ticket' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Ticket className="w-3.5 h-3.5" /> User requested support ticket
                </span>
              )}
              {log.feedback === 'unrated' && (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  No feedback button pressed by user yet
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
