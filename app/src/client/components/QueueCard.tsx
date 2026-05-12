import React from 'react';
import type { ModQueueItem } from '../../shared/api';

interface QueueCardProps {
  item: ModQueueItem;
  onClick?: () => void;
  isActive?: boolean;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  item,
  onClick,
  isActive = false,
}) => {
  const createdDate = new Date(item.createdAt).toLocaleDateString();

  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-2 border rounded-lg p-4 cursor-pointer transition-all ${
        isActive
          ? 'border-orange-600 bg-orange-50 dark:bg-orange-950'
          : 'border-gray-300 dark:border-gray-700 hover:border-orange-400'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
          {item.title}
        </h3>
        {item.reportCount > 0 && (
          <span className="ml-2 flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900 px-2 py-1 text-xs font-semibold text-red-800 dark:text-red-200">
            {item.reportCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>by {item.author}</span>
        <span>•</span>
        <span>{createdDate}</span>
      </div>

      <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span>↑ {item.score}</span>
        <span>💬 {item.numComments}</span>
      </div>
    </div>
  );
};
