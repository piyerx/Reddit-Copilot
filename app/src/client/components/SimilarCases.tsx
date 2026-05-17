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
      <div className="rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Finding similar cases...</p>
        </div>
      </div>
    );
  }

  if (error || cases.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Repeat2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
          Similar Cases Found ({cases.length})
        </h4>
      </div>

      {/* Cases List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {cases.map((similarCase) => (
          <div
            key={similarCase.id}
            className="bg-white dark:bg-gray-800 rounded p-2.5 border-l-3 border-blue-400"
          >
            {/* Title & Author */}
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
              {similarCase.title}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
              <span>u/{similarCase.author}</span>
              <div className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {similarCase.similarity}% match
                </span>
              </div>
            </div>

            {/* Rule & Reason */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-1.5 text-xs">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Rule: {similarCase.ruleViolated}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {similarCase.removalReason}
              </p>
            </div>

            {/* Date */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(similarCase.removedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* Footer guidance */}
      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
        These posts were removed for similar reasons. Review to ensure consistent moderation.
      </p>
    </div>
  );
};
