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
    <div className="rounded-lg border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
      <div className="border-b border-blue-200 px-5 py-3 dark:border-blue-900">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Bot className="w-4 h-4" />
          CoPilot Analysis
        </h3>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Analyzing with CoPilot...
          </p>
        ) : analysis ? (
          <>
            {/* Key Insight */}
            <div className="mb-4 rounded bg-white p-3 dark:bg-blue-900/20">
              <p className="text-sm font-semibold leading-relaxed text-blue-900 dark:text-blue-100">
                {analysis.summary}
              </p>
            </div>

            {/* Issues */}
            {analysis.violatedRules.length > 0 && (
              <div className="mb-4 rounded bg-orange-100 p-3 dark:bg-orange-900/20">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="w-4 h-4" />
                  Potential Issues
                </p>
                <ul className="space-y-1">
                  {analysis.violatedRules.map((violation, idx) => (
                    <li key={idx} className="text-xs text-orange-700 dark:text-orange-200">
                      • {violation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence Meter */}
            <div className="mb-4 rounded bg-white p-3 dark:bg-blue-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <TrendingUp className="w-4 h-4" />
                  CONFIDENCE
                </span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{analysis.confidence}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-300 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${analysis.confidence}%` }}
                />
              </div>
            </div>

            {/* Suggested Action */}
            <div className="mb-4 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                <Zap className="w-4 h-4" />
                ACTION:
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  actionColors[analysis.suggestedAction]
                }`}
              >
                {analysis.suggestedAction.toUpperCase()}
              </span>
            </div>

            {/* Reasoning */}
            {analysis.reasoning && (
              <div className="rounded border-l-4 border-blue-400 bg-white p-3 dark:border-blue-700 dark:bg-blue-900/20">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Reasoning:</span> {analysis.reasoning}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Awaiting analysis...
          </p>
        )}
      </div>
    </div>
  );
};
