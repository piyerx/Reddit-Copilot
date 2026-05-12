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
      <div className="rounded border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          Loading comments...
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          No comments
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Top Comments ({comments.length})
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                u/{comment.author}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {comment.score} upvotes
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
