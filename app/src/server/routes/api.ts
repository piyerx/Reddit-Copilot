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
  PostNotesResponse,
  DecisionLogResponse,
  CreateNoteResponse,
  LogDecisionResponse,
  CreateNoteRequest,
  LogDecisionRequest,
  ModerationActionResponse,
} from '../../shared/api';
import { aiService } from '../services/ai';
import { notesService } from '../services/notes';
import { ModerationService } from '../services/moderation';
import { ModerationQueueService } from '../services/moderation-queue';

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
    // Support testing mode via query parameter (?testing=true)
    const testingMode = c.req.query('testing') === 'true';
    const verbose = c.req.query('verbose') === 'true';

    // Fetch moderation items from multiple sources
    const { items, stats } = await ModerationQueueService.fetchModerationItems({
      limit: 25,
      testingMode,
      verbose,
    });

    if (verbose) {
      console.log('[API] Modqueue fetch stats:', {
        total: stats.totalItems,
        reported: stats.reportedItems,
        removed: stats.removedItems,
        testing: stats.testingModeItems,
        sources: stats.sources,
      });
    }

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
    const subreddit = await reddit.getCurrentSubreddit();
    const subredditName = subreddit.name;
    const rules = await reddit.getRules(subredditName);

    const formattedRules: SubredditRule[] = rules.map((rule, index) => ({
      id: `rule_${index}`,
      title: (rule as any).shortName || '',
      description: (rule as any).description || '',
      priority: (rule as any).priority || index,
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
    const post = await reddit.getPostById(postId as `t3_${string}`);
    if (!post) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Post not found' },
        404
      );
    }

    const reports: string[] = [];
    const item: ModQueueItem = {
      id: post.id || '',
      postId: post.id || '',
      title: (post as any).title || 'Post',
      author: (post as any).authorName || 'deleted',
      body: (post as any).body || '',
      reports: reports,
      reportCount: reports.length,
      score: post.score || 0,
      numComments: (post as any).numComments || 0,
      createdAt: post.createdAt instanceof Date ? post.createdAt.getTime() : Date.now(),
    };

    // Fetch top comments
    const properPostId = postId.startsWith('t3_') ? (postId as `t3_${string}`) : (`t3_${postId}` as const);
    const commentsListing = await reddit.getComments({
      postId: properPostId,
      limit: 5,
      pageSize: 5,
    });
    const allComments = await commentsListing.all();

    const comments: ModComment[] = allComments.map((comment) => ({
      id: comment.id || '',
      author: (comment as any).authorName || 'deleted',
      body: (comment as any).body || '',
      score: comment.score || 0,
      createdAt: comment.createdAt instanceof Date ? comment.createdAt.getTime() : Date.now(),
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
      const subreddit = await reddit.getCurrentSubreddit();
      const rules = await reddit.getRules(subreddit.name);
      subredditRules = rules.map((rule) => `${(rule as any).shortName || 'Rule'}: ${(rule as any).description || ''}`);
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
      const subreddit = await reddit.getCurrentSubreddit();
      const rules = await reddit.getRules(subreddit.name);
      subredditRules = rules.map((rule) => `${(rule as any).shortName || 'Rule'}: ${(rule as any).description || ''}`);
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

// Notes & Decision Log Endpoints
api.get('/notes/:postId', async (c) => {
  const postId = c.req.param('postId');

  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId is required' },
      400
    );
  }

  try {
    const notes = await notesService.getNotesForPost(postId);
    return c.json<PostNotesResponse>({
      type: 'post-notes',
      notes,
    });
  } catch (error) {
    console.error(`Error fetching notes for post ${postId}:`, error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch notes',
      },
      500
    );
  }
});

api.post('/notes', async (c) => {
  try {
    const { postId, content } = await c.req.json<CreateNoteRequest>();

    if (!postId || !content) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'postId and content are required' },
        400
      );
    }

    const username = await reddit.getCurrentUsername();
    const note = await notesService.addNote(postId, username || 'anonymous', content);

    return c.json<CreateNoteResponse>({
      type: 'note-created',
      note,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create note',
      },
      500
    );
  }
});

api.get('/decisions/:postId', async (c) => {
  const postId = c.req.param('postId');

  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId is required' },
      400
    );
  }

  try {
    const log = await notesService.getDecisionLog(postId);
    return c.json<DecisionLogResponse>({
      type: 'decision-log',
      log,
    });
  } catch (error) {
    console.error(`Error fetching decision log for post ${postId}:`, error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch decision log',
      },
      500
    );
  }
});

api.post('/decisions', async (c) => {
  try {
    const {
      postId,
      action,
      reason,
      aiSummary,
      confidence,
      notes,
    } = await c.req.json<LogDecisionRequest>();

    if (!postId || !action || !reason) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'postId, action, and reason are required' },
        400
      );
    }

    const moderator = await reddit.getCurrentUsername();
    const decision = await notesService.logDecision(
      postId,
      action,
      moderator || 'anonymous',
      reason,
      aiSummary,
      confidence,
      notes
    );

    return c.json<LogDecisionResponse>({
      type: 'decision-logged',
      log: decision,
    });
  } catch (error) {
    console.error('Error logging decision:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to log decision',
      },
      500
    );
  }
});

// Moderation Actions - Real Reddit API Integration
api.post('/actions/approve', async (c) => {
  try {
    const { postId } = await c.req.json<{ postId: string }>();

    if (!postId) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'postId is required' },
        400
      );
    }

    const result = await ModerationService.approveItem(postId);

    return c.json<ModerationActionResponse>({
      type: 'action-result',
      success: result.success,
      message: result.message,
      action: 'approve',
      postId,
    });
  } catch (error) {
    console.error('Error approving item:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve item',
      },
      500
    );
  }
});

api.post('/actions/remove', async (c) => {
  try {
    const { postId, removalReason } = await c.req.json<{
      postId: string;
      removalReason?: string;
    }>();

    if (!postId) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'postId is required' },
        400
      );
    }

    const result = await ModerationService.removeItem(postId, removalReason);

    return c.json<ModerationActionResponse>({
      type: 'action-result',
      success: result.success,
      message: result.message,
      action: 'remove',
      postId,
    });
  } catch (error) {
    console.error('Error removing item:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove item',
      },
      500
    );
  }
});

api.post('/actions/warn', async (c) => {
  try {
    const { postId, warningMessage } = await c.req.json<{
      postId: string;
      warningMessage: string;
    }>();

    if (!postId || !warningMessage) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'postId and warningMessage are required' },
        400
      );
    }

    const result = await ModerationService.warnUser(postId, warningMessage);

    return c.json<ModerationActionResponse>({
      type: 'action-result',
      success: result.success,
      message: result.message,
      action: 'warn',
      postId,
    });
  } catch (error) {
    console.error('Error warning user:', error);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send warning',
      },
      500
    );
  }
});
