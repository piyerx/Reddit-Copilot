import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useQueue } from './hooks/useQueue';
import { QueueCarousel } from './components/QueueCarousel';
import { CommentsView } from './components/CommentsView';
import { AISummary } from './components/AISummary';

export const App = () => {
  const {
    items,
    currentItem,
    comments,
    analysis,
    loading,
    analysisLoading,
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
    <div className="min-h-screen bg-reddit-bg px-4 py-6 dark:bg-gray-900 sm:px-6 md:px-8">
      <div className="mx-auto max-w-2xl space-y-3 pb-28">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moderation Hub
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {items.length} item{items.length !== 1 ? 's' : ''} in queue • CoPilot-assisted
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

        {/* CoPilot Analysis */}
        <AISummary analysis={analysis} loading={analysisLoading} />

        {/* Comments */}
        <CommentsView comments={comments} loading={loading} />
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-300 bg-reddit-bg px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-green-700 active:scale-95 dark:bg-green-700 dark:hover:bg-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-orange-700 active:scale-95 dark:bg-orange-700 dark:hover:bg-orange-600">
            <AlertCircle className="w-4 h-4" />
            Warn
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-95 dark:bg-red-700 dark:hover:bg-red-600">
            <XCircle className="w-4 h-4" />
            Remove
          </button>
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
