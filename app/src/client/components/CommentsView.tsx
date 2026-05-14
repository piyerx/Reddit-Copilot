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
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 p-6">
          Loading comments...
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="card">
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 p-6">
          No comments on this post
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          <MessageSquare className="w-4 h-4" />
          Top Comments • {comments.length}
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                u/{comment.author}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {comment.score}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 line-clamp-3 dark:text-gray-300">
              {comment.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
