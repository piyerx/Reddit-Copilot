import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useQueue } from './hooks/useQueue';
import { QueueCard } from './components/QueueCard';
import { ModerationPanel } from './components/ModerationPanel';

export const App = () => {
  const {
    items,
    currentItem,
    comments,
    loading,
    error,
    currentIndex,
    goToNext,
    goToPrevious,
    hasNextItem,
    hasPreviousItem,
  } = useQueue();

  if (error && items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading moderation queue...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No items in moderation queue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen gap-4 bg-gray-50 dark:bg-gray-900 p-4">
      {/* Queue List (Left) */}
      <div className="w-72 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-3">
        <h2 className="sticky top-0 text-sm font-bold text-gray-900 dark:text-white mb-3 bg-white dark:bg-gray-800 pb-2 border-b border-gray-300 dark:border-gray-700">
          Moderation Queue ({items.length})
        </h2>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <QueueCard
              key={item.id}
              item={item}
              isActive={idx === currentIndex}
              onClick={() => {
                // Load item when clicked
              }}
            />
          ))}
        </div>
      </div>

      {/* Moderation Panel (Right) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Main Content */}
        <div className="flex-1 min-h-0">
          <ModerationPanel
            item={currentItem}
            comments={comments}
            loading={loading}
            error={error}
          />
        </div>

        {/* Navigation & Actions */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={goToPrevious}
              disabled={!hasPreviousItem}
              className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gray-500 dark:bg-gray-600 rounded hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {currentIndex + 1} / {items.length}
            </span>
            <button
              onClick={goToNext}
              disabled={!hasNextItem}
              className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gray-500 dark:bg-gray-600 rounded hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button className="px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors">
              ✓ Approve
            </button>
            <button className="px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors">
              ✕ Remove
            </button>
            <button className="px-3 py-2 text-xs font-semibold text-white bg-yellow-600 rounded hover:bg-yellow-700 transition-colors">
              ⚠ Warn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
