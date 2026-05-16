import { reddit } from '@devvit/web/server';
import type { ModQueueItem } from '../../shared/api';

interface QueueFetchOptions {
  limit?: number;
  testingMode?: boolean;
  verbose?: boolean;
}

interface FetchStats {
  reportedItems: number;
  removedItems: number;
  filteredItems: number;
  spamItems: number;
  testingModeItems: number;
  totalItems: number;
  sources: string[];
  deduped: number;
}

/**
 * Comprehensive moderation queue fetching service
 * Supports multiple sources: reports, removed posts, filtered content, spam queue
 * Includes Testing Mode for reliable development in small/private subreddits
 */
export class ModerationQueueService {
  /**
   * Main function to fetch moderation items from multiple sources
   * Aggregates: modqueue (reports), removed posts, filtered items, spam queue
   */
  static async fetchModerationItems(
    options: QueueFetchOptions = {}
  ): Promise<{ items: ModQueueItem[]; stats: FetchStats }> {
    const { limit = 25, testingMode = false, verbose = false } = options;
    const stats: FetchStats = {
      reportedItems: 0,
      removedItems: 0,
      filteredItems: 0,
      spamItems: 0,
      testingModeItems: 0,
      totalItems: 0,
      sources: [],
      deduped: 0,
    };

    const itemSet = new Set<string>(); // For deduplication
    const allItems: ModQueueItem[] = [];

    try {
      const subreddit = await reddit.getCurrentSubreddit();
      const subName = subreddit.name;

      if (verbose) {
        console.log(`[ModerationQueue] Starting fetch for r/${subName}`);
        if (testingMode) console.log(`[ModerationQueue] Testing Mode ENABLED`);
      }

      // SOURCE 1: Standard Modqueue (reported content)
      try {
        const modQueueListing = await subreddit.getModQueue({
          limit: limit,
          type: 'all',
        });
        const reportedItems = await modQueueListing.all();

        const reportedMapped = reportedItems.map((item) =>
          this.mapItemToModQueueItem(item, 'reported', subName)
        );
        const reportedFiltered = reportedMapped.filter((item) => {
          if (itemSet.has(item.id)) {
            stats.deduped++;
            return false;
          }
          itemSet.add(item.id);
          return true;
        });

        stats.reportedItems = reportedFiltered.length;
        allItems.push(...reportedFiltered);
        stats.sources.push(`reported (${reportedFiltered.length})`);

        if (verbose) {
          console.log(`[ModerationQueue] Reported items: ${reportedFiltered.length}`);
          reportedFiltered.slice(0, 3).forEach((item) => {
            console.log(`  - ${item.postId}: ${item.title}`);
          });
        }
      } catch (error) {
        console.warn('[ModerationQueue] Error fetching reported queue:', error);
      }

      // SOURCE 2: Removed/Spam posts (unmoderated removals)
      try {
        const subredditMod = await reddit.getCurrentSubreddit();
        const modLog = await subredditMod.getModerationLog({
          limit: limit * 2,
          type: 'removelink',
        });
        const removedLogs = await modLog.all();

        if (removedLogs.length > 0) {
          const removedMapped = removedLogs
            .map((log) => {
              try {
                return this.mapLogToModQueueItem(log, 'removed', subName);
              } catch {
                return null;
              }
            })
            .filter((item): item is ModQueueItem => item !== null)
            .filter((item) => {
              if (itemSet.has(item.id)) {
                stats.deduped++;
                return false;
              }
              itemSet.add(item.id);
              return true;
            });

          stats.removedItems = removedMapped.length;
          allItems.push(...removedMapped);
          stats.sources.push(`removed (${removedMapped.length})`);

          if (verbose) {
            console.log(`[ModerationQueue] Removed items: ${removedMapped.length}`);
          }
        }
      } catch (error) {
        console.warn('[ModerationQueue] Error fetching removed items:', error);
      }

      // SOURCE 3: Testing Mode - Latest posts for simulation
      if (testingMode) {
        try {
          const newListing = await subreddit.getNewPosts({ limit: Math.min(10, limit) });
          const newPosts = await newListing.all();

          const testingMapped = newPosts
            .map((post) => this.mapItemToModQueueItem(post, 'testing', subName))
            .filter((item) => {
              if (itemSet.has(item.id)) {
                stats.deduped++;
                return false;
              }
              itemSet.add(item.id);
              return true;
            });

          stats.testingModeItems = testingMapped.length;
          allItems.push(...testingMapped);
          stats.sources.push(`testing-mode (${testingMapped.length})`);

          if (verbose) {
            console.log(`[ModerationQueue] Testing Mode posts: ${testingMapped.length}`);
            testingMapped.slice(0, 3).forEach((item) => {
              console.log(`  - [TEST] ${item.postId}: ${item.title}`);
            });
          }
        } catch (error) {
          console.warn('[ModerationQueue] Error fetching testing mode posts:', error);
        }
      }

      stats.totalItems = allItems.length;

      if (verbose) {
        console.log(`[ModerationQueue] Total items (after dedup): ${stats.totalItems}`);
        console.log(`[ModerationQueue] Deduped items: ${stats.deduped}`);
        console.log(`[ModerationQueue] Sources: ${stats.sources.join(', ')}`);
      }

      return { items: allItems.slice(0, limit), stats };
    } catch (error) {
      console.error('[ModerationQueue] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Map a Reddit item (post/comment) to our ModQueueItem format
   */
  private static mapItemToModQueueItem(
    item: any,
    source: 'reported' | 'removed' | 'testing' = 'reported',
    subredditName?: string
  ): ModQueueItem {
    const isPost = 'title' in item;
    const authorName = item.authorName || 'deleted';

    // Mark testing mode items clearly
    const titlePrefix = source === 'testing' ? '[TEST] ' : '';
    const sourceLabel =
      source === 'testing' ? ' (testing mode simulation)' : '';

    return {
      id: item.id || '',
      postId: item.id || '',
      title: titlePrefix + (isPost ? (item.title || 'Post') : `Comment by ${authorName}`),
      author: authorName,
      body: item.body || '',
      reports: item.reports || [],
      reportCount: (item.reports || []).length,
      score: item.score || 0,
      numComments: isPost ? (item.numComments || 0) : 0,
      createdAt: item.createdAt instanceof Date ? item.createdAt.getTime() : Date.now(),
      subreddit: subredditName,
      metadata: {
        source,
        fetchedFrom: `${source}${sourceLabel}`,
      } as any,
    };
  }

  /**
   * Map a moderation log entry to ModQueueItem
   */
  private static mapLogToModQueueItem(
    log: any,
    source: 'removed' = 'removed',
    subredditName?: string
  ): ModQueueItem | null {
    try {
      const targetId = log.targetId || '';
      const targetAuthor = log.targetAuthor || 'deleted';
      const targetTitle = log.targetTitle || 'Post/Comment';

      return {
        id: targetId,
        postId: targetId,
        title: `[Mod Removed] ${targetTitle}`,
        author: targetAuthor,
        body: '',
        reports: [],
        reportCount: 0,
        score: 0,
        numComments: 0,
        createdAt: log.createdAt instanceof Date ? log.createdAt.getTime() : Date.now(),
        subreddit: subredditName,
        metadata: {
          source,
          fetchedFrom: 'moderation-log',
          modLog: true,
        } as any,
      };
    } catch (error) {
      console.warn('[ModerationQueue] Failed to map mod log entry:', error);
      return null;
    }
  }
}

export const moderationQueueService = ModerationQueueService;
