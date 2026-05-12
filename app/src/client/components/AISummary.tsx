import React from 'react';
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
    <div className="rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Moderation Analysis
        </h3>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Analyzing post...
          </p>
        ) : analysis ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {analysis.summary}
            </p>

            {analysis.violatedRules.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-200">
                  Potential Issues
                </p>
                <ul className="space-y-1">
                  {analysis.violatedRules.map((violation, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 dark:text-gray-300"
                    >
                      {violation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-gray-300 dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-red-600"
                    style={{ width: `${analysis.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {analysis.confidence}% confidence
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                Suggested Action
              </p>
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  actionColors[analysis.suggestedAction]
                }`}
              >
                {analysis.suggestedAction.toUpperCase()}
              </span>
            </div>

            {analysis.reasoning && (
              <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                {analysis.reasoning}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            No analysis available
          </p>
        )}
      </div>
    </div>
  );
};
