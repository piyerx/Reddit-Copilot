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

  // Construct Reddit post URL
  const postUrl = item.url
    ? item.url
    : item.subreddit
      ? `https://reddit.com/r/${item.subreddit}/comments/${item.postId.replace('t3_', '')}`
      : null;

  return (
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Post Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            {postUrl ? (
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 inline-block text-[1.05rem] font-semibold tracking-tight text-slate-950 transition-colors hover:text-blue-600 hover:underline dark:text-slate-50 dark:hover:text-blue-300"
              >
                {item.title}
              </a>
            ) : (
              <h2 className="mb-2 text-[1.05rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {item.title}
              </h2>
            )}
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Posted by u/{item.author}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{item.score} upvotes</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{item.numComments} comments</span>
            </div>
          </div>
          {item.reportCount > 0 && (
            <span className="ml-4 shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
              {item.reportCount} reports
            </span>
          )}
        </div>

        {/* Post Body */}
        {item.body && (
          <p className="mb-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {item.body}
          </p>
        )}
      </div>

      {/* Reports */}
      {item.reports.length > 0 && (
        <div className="card-header gradient-bg-orange">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
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
      <div className="card-header bg-slate-50/80 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
