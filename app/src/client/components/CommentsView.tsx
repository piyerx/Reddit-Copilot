import React from 'react';
import { MessageSquare, TrendingUp } from 'lucide-react';
import type { ModComment } from '../../shared/api';

interface CommentsViewProps {
  comments: ModComment[];
  loading: boolean;
}

export const CommentsView: React.FC<CommentsViewProps> = ({
  comments,
  loading,
}) => {
  if (loading) {
    return (
      <div className="card">
        <div className="space-y-3 p-4 sm:p-5">
          <div className="h-4 w-32 rounded-full loading-shimmer" />
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 loading-shimmer" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 loading-shimmer" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="card">
        <p className="p-4 text-center text-sm text-slate-600 dark:text-slate-400 sm:p-5">
          No comments on this post
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
          <MessageSquare className="w-4 h-4" />
          Top Comments • {comments.length}
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 sm:px-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                u/{comment.author}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {comment.score}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-700 line-clamp-3 dark:text-slate-300">
              {comment.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
