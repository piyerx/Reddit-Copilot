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
        return 'bg-green-100 text-green-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'warn':
        return 'bg-orange-100 text-orange-800';
      case 'escalate':
        return 'bg-purple-100 text-purple-800';
      case 'review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-300 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-500" />
          <h3 className="font-semibold text-gray-900">CoPilot Notes</h3>
        </div>
        <div className="flex gap-2 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1 text-sm font-medium ${
              activeTab === 'notes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3 py-1 text-sm font-medium ${
              activeTab === 'decisions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            History ({decisions.length})
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block animate-spin">
            <MessageSquare size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              {/* Add Note Section */}
              <div className="mb-4">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note about this post..."
                  className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNoteContent.trim()}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet. Add one above.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {note.author}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {formatDate(note.createdAt)}
                          </p>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                            title="Edit note"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600 transition-colors"
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
            <div className="space-y-3">
              {decisions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No moderation decisions logged yet.
                </p>
              ) : (
                decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(
                            decision.action
                          )}`}
                        >
                          {decision.action.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          by {decision.moderator}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        <span className="text-xs">{formatDate(decision.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Reason:</strong> {decision.reason}
                    </div>

                    {decision.aiSummary && (
                      <div className="text-sm text-gray-600 mb-2 bg-blue-50 p-2 rounded">
                        <strong className="text-blue-800">AI Summary:</strong>{' '}
                        {decision.aiSummary}
                      </div>
                    )}

                    {decision.confidence && (
                      <div className="text-xs text-gray-500">
                        Confidence: {decision.confidence}%
                      </div>
                    )}

                    {decision.notes && (
                      <div className="text-xs text-gray-600 mt-2 border-t border-gray-200 pt-2">
                        <strong>Notes:</strong> {decision.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
