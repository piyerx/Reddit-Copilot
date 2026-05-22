import { reddit } from '@devvit/web/server';

type ModeratorLike = {
  username?: string;
};

type ListingLike<T> = {
  all?: () => Promise<T[]>;
};

export async function isCurrentUserModerator(): Promise<boolean> {
  const username = await reddit.getCurrentUsername();
  if (!username) {
    return false;
  }

  const subreddit = await reddit.getCurrentSubreddit();
  const moderatorsResult = (await reddit.getModerators({
    subredditName: subreddit.name,
  })) as ModeratorLike[] | ListingLike<ModeratorLike>;

  const moderators = Array.isArray(moderatorsResult)
    ? moderatorsResult
    : typeof moderatorsResult.all === 'function'
      ? await moderatorsResult.all()
      : [];

  return moderators.some((moderator) => moderator.username === username);
}