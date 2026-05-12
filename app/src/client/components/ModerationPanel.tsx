import React from 'react';
import type { ModQueueItem, ModComment } from '../../shared/api';

interface ModerationPanelProps {
  item: ModQueueItem | null;
  comments: ModComment[];
  loading: boolean;
  error: string | null;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  item,
  comments,
  loading,
  error,
}) => {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-red-50 dark:bg-red-950 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-300 font-semibold">Error</p>
          <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !item) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Post Section */}
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {item.title}
          </h2>
          <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>by u/{item.author}</span>
            <span>•</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>↑ {item.score}</span>
            <span>💬 {item.numComments}</span>
          </div>
        </div>

        {item.body && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-4">
            {item.body}
          </p>
        )}

        {item.reports.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded p-2 mb-2">
            <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
              Reports ({item.reportCount}):
            </p>
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
              {item.reports.map((report, idx) => (
                <li key={idx}>• {report}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {comments.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            Top Comments ({comments.length})
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border-l-2 border-gray-300 dark:border-gray-700 pl-3"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    u/{comment.author}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ↑ {comment.score}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
