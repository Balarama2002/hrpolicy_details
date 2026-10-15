import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  Code2, 
  Copy, 
  Check, 
  ArrowRight,
  Database
} from 'lucide-react';

export default function TokenAccuracyExplainer({ onClose }) {
  const [copied, setCopied] = useState(false);

  const n8nSnippet = `// In n8n 'Fetch the Response from RAG' or next Code node:
// Extract exact usageMetadata from Gemini response:
const usage = $json.usageMetadata || {};
const promptTokens = usage.promptTokenCount || 0;
const completionTokens = usage.candidatesTokenCount || 0;
const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);

return {
  json: {
    ...$json,
    PROMPT_TOKENS: promptTokens,
    COMPLETION_TOKENS: completionTokens,
    TOTAL_TOKENS: totalTokens
  }
};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(n8nSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Accurate LLM Token Consumption Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Understanding true RAG token economics vs naive estimation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-600 dark:text-slate-300 flex-1">
          
          {/* Why Naive estimation is inaccurate */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Why Naive Word/Char Counting Fails for RAG</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If an app only counts the user’s question (e.g. <em>"How many leaves can I take?"</em> = 8 words / ~10 tokens) and the response (~100 tokens), it will estimate ~110 tokens. 
              <strong className="text-slate-900 dark:text-white block mt-1">This is off by more than 3,500 tokens!</strong>
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              In the AI assistant workflow, before the model generates a single word, the following are injected:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700 dark:text-slate-300 pl-2">
              <li><strong>HR Assistant System Prompt:</strong> Strict guidelines & formatting rules = <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">~1,380 tokens</span></li>
              <li><strong>Retrieved Policy Context:</strong> Complete HR policy sections = <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">~1,600 - 2,100 tokens</span></li>
              <li><strong>User Question & Conversation:</strong> Current request = <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">~50 - 300 tokens</span></li>
              <li><strong>Generated Output Response:</strong> Teams HTML output = <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">~250 - 450 tokens</span></li>
            </ul>
          </div>

          {/* Exact Token Anatomy */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-slate-900 dark:text-white font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Anatomy of a Single RAG Execution (~3,800 Total Tokens)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">System Rules</div>
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">1,380</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Fixed input overhead</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Retrieved Context</div>
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">~1,800</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Dynamic retrieved text</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Model Output</div>
                <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">~350</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Generated answer</div>
              </div>
            </div>
          </div>

          {/* How to Log Exact Tokens */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-900 dark:text-white font-bold uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Logging Exact Tokens from Model into Audit Table</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              The AI model API automatically returns exact token usage metadata. You can record the 3 columns (<code className="text-slate-800 dark:text-slate-200 font-medium">PROMPT_TOKENS</code>, <code className="text-slate-800 dark:text-slate-200 font-medium">COMPLETION_TOKENS</code>, <code className="text-slate-800 dark:text-slate-200 font-medium">TOTAL_TOKENS</code>) directly into the audit log:
            </p>
            <pre className="bg-white dark:bg-slate-900 p-3 rounded-lg font-mono text-[11px] text-blue-600 dark:text-blue-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
              {n8nSnippet}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
}
