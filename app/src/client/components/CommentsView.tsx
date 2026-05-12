import React from 'react';
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
      <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          Loading comments...
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          No comments on this post
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          Top Comments • {comments.length}
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                u/{comment.author}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ↑ {comment.score}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-700 line-clamp-3 dark:text-gray-300">
              {comment.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
