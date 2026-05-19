import React, { useEffect, useState } from 'react';
import { AlertTriangle, Repeat2, Shield } from 'lucide-react';
import type { SpamIndicator } from '../../shared/api';

interface SpamIndicatorsProps {
  postId: string;
  title: string;
  body: string;
  author: string;
  url?: string;
  loading?: boolean;
}

const getTypeColor = (type: 'spam' | 'repost' | 'suspicious' | 'clean') => {
  switch (type) {
    case 'spam':
      return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    case 'repost':
      return 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    case 'suspicious':
      return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    case 'clean':
      return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
  }
};

const getTextColor = (type: 'spam' | 'repost' | 'suspicious' | 'clean') => {
  switch (type) {
    case 'spam':
      return 'text-red-700 dark:text-red-300';
    case 'repost':
      return 'text-orange-700 dark:text-orange-300';
    case 'suspicious':
      return 'text-yellow-700 dark:text-yellow-300';
    case 'clean':
      return 'text-green-700 dark:text-green-300';
  }
};

const getIcon = (type: 'spam' | 'repost' | 'suspicious' | 'clean') => {
  switch (type) {
    case 'spam':
      return <AlertTriangle className="w-4 h-4" />;
    case 'repost':
      return <Repeat2 className="w-4 h-4" />;
    case 'suspicious':
      return <AlertTriangle className="w-4 h-4" />;
    case 'clean':
      return <Shield className="w-4 h-4" />;
  }
};

const getLabel = (type: 'spam' | 'repost' | 'suspicious' | 'clean') => {
  switch (type) {
    case 'spam':
      return 'Likely Spam';
    case 'repost':
      return 'Likely Repost';
    case 'suspicious':
      return 'Suspicious';
    case 'clean':
      return 'Clean';
  }
};

export const SpamIndicators: React.FC<SpamIndicatorsProps> = ({
  postId,
  title,
  body,
  author,
  url,
  loading = false,
}) => {
  const [analysis, setAnalysis] = useState<SpamIndicator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSpam = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/spam-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body: body || '',
            author,
            url,
            postId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check spam');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        console.error('Error checking spam:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze post');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId && title) {
      checkSpam();
    }
  }, [postId, title, body, author]);

  if (isLoading || loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full loading-shimmer" />
          <div className="h-3.5 w-40 rounded-full loading-shimmer" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Spam scan unavailable
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  // Only show if not clean
  if (analysis.type === 'clean') {
    return null;
  }

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${getTypeColor(analysis.type)}`}>
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className={getTextColor(analysis.type)}>{getIcon(analysis.type)}</div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${getTextColor(analysis.type)}`}>
            {getLabel(analysis.type)} — {Math.round(analysis.confidence)}% confidence
          </h4>
        </div>
      </div>

      {/* Reasons */}
      {analysis.reasons.length > 0 && (
        <div className="ml-6 space-y-1">
          {analysis.reasons.map((reason, idx) => (
            <p key={idx} className={`text-xs ${getTextColor(analysis.type)}`}>
              • {reason}
            </p>
          ))}
        </div>
      )}

      {/* Action guidance */}
      {analysis.type === 'spam' && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-300">
          Consider removing and warning user. Review removal reason to cite specific violations.
        </p>
      )}
      {analysis.type === 'repost' && (
        <p className="mt-2 text-xs text-orange-600 dark:text-orange-300">
          Check similar posts to verify. May need removal depending on subreddit repost policy.
        </p>
      )}
      {analysis.type === 'suspicious' && (
        <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          Review carefully. May have borderline characteristics requiring additional context.
        </p>
      )}
    </div>
  );
};
