import React from 'react';
import { Bot, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import type { AIAnalysis } from '../../shared/api';

interface AISummaryProps {
  analysis: AIAnalysis | null;
  loading?: boolean;
}

const actionColors = {
  approve: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  remove: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  escalate: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  review: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
};

export const AISummary: React.FC<AISummaryProps> = ({
  analysis,
  loading = false,
}) => {
  return (
    <div className="card overflow-hidden gradient-bg-blue">
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          <Bot className="w-4 h-4" />
          CoPilot Analysis
        </h3>
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-12 rounded-xl bg-white/70 dark:bg-slate-800/60 loading-shimmer" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-14 rounded-xl bg-white/70 dark:bg-slate-800/60 loading-shimmer" />
              <div className="h-14 rounded-xl bg-white/70 dark:bg-slate-800/60 loading-shimmer" />
            </div>
            <p className="text-xs font-medium text-blue-700/80 dark:text-blue-200/80">Analyzing with CoPilot...</p>
          </div>
        ) : analysis ? (
          <>
            {/* Key Insight */}
            <div className="rounded-xl bg-white/85 p-4 border border-blue-200/80 dark:bg-slate-950/35 dark:border-slate-800">
              <p className="text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                {analysis.summary}
              </p>
            </div>

            {/* Issues */}
            {analysis.violatedRules.length > 0 && (
              <div className="rounded-xl gradient-bg-orange border border-orange-200/80 dark:border-slate-800 p-4">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="w-4 h-4" />
                  Rule Violations
                </p>
                <ul className="space-y-2">
                  {analysis.violatedRules.map((violation, idx) => {
                    const isRuleObject = typeof violation === 'object' && violation !== null && 'ruleNumber' in violation;
                    if (isRuleObject) {
                      const rule = violation as { ruleNumber: number; ruleTitle: string; description?: string };
                      return (
                        <li key={idx} className="rounded-lg bg-white/90 p-3 border-l-4 border-orange-400 dark:bg-slate-950/40">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            Rule {rule.ruleNumber}: {rule.ruleTitle}
                          </div>
                          {rule.description && (
                            <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {rule.description}
                            </div>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="ml-1 text-xs text-slate-700 dark:text-slate-300">
                        • {String(violation)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Confidence Meter */}
            <div className="rounded-xl bg-white/85 p-4 border border-blue-200/80 dark:bg-slate-950/35 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  <TrendingUp className="w-4 h-4" />
                  CONFIDENCE
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{analysis.confidence}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${analysis.confidence}%` }}
                />
              </div>
            </div>

            {/* Suggested Action */}
            <div className="flex items-center justify-between rounded-xl bg-white/85 p-4 border border-blue-200/80 dark:bg-slate-950/35 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                <Zap className="w-4 h-4" />
                SUGGESTED ACTION
              </span>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  actionColors[analysis.suggestedAction]
                }`}
              >
                {analysis.suggestedAction.toUpperCase()}
              </span>
            </div>

            {/* Reasoning */}
            {analysis.reasoning && (
              <div className="rounded-xl bg-white/85 p-4 border-l-4 border-blue-400 dark:bg-slate-950/35 dark:border-blue-700">
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Reasoning:</span> {analysis.reasoning}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Awaiting analysis...
          </p>
        )}
      </div>
    </div>
  );
};
