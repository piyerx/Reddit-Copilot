import React, { useEffect, useState } from 'react';
import { Repeat2, Calendar, AlertTriangle } from 'lucide-react';
import type { SimilarCase } from '../../server/services/similar-cases';

interface SimilarCasesProps {
  postId: string;
  title: string;
  body: string;
  ruleViolated?: string;
}

export const SimilarCases: React.FC<SimilarCasesProps> = ({
  postId,
  title,
  body,
  ruleViolated,
}) => {
  const [cases, setCases] = useState<(SimilarCase & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/similar-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            title,
            body: body || '',
            ruleViolated,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch similar cases');
        }

        const data = await response.json();
        setCases((data.cases || []).map((c: any, idx: number) => ({ ...c, id: `${idx}` })));
      } catch (err) {
        console.error('Error fetching similar cases:', err);
        setError(err instanceof Error ? err.message : 'Failed to load similar cases');
      } finally {
        setLoading(false);
      }
    };

    if (postId && title) {
      fetchSimilarCases();
    }
  }, [postId, title, body, ruleViolated]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full loading-shimmer" />
          <div className="h-3.5 w-36 rounded-full loading-shimmer" />
        </div>
      </div>
    );
  }

  if (error || cases.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3 shadow-sm dark:border-blue-800 dark:bg-slate-950/60">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Repeat2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
          Similar Cases Found ({cases.length})
        </h4>
      </div>

      {/* Cases List */}
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {cases.map((similarCase) => (
          <div
            key={similarCase.id}
            className="rounded-xl border-l-4 border-blue-400 bg-white/90 p-3 dark:bg-slate-900/80"
          >
            {/* Title & Author */}
            <p className="mb-1 line-clamp-2 text-xs font-semibold text-slate-950 dark:text-slate-100">
              {similarCase.title}
            </p>
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>u/{similarCase.author}</span>
              <div className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3" />
                <span className="font-semibold text-blue-600 dark:text-blue-300">
                  {similarCase.similarity}% match
                </span>
              </div>
            </div>

            {/* Rule & Reason */}
            <div className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800/70">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                Rule: {similarCase.ruleViolated}
              </p>
              <p className="mt-0.5 line-clamp-2 text-slate-500 dark:text-slate-400">
                {similarCase.removalReason}
              </p>
            </div>

            {/* Date */}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
              <Calendar className="w-3 h-3" />
              {new Date(similarCase.removedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Footer guidance */}
      <p className="mt-2 rounded-lg bg-blue-100/80 p-2 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
        These posts were removed for similar reasons. Review to ensure consistent moderation.
      </p>
    </div>
  );
};
