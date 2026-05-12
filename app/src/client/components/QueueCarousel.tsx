import React from 'react';
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
    <div className="overflow-hidden rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
      <div className="p-4">
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
        <div className="border-t border-gray-200 bg-red-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">
            Reports ({item.reportCount})
          </p>
          <ul className="space-y-1 text-xs text-red-600 dark:text-red-300">
            {item.reports.map((report, idx) => (
              <li key={idx}>{report}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex-1 rounded bg-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {currentIndex + 1} of {total}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex-1 rounded bg-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
