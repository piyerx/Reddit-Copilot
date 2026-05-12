import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  ModQueueResponse,
  QueueItemResponse,
  ModQueueItem,
  ModComment,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

// Moderation Queue Endpoints
api.get('/modqueue', async (c) => {
  try {
    // For now, return mock modqueue data since Devvit API may have limitations
    // In production, this would fetch from Reddit's modqueue
    const mockItems: ModQueueItem[] = [
      {
        id: 't3_mock1',
        postId: 't3_mock1',
        title: 'Example flagged post - Low effort content',
        author: 'testuser1',
        body: 'This is a test post that violates rule 2.',
        reports: ['Rule 2: Low effort content', 'Spam'],
        reportCount: 2,
        score: 5,
        numComments: 3,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 't3_mock2',
        postId: 't3_mock2',
        title: 'Another flagged post - Potential repost',
        author: 'testuser2',
        body: 'This appears to be a duplicate of a previous post.',
        reports: ['Rule 5: Repost'],
        reportCount: 1,
        score: 12,
        numComments: 8,
        createdAt: Date.now() - 7200000,
      },
    ];

    return c.json<ModQueueResponse>({
      type: 'modqueue',
      items: mockItems,
      total: mockItems.length,
    });
  } catch (error) {
    console.error('Error fetching modqueue:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch modqueue',
      },
      500
    );
  }
});

api.get('/queue-item/:postId', async (c) => {
  const postId = c.req.param('postId');

  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId is required' },
      400
    );
  }

  try {
    // Return mock data for now
    // In production, this would fetch real post data from Reddit
    const mockItem: ModQueueItem = {
      id: postId,
      postId: postId,
      title: 'Example Post Title',
      author: 'example_user',
      body: 'This is the body of the post with full content.',
      reports: ['Rule 2: Low effort', 'Spam'],
      reportCount: 2,
      score: 15,
      numComments: 5,
      createdAt: Date.now() - 3600000,
    };

    const mockComments: ModComment[] = [
      {
        id: 'c1',
        author: 'commenter1',
        body: 'This comment violates the rules.',
        score: 3,
        createdAt: Date.now() - 1800000,
      },
      {
        id: 'c2',
        author: 'commenter2',
        body: 'Another comment with context.',
        score: 7,
        createdAt: Date.now() - 900000,
      },
    ];

    return c.json<QueueItemResponse>({
      type: 'queue-item',
      item: mockItem,
      comments: mockComments,
    });
  } catch (error) {
    console.error(`Error fetching queue item ${postId}:`, error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch queue item',
      },
      500
    );
  }
});
