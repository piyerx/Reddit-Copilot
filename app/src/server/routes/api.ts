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
  AIAnalysisResponse,
  RemovalReasonResponse,
  SubredditRule,
  RulesResponse,
} from '../../shared/api';
import { aiService } from '../services/ai';

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
    // Fetch real modqueue from current subreddit
    const subreddit = await reddit.getCurrentSubreddit();
    const modQueueListing = await subreddit.getModQueue({ limit: 25, type: 'all' });
    const modQueuePosts = await modQueueListing.all();

    const items: ModQueueItem[] = await Promise.all(
      modQueuePosts.map(async (item) => {
        const reports = item.reports?.map((r) => r[0]) || [];
        const numComments = 'numComments' in item ? (item.numComments as number) : 0;
        const createdAt = 'createdAt' in item ? (item.createdAt as Date).getTime() : Date.now();

        return {
          id: item.id,
          postId: item.id,
          title: 'title' in item ? (item.title as string) : 'Comment by ' + item.author?.name,
          author: item.author?.name || 'deleted',
          body: 'body' in item ? (item.body as string) : (item.text as string) || '',
          reports: reports,
          reportCount: reports.length,
          score: item.score || 0,
          numComments: numComments,
          createdAt: createdAt,
        } as ModQueueItem;
      })
    );

    return c.json<ModQueueResponse>({
      type: 'modqueue',
      items,
      total: items.length,
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

api.get('/rules', async (c) => {
  try {
    const subredditName = await reddit.getCurrentSubredditName();
    const rules = await reddit.getRules(subredditName);

    const formattedRules: SubredditRule[] = rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description || '',
      priority: rule.priority || 0,
    }));

    return c.json<RulesResponse>({
      type: 'rules',
      rules: formattedRules,
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch rules',
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
    // Fetch real post data from Reddit
    const post = await reddit.getPostById(postId);
    if (!post) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Post not found' },
        404
      );
    }

    const reports = post.reports?.map((r) => r[0]) || [];
    const item: ModQueueItem = {
      id: post.id,
      postId: post.id,
      title: post.title,
      author: post.author?.name || 'deleted',
      body: post.body || '',
      reports: reports,
      reportCount: reports.length,
      score: post.score || 0,
      numComments: post.numComments || 0,
      createdAt: post.createdAt?.getTime() || Date.now(),
    };

    // Fetch top comments
    const commentsListing = await reddit.getComments({
      postId: postId,
      limit: 5,
      pageSize: 5,
    });
    const allComments = await commentsListing.all();

    const comments: ModComment[] = allComments.map((comment) => ({
      id: comment.id,
      author: comment.author?.name || 'deleted',
      body: comment.body || '',
      score: comment.score || 0,
      createdAt: comment.createdAt?.getTime() || Date.now(),
    }));

    return c.json<QueueItemResponse>({
      type: 'queue-item',
      item,
      comments,
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

// AI Analysis Endpoints
api.post('/analyze', async (c) => {
  try {
    const { item, comments } = await c.req.json<{
      item: ModQueueItem;
      comments: ModComment[];
    }>();

    if (!item) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'item is required' },
        400
      );
    }

    // Fetch real subreddit rules for context
    let subredditRules: string[] = [];
    try {
      const subredditName = await reddit.getCurrentSubredditName();
      const rules = await reddit.getRules(subredditName);
      subredditRules = rules.map((rule) => `${rule.title}: ${rule.description}`);
    } catch (ruleError) {
      console.warn('Could not fetch subreddit rules:', ruleError);
    }

    const analysis = await aiService.analyzePost(item, comments || [], subredditRules);

    return c.json<AIAnalysisResponse>({
      type: 'ai-analysis',
      analysis,
      cached: false,
    });
  } catch (error) {
    console.error('Error analyzing post:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to analyze post',
      },
      500
    );
  }
});

api.post('/removal-reason', async (c) => {
  try {
    const { violatedRules, postTitle } = await c.req.json<{
      violatedRules: string[];
      postTitle: string;
    }>();

    if (!violatedRules || violatedRules.length === 0) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'violatedRules is required' },
        400
      );
    }

    // Fetch real subreddit rules for removal reason context
    let subredditRules: string[] = [];
    try {
      const subredditName = await reddit.getCurrentSubredditName();
      const rules = await reddit.getRules(subredditName);
      subredditRules = rules.map((rule) => `${rule.title}: ${rule.description}`);
    } catch (ruleError) {
      console.warn('Could not fetch subreddit rules:', ruleError);
    }

    const reason = await aiService.generateRemovalReason(
      subredditRules,
      postTitle || 'Post',
      violatedRules
    );

    return c.json<RemovalReasonResponse>({
      type: 'removal-reason',
      reason,
      politeTone: reason,
    });
  } catch (error) {
    console.error('Error generating removal reason:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate removal reason',
      },
      500
    );
  }
});
