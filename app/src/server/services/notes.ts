import { redis } from '@devvit/web/server';
import type { PostNote, DecisionLog } from '../../shared/api';

/**
 * Notes Service for managing post-level notes and decision logs.
 * Uses Devvit KV Store (Redis) for persistence.
 */

export class NotesService {
  private readonly NOTES_PREFIX = 'notes:';
  private readonly DECISIONS_PREFIX = 'decisions:';

  /**
   * Get all notes for a specific post.
   */
  async getNotesForPost(postId: string): Promise<PostNote[]> {
    try {
      const key = `${this.NOTES_PREFIX}${postId}`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error fetching notes for post ${postId}:`, error);
      return [];
    }
  }

  /**
   * Add a new note to a post.
   */
  async addNote(
    postId: string,
    author: string,
    content: string
  ): Promise<PostNote> {
    try {
      const notes = await this.getNotesForPost(postId);
      const newNote: PostNote = {
        id: `${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId,
        author,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      notes.push(newNote);
      const key = `${this.NOTES_PREFIX}${postId}`;
      await redis.set(key, JSON.stringify(notes));

      return newNote;
    } catch (error) {
      console.error(`Error adding note to post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing note.
   */
  async updateNote(
    postId: string,
    noteId: string,
    content: string
  ): Promise<PostNote | null> {
    try {
      const notes = await this.getNotesForPost(postId);
      const noteIndex = notes.findIndex((n) => n.id === noteId);

      if (noteIndex === -1) {
        return null;
      }

      notes[noteIndex].content = content;
      notes[noteIndex].updatedAt = Date.now();

      const key = `${this.NOTES_PREFIX}${postId}`;
      await redis.set(key, JSON.stringify(notes));

      return notes[noteIndex];
    } catch (error) {
      console.error(`Error updating note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a note from a post.
   */
  async deleteNote(postId: string, noteId: string): Promise<boolean> {
    try {
      const notes = await this.getNotesForPost(postId);
      const filteredNotes = notes.filter((n) => n.id !== noteId);

      if (filteredNotes.length === notes.length) {
        return false; // Note not found
      }

      const key = `${this.NOTES_PREFIX}${postId}`;
      if (filteredNotes.length === 0) {
        await redis.del(key);
      } else {
        await redis.set(key, JSON.stringify(filteredNotes));
      }

      return true;
    } catch (error) {
      console.error(`Error deleting note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Get decision log for a specific post.
   */
  async getDecisionLog(postId: string): Promise<DecisionLog[]> {
    try {
      const key = `${this.DECISIONS_PREFIX}${postId}`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error fetching decision log for post ${postId}:`, error);
      return [];
    }
  }

  /**
   * Log a moderation decision for a post.
   */
  async logDecision(
    postId: string,
    action: 'approve' | 'remove' | 'warn' | 'escalate' | 'review' | 'none',
    moderator: string,
    reason: string,
    aiSummary?: string,
    confidence?: number,
    notes?: string
  ): Promise<DecisionLog> {
    try {
      const decisions = await this.getDecisionLog(postId);
      const newDecision: DecisionLog = {
        id: `${postId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId,
        action,
        moderator,
        reason,
        aiSummary,
        confidence,
        timestamp: Date.now(),
        notes,
      };

      decisions.push(newDecision);
      const key = `${this.DECISIONS_PREFIX}${postId}`;
      await redis.set(key, JSON.stringify(decisions));

      return newDecision;
    } catch (error) {
      console.error(`Error logging decision for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest decision for a post (most recent action).
   */
  async getLatestDecision(postId: string): Promise<DecisionLog | null> {
    try {
      const decisions = await this.getDecisionLog(postId);
      return decisions.length > 0 ? decisions[decisions.length - 1] : null;
    } catch (error) {
      console.error(`Error fetching latest decision for post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Get decision history for a specific moderator.
   */
  async getModeratorDecisions(moderator: string): Promise<DecisionLog[]> {
    try {
      // This would require scanning all decision keys
      // For now, returning empty array. In production, consider using a separate index.
      console.warn('getModeratorDecisions not fully implemented');
      return [];
    } catch (error) {
      console.error(`Error fetching decisions for moderator ${moderator}:`, error);
      return [];
    }
  }

  /**
   * Clear all notes and decisions for a post (useful for cleanup).
   */
  async clearPostData(postId: string): Promise<void> {
    try {
      const notesKey = `${this.NOTES_PREFIX}${postId}`;
      const decisionsKey = `${this.DECISIONS_PREFIX}${postId}`;
      await Promise.all([redis.del(notesKey), redis.del(decisionsKey)]);
    } catch (error) {
      console.error(`Error clearing data for post ${postId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const notesService = new NotesService();
