import React from 'react';

interface AISummaryProps {
  loading?: boolean;
  summary?: string;
  confidence?: number;
  suggestedViolations?: string[];
}

export const AISummary: React.FC<AISummaryProps> = ({
  loading = false,
  summary,
  confidence,
  suggestedViolations = [],
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
        ) : summary ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {summary}
            </p>

            {suggestedViolations.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold text-gray-900 dark:text-gray-200">
                  Possible violations
                </p>
                <ul className="space-y-1">
                  {suggestedViolations.map((violation, idx) => (
                    <li key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                      {violation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {confidence && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-gray-300 dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-red-600"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {confidence}%
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Coming in Phase 3: AI-powered moderation analysis
          </p>
        )}
      </div>
    </div>
  );
};
