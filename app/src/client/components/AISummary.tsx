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
    <div className="card gradient-bg-blue">
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Bot className="w-4 h-4" />
          CoPilot Analysis
        </h3>
      </div>
      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <p className="text-sm text-blue-600 dark:text-blue-300 animate-pulse">
            Analyzing with CoPilot...
          </p>
        ) : analysis ? (
          <>
            {/* Key Insight */}
            <div className="rounded-lg bg-white dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold leading-relaxed text-blue-900 dark:text-blue-100">
                {analysis.summary}
              </p>
            </div>

            {/* Issues */}
            {analysis.violatedRules.length > 0 && (
              <div className="rounded-lg gradient-bg-orange border border-orange-200 dark:border-orange-800 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="w-4 h-4" />
                  Rule Violations
                </p>
                <ul className="space-y-2">
                  {analysis.violatedRules.map((violation, idx) => {
                    const isRuleObject = typeof violation === 'object' && violation !== null && 'ruleNumber' in violation;
                    if (isRuleObject) {
                      const rule = violation as { ruleNumber: number; ruleTitle: string; description?: string };
                      return (
                        <li key={idx} className="rounded-lg bg-white dark:bg-orange-900/30 p-3 border-l-4 border-orange-400">
                          <div className="text-xs font-bold text-orange-800 dark:text-orange-200">
                            Rule {rule.ruleNumber}: {rule.ruleTitle}
                          </div>
                          {rule.description && (
                            <div className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                              {rule.description}
                            </div>
                          )}
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="text-xs text-orange-700 dark:text-orange-200 ml-1">
                        • {String(violation)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Confidence Meter */}
            <div className="rounded-lg bg-white dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <TrendingUp className="w-4 h-4" />
                  CONFIDENCE
                </span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{analysis.confidence}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${analysis.confidence}%` }}
                />
              </div>
            </div>

            {/* Suggested Action */}
            <div className="flex items-center justify-between rounded-lg bg-white dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                <Zap className="w-4 h-4" />
                SUGGESTED ACTION
              </span>
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  actionColors[analysis.suggestedAction]
                }`}
              >
                {analysis.suggestedAction.toUpperCase()}
              </span>
            </div>

            {/* Reasoning */}
            {analysis.reasoning && (
              <div className="rounded-lg bg-white dark:bg-blue-900/30 p-4 border-l-4 border-blue-400 dark:border-blue-700">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Reasoning:</span> {analysis.reasoning}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Awaiting analysis...
          </p>
        )}
      </div>
    </div>
  );
};
