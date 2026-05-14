import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Clock, Edit2, Trash2, Plus, AlertCircle } from 'lucide-react';
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
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
            <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">CoPilot Notes</h3>
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
        <div className="m-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin">
            <MessageSquare size={28} className="text-blue-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="px-6 py-4 space-y-4">
              {/* Add Note Section */}
              <div>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note about this post..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNoteContent.trim()}
                  className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                    No notes yet. Add one above.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {note.author}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {formatDate(note.createdAt)}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{note.content}</p>
                        </div>
                        <div className="flex gap-1 ml-3 flex-shrink-0">
                          <button
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            title="Edit note"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 size={16} />
                          </button>
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
            <div className="px-6 py-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {decisions.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    No moderation decisions logged yet.
                  </p>
                ) : (
                  decisions.map((decision) => (
                    <div
                      key={decision.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow"
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
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            by {decision.moderator}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Clock size={14} />
                          <span className="text-xs">{formatDate(decision.timestamp)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        <strong>Reason:</strong> {decision.reason}
                      </div>

                      {decision.aiSummary && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                          <strong className="text-blue-800 dark:text-blue-400">AI Summary:</strong>{' '}
                          {decision.aiSummary}
                        </div>
                      )}

                      {decision.confidence && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          Confidence: <span className="font-semibold">{decision.confidence}%</span>
                        </div>
                      )}

                      {decision.notes && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
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
