import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, AlertCircle, XCircle, Loader } from 'lucide-react';
import { useQueue } from './hooks/useQueue';
import { QueueCarousel } from './components/QueueCarousel';
import { CommentsView } from './components/CommentsView';
import { AISummary } from './components/AISummary';
import { NotesPanel } from './components/NotesPanel';

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

  const [actionLoading, setActionLoading] = useState<'approve' | 'remove' | 'warn' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleAction = async (
    action: 'approve' | 'remove' | 'warn' | 'escalate' | 'review'
  ) => {
    if (!currentItem) return;

    setActionLoading(action as any);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Step 1: Perform the actual moderation action on Reddit
      let actionEndpoint = '/api/actions/approve';
      const actionBody: any = { postId: currentItem.postId };

      if (action === 'remove') {
        actionEndpoint = '/api/actions/remove';
        // Generate removal reason from analysis
        if (analysis?.reasoning) {
          actionBody.removalReason = `Your post was removed for violating subreddit rules:\n\n${analysis.reasoning}`;
        }
      } else if (action === 'warn') {
        actionEndpoint = '/api/actions/warn';
        actionBody.warningMessage = analysis?.reasoning || 'Your post was flagged by the moderation team. Please review the subreddit rules.';
      }

      const actionResponse = await fetch(actionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionBody),
      });

      if (!actionResponse.ok) {
        const errorData = await actionResponse.json();
        throw new Error(errorData.message || `Failed to ${action} item`);
      }

      const actionResult = await actionResponse.json();

      if (!actionResult.success) {
        throw new Error(actionResult.message || `Failed to ${action} item`);
      }

      // Step 2: Log the decision to our system
      const reason = `${action.charAt(0).toUpperCase() + action.slice(1)} action taken via CoPilot. ${actionResult.message}`;
      await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: currentItem.postId,
          action,
          reason,
          aiSummary: analysis?.summary,
          confidence: analysis?.confidence,
        }),
      });

      // Step 3: Show success feedback
      setActionSuccess(`Successfully ${action}d item`);

      // Step 4: Move to next item after a brief delay
      setTimeout(() => {
        if (hasNextItem) {
          goToNext();
          setActionSuccess(null);
        } else {
          setActionSuccess('All items processed!');
        }
      }, 800);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} item`;
      console.error(`Error ${action}ing item:`, err);
      setActionError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

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

        {/* Notes Panel */}
        {currentItem && <NotesPanel postId={currentItem.postId} />}

        {/* Action Feedback Messages */}
        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-semibold">Action Failed</p>
            <p className="text-xs mt-1">{actionError}</p>
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
            <p className="font-semibold">✓ {actionSuccess}</p>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-300 bg-reddit-bg px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading !== null || !currentItem}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600"
          >
            {actionLoading === 'approve' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approve
          </button>
          <button
            onClick={() => handleAction('warn')}
            disabled={actionLoading !== null || !currentItem}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-orange-700 dark:hover:bg-orange-600"
          >
            {actionLoading === 'warn' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            Warn
          </button>
          <button
            onClick={() => handleAction('remove')}
            disabled={actionLoading !== null || !currentItem}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
          >
            {actionLoading === 'remove' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
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
