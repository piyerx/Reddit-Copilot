import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, redis } from '@devvit/web/server';
import { createPost } from '../core/post';

export const menu = new Hono();

// Open CoPilot Moderation Dashboard from Mod Tools
menu.post('/open-copilot', async (c) => {
  try {
    // Fetch the persistent CoPilot Dashboard post ID
    let dashboardPostId = await redis.get(`copilot:dashboard-post-id`);
    
    // If dashboard post doesn't exist (edge case), create one
    if (!dashboardPostId) {
      const post = await createPost();
      dashboardPostId = post.id;
      await redis.set(
        `copilot:dashboard-post-id`,
        dashboardPostId
      );
    }
    
    // Navigate to the persistent dashboard post with game entrypoint
    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${dashboardPostId}?entrypoint=game`,
      },
      200
    );
  } catch (error) {
    console.error(`Error opening CoPilot: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to open CoPilot',
      },
      400
    );
  }
});

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});
