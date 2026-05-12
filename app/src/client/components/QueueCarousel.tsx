import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ModQueueItem } from '../../shared/api';

interface QueueCarouselProps {
  item: ModQueueItem | null;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const QueueCarousel: React.FC<QueueCarouselProps> = ({
  item,
  currentIndex,
  total,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}) => {
  if (!item) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="p-5">
        {/* Post Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {item.title}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Posted by u/{item.author}
            </p>
            <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>{item.score} upvotes</span>
              <span>{item.numComments} comments</span>
            </div>
          </div>
          {item.reportCount > 0 && (
            <span className="ml-3 flex-shrink-0 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
              {item.reportCount} reports
            </span>
          )}
        </div>

        {/* Post Body */}
        {item.body && (
          <p className="mb-3 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {item.body}
          </p>
        )}
      </div>

      {/* Reports */}
      {item.reports.length > 0 && (
        <div className="border-t border-gray-200 bg-orange-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/50">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4" />
            Flagged ({item.reportCount})
          </p>
          <ul className="space-y-1">
            {item.reports.map((report, idx) => (
              <li key={idx} className="text-xs text-orange-600 dark:text-orange-300">
                • {report}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center justify-center gap-1.5 rounded-full bg-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center justify-center gap-1.5 rounded-full bg-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
