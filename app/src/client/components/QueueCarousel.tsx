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
    <div className="card overflow-hidden">
      <div className="p-6">
        {/* Post Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Posted by u/{item.author}
            </p>
            <div className="mt-3 flex gap-6 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">{item.score} upvotes</span>
              <span className="font-medium">{item.numComments} comments</span>
            </div>
          </div>
          {item.reportCount > 0 && (
            <span className="ml-4 flex-shrink-0 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
              {item.reportCount} reports
            </span>
          )}
        </div>

        {/* Post Body */}
        {item.body && (
          <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {item.body}
          </p>
        )}
      </div>

      {/* Reports */}
      {item.reports.length > 0 && (
        <div className="card-header gradient-bg-orange">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
            <AlertTriangle className="w-4 h-4" />
            Flagged ({item.reportCount})
          </p>
          <ul className="space-y-2">
            {item.reports.map((report, idx) => (
              <li key={idx} className="text-xs text-orange-600 dark:text-orange-200 ml-6">
                • {report}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="card-header bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
