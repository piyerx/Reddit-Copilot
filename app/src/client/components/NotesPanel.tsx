import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Clock, Plus, AlertCircle } from 'lucide-react';
import type { PostNote, DecisionLog } from '../../shared/api';

interface NotesPanelProps {
  postId: string;
  className?: string;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ postId, className = '' }) => {
  const [notes, setNotes] = useState<PostNote[]>([]);
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'decisions'>('notes');
  const [error, setError] = useState<string | null>(null);

  // Fetch notes and decisions on mount or when postId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [notesRes, decisionsRes] = await Promise.all([
          fetch(`/api/notes/${postId}`),
          fetch(`/api/decisions/${postId}`),
        ]);

        if (!notesRes.ok || !decisionsRes.ok) {
          throw new Error('Failed to fetch notes and decisions');
        }

        const notesData = await notesRes.json();
        const decisionsData = await decisionsRes.json();

        setNotes(notesData.notes || []);
        setDecisions(decisionsData.log || []);
      } catch (err) {
        console.error('Error fetching notes data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [postId]);

  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim()) {
      return;
    }

    try {
      setAddingNote(true);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: newNoteContent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create note');
      }

      const data = await res.json();
      setNotes((prev) => [...prev, data.note]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }, [postId, newNoteContent]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (
    action: 'approve' | 'remove' | 'warn' | 'escalate' | 'review' | 'none'
  ): string => {
    switch (action) {
      case 'approve':
        return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800';
      case 'remove':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800';
      case 'warn':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800';
      case 'escalate':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
      case 'review':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div
      className={`card ${className}`}
    >
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950/70">
            <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">CoPilot Notes</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-3 text-sm font-semibold transition-all relative ${
            activeTab === 'notes'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Notes ({notes.length})
          {activeTab === 'notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-6 py-3 text-sm font-semibold transition-all relative ${
            activeTab === 'decisions'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          History ({decisions.length})
          {activeTab === 'decisions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 sm:m-5">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3 p-4 sm:p-5">
          <div className="h-4 w-28 rounded-full loading-shimmer" />
          <div className="space-y-2">
            <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 loading-shimmer" />
            <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 loading-shimmer" />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4 px-4 py-4 sm:px-5">
              {/* Add Note Section */}
              <div>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note about this post..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 placeholder-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder-slate-400"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNoteContent.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-2.5 font-semibold text-white transition-all hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-500"
                >
                  <Plus size={18} />
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No notes yet. Add one above.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {note.author}
                          </p>
                          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(note.createdAt)}
                          </p>
                          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{note.content}</p>
                        </div>
                        <div className="ml-3 flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          Internal
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Decisions Tab */}
          {activeTab === 'decisions' && (
            <div className="px-4 py-4 sm:px-5">
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {decisions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No moderation decisions logged yet.
                  </p>
                ) : (
                  decisions.map((decision) => (
                    <div
                      key={decision.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getActionColor(
                              decision.action
                            )}`}
                          >
                            {decision.action.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            by {decision.moderator}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock size={14} />
                          <span className="text-xs">{formatDate(decision.timestamp)}</span>
                        </div>
                      </div>

                      <div className="mb-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        <strong>Reason:</strong> {decision.reason}
                      </div>

                      {decision.aiSummary && (
                        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-300">
                          <strong className="text-blue-800 dark:text-blue-300">AI Summary:</strong>{' '}
                          {decision.aiSummary}
                        </div>
                      )}

                      {decision.confidence && (
                        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                          Confidence: <span className="font-semibold">{decision.confidence}%</span>
                        </div>
                      )}

                      {decision.notes && (
                        <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          <strong>Notes:</strong> {decision.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
