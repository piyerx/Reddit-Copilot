import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, AlertCircle, XCircle, Loader } from 'lucide-react';
import { useQueue } from './hooks/useQueue';
import { QueueCarousel } from './components/QueueCarousel';
import { CommentsView } from './components/CommentsView';
import { AISummary } from './components/AISummary';
import { NotesPanel } from './components/NotesPanel';
import { UserHistory } from './components/UserHistory';
import { SpamIndicators } from './components/SpamIndicators';

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
    <div className="min-h-screen bg-reddit-bg px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6 pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Moderation Hub
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              {items.length} item{items.length !== 1 ? 's' : ''} in queue • CoPilot-assisted
            </span>
          </p>
        </div>

        {/* Queue Item Card */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">Post Review</h2>
          <QueueCarousel
            item={currentItem}
            currentIndex={currentIndex}
            total={items.length}
            onNext={goToNext}
            onPrevious={goToPrevious}
            hasNext={hasNextItem}
            hasPrevious={hasPreviousItem}
          />
        </section>

        {/* CoPilot Analysis */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">AI Analysis</h2>
          <AISummary analysis={analysis} loading={analysisLoading} />
        </section>

        {/* Spam & Repost Detection */}
        {currentItem && (
          <section>
            <SpamIndicators
              postId={currentItem.postId}
              title={currentItem.title}
              body={currentItem.body}
              author={currentItem.author}
            />
          </section>
        )}

        {/* Comments */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">Discussion</h2>
          <CommentsView comments={comments} loading={loading} />
        </section>

        {/* User History & Reputation */}
        {currentItem && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">User Profile</h2>
            <UserHistory username={currentItem.author} />
          </section>
        )}

        {/* Notes Panel */}
        {currentItem && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1">Documentation</h2>
            <NotesPanel postId={currentItem.postId} />
          </section>
        )}

        {/* Action Feedback Messages */}
        {actionError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300 animate-in">
            <p className="font-semibold mb-1">⚠️ Action Failed</p>
            <p className="text-xs">{actionError}</p>
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-700 dark:text-green-300 animate-in">
            <p className="font-semibold">✓ {actionSuccess}</p>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-reddit-bg backdrop-blur-sm px-4 py-4 shadow-2xl dark:shadow-slate-900">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading !== null || !currentItem}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95 disabled:from-slate-300 dark:disabled:from-slate-700 px-4 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg dark:from-green-700 dark:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700"
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
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 disabled:from-slate-300 dark:disabled:from-slate-700 px-4 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg dark:from-orange-700 dark:to-orange-800 dark:hover:from-orange-600 dark:hover:to-orange-700"
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
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 disabled:from-slate-300 dark:disabled:from-slate-700 px-4 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg dark:from-red-700 dark:to-red-800 dark:hover:from-red-600 dark:hover:to-red-700"
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
