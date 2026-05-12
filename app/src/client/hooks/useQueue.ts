import { useCallback, useEffect, useState } from 'react';
import type {
  ModQueueResponse,
  QueueItemResponse,
  ModQueueItem,
  ModComment,
} from '../../shared/api';

interface QueueState {
  items: ModQueueItem[];
  currentItem: ModQueueItem | null;
  comments: ModComment[];
  loading: boolean;
  error: string | null;
  currentIndex: number;
}

export const useQueue = () => {
  const [state, setState] = useState<QueueState>({
    items: [],
    currentItem: null,
    comments: [],
    loading: true,
    error: null,
    currentIndex: 0,
  });

  // Fetch modqueue on mount
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/modqueue');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ModQueueResponse = await res.json();
        if (data.type !== 'modqueue') throw new Error('Unexpected response');

        setState((prev) => ({
          ...prev,
          items: data.items,
          loading: false,
        }));

        // Load first item
        if (data.items.length > 0) {
          void loadItem(data.items[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch modqueue', err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch queue',
        }));
      }
    };
    void fetchQueue();
  }, []);

  const loadItem = useCallback(async (postId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await fetch(`/api/queue-item/${postId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QueueItemResponse = await res.json();
      if (data.type !== 'queue-item') throw new Error('Unexpected response');

      setState((prev) => ({
        ...prev,
        currentItem: data.item,
        comments: data.comments,
        loading: false,
      }));
    } catch (err) {
      console.error(`Failed to load item ${postId}`, err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load item',
      }));
    }
  }, []);

  const goToNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex < prev.items.length) {
        void loadItem(prev.items[nextIndex].id);
        return { ...prev, currentIndex: nextIndex };
      }
      return prev;
    });
  }, [loadItem]);

  const goToPrevious = useCallback(() => {
    setState((prev) => {
      const prevIndex = prev.currentIndex - 1;
      if (prevIndex >= 0) {
        void loadItem(prev.items[prevIndex].id);
        return { ...prev, currentIndex: prevIndex };
      }
      return prev;
    });
  }, [loadItem]);

  return {
    ...state,
    loadItem,
    goToNext,
    goToPrevious,
    hasNextItem: state.currentIndex < state.items.length - 1,
    hasPreviousItem: state.currentIndex > 0,
  };
};
