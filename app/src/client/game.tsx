import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useQueue } from './hooks/useQueue';
import { QueueCarousel } from './components/QueueCarousel';
import { CommentsView } from './components/CommentsView';
import { AISummary } from './components/AISummary';

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
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
            Error
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading moderation queue...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No items in moderation queue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4 dark:bg-gray-900 sm:px-6 md:px-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Moderation Queue
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {items.length} item{items.length !== 1 ? 's' : ''} waiting
          </p>
        </div>

        {/* Queue Item Card */}
        <QueueCarousel
          item={currentItem}
          currentIndex={currentIndex}
          total={items.length}
          onNext={goToNext}
          onPrevious={goToPrevious}
          hasNext={hasNextItem}
          hasPrevious={hasPreviousItem}
        />

        {/* Moderation Analysis */}
        <AISummary loading={loading} />

        {/* Comments */}
        <CommentsView comments={comments} loading={loading} />

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 rounded border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <button className="rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800">
            Approve
          </button>
          <button className="rounded bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800">
            Remove
          </button>
          <button className="rounded bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700 active:bg-orange-800">
            Warn
          </button>
        </div>

        {/* Footer Spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
