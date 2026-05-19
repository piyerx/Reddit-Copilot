import './index.css';

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, AlertCircle, XCircle, Loader } from 'lucide-react';
import { useQueue } from './hooks/useQueue';
import { QueueCarousel } from './components/QueueCarousel';
import { CommentsView } from './components/CommentsView';
import { AISummary } from './components/AISummary';
import { NotesPanel } from './components/NotesPanel';
import { UserHistory } from './components/UserHistory';
import { SpamIndicators } from './components/SpamIndicators';
import { SimilarCases } from './components/SimilarCases';
import { PriorityIndicator } from './components/PriorityIndicator';
import type { PrioritizedItem } from '../shared/api';

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

  // Phase 10: Priority & Similar Cases
  const [priorityData, setPriorityData] = useState<PrioritizedItem | null>(null);

  // Fetch priority data when current item changes
  useEffect(() => {
    const fetchPriorityData = async () => {
      if (!currentItem) {
        setPriorityData(null);
        return;
      }

      try {
        // For now, we'll use the modqueue endpoint to calculate priority
        // In a full implementation, you might have a dedicated priority endpoint
        const response = await fetch('/api/priority-queue');
        if (!response.ok) return;

        const data = await response.json();
        const prioritized = data.items as PrioritizedItem[];
        const current = prioritized.find((item) => item.postId === currentItem.postId);
        if (current) {
          setPriorityData(current);
        }
      } catch (err) {
        console.warn('Failed to fetch priority data:', err);
      }
    };

    fetchPriorityData();
  }, [currentItem]);

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
          // Phase 10: Include post details and rules for similar cases tracking
          postTitle: currentItem.title,
          postBody: currentItem.body,
          postAuthor: currentItem.author,
          violatedRules: analysis?.violatedRules?.map(rule => 
            typeof rule === 'string' ? rule : rule.ruleTitle || rule.description
          ),
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
      <div className="flex min-h-screen items-center justify-center bg-reddit-bg px-4">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-white/90 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-slate-950/70">
          <h1 className="mb-2 text-lg font-bold tracking-tight text-red-600 dark:text-red-400">
            Error
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-reddit-bg px-4">
        <div className="panel w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/60 loading-shimmer" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Loading moderation queue...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-reddit-bg px-4">
        <div className="panel w-full max-w-sm p-6 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            No items in moderation queue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-reddit-bg px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl space-y-5 pb-28">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl mb-1">
            Moderation Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              {items.length} item{items.length !== 1 ? 's' : ''} in queue • CoPilot-assisted
            </span>
          </p>
        </div>

        {/* Priority Indicator (Phase 10) */}
        {priorityData && (
          <section>
            <PriorityIndicator
              urgency={priorityData.urgency}
              priorityScore={priorityData.priorityScore}
              reasons={priorityData.reasons}
            />
          </section>
        )}

        {/* Queue Item Card */}
        <section className="space-y-2">
          <h2 className="section-label">Post Review</h2>
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
          <h2 className="section-label">AI Analysis</h2>
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
              url={currentItem.url}
            />
          </section>
        )}

        {/* Similar Cases (Phase 10) */}
        {currentItem && analysis && (
          <section className="space-y-2">
            <h2 className="section-label">Moderation Precedents</h2>
            <SimilarCases
              postId={currentItem.postId}
              title={currentItem.title}
              body={currentItem.body}
              ruleViolated={
                Array.isArray(analysis.violatedRules) && analysis.violatedRules.length > 0
                  ? typeof analysis.violatedRules[0] === 'string'
                    ? analysis.violatedRules[0]
                    : (analysis.violatedRules[0] as any)?.ruleTitle
                  : undefined
              }
            />
          </section>
        )}

        {/* Comments */}
        <section className="space-y-2">
          <h2 className="section-label">Discussion</h2>
          <CommentsView comments={comments} loading={loading} />
        </section>

        {/* User History & Reputation */}
        {currentItem && (
          <section className="space-y-2">
            <h2 className="section-label">User Profile</h2>
            <UserHistory username={currentItem.author} />
          </section>
        )}

        {/* Notes Panel */}
        {currentItem && (
          <section className="space-y-2">
            <h2 className="section-label">Documentation</h2>
            <NotesPanel postId={currentItem.postId} />
          </section>
        )}

        {/* Action Feedback Messages */}
        {actionError && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/90 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300 shadow-sm animate-in">
            <p className="mb-1 font-semibold">Action failed</p>
            <p className="text-xs">{actionError}</p>
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/90 dark:bg-green-950/30 p-4 text-sm text-green-700 dark:text-green-300 shadow-sm animate-in">
            <p className="font-semibold">{actionSuccess}</p>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-reddit-bg/95 backdrop-blur-md px-4 py-3 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_-16px_40px_rgba(2,6,23,0.45)]">
        <div className="mx-auto flex max-w-3xl gap-2.5">
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading !== null || !currentItem}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600"
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:from-amber-600 dark:to-amber-700 dark:hover:from-amber-500 dark:hover:to-amber-600"
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:from-rose-600 dark:to-rose-700 dark:hover:from-rose-500 dark:hover:to-rose-600"
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
