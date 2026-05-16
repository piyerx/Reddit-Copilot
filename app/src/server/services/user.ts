/**
 * UserService: Fetch and aggregate user history, reputation, and moderation context
 * Provides moderators with a quick view of user's past behavior and moderation record
 */

import { reddit } from '@devvit/web/server';

export interface UserReputation {
  username: string;
  accountAge: number; // days
  linkKarma: number;
  commentKarma: number;
  isVerified: boolean;
  isSuspended: boolean;
}

export interface UserModerationHistory {
  totalRemoved: number;
  totalWarnings: number;
  recentRemovals: Array<{
    postId: string;
    title: string;
    removedAt: number;
  }>;
  previousNotes: string[];
}

export interface UserProfile {
  reputation: UserReputation;
  modHistory: UserModerationHistory;
  riskLevel: 'low' | 'medium' | 'high'; // Based on history
  lastSeenActivity: number; // timestamp
}

export class UserService {
  /**
   * Fetch user reputation and basic profile info
   * Note: Devvit API limitations mean we fetch karma and account age from available post/comment data
   */
  static async getUserReputation(username: string): Promise<UserReputation> {
    try {
      // Try to get user data - Devvit may not have full user API, so we use fallback approach
      let accountAge = 0;
      let linkKarma = 0;
      let commentKarma = 0;
      let isVerified = false;
      let isSuspended = false;

      try {
        // Attempt to get user profile via getUser (if available in Devvit API)
        const user = await (reddit as any).getUser(username);
        if (user) {
          accountAge = Math.floor((Date.now() - (user.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24));
          linkKarma = user.linkKarma || 0;
          commentKarma = user.commentKarma || 0;
          isVerified = user.isVerified || false;
          isSuspended = user.isSuspended || false;
        }
      } catch (getUserError) {
        console.warn(`[UserService] getUser not available, using fallback: ${getUserError}`);
        // Fallback: Try to estimate from user submissions
        try {
          const userPosts = await reddit.getPostsByUser({
            username,
            limit: 1,
          });
          if (userPosts && userPosts.length > 0) {
            const post = userPosts[0];
            linkKarma = (post as any).score || 0;
            if (post.createdAt) {
              accountAge = Math.floor((Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            }
          }
        } catch (postsError) {
          console.warn(`[UserService] Could not fetch user posts: ${postsError}`);
        }
      }

      return {
        username,
        accountAge,
        linkKarma,
        commentKarma,
        isVerified,
        isSuspended,
      };
    } catch (error) {
      console.error(`[UserService] Error fetching reputation for ${username}:`, error);
      // Return minimal data on error
      return {
        username,
        accountAge: 0,
        linkKarma: 0,
        commentKarma: 0,
        isVerified: false,
        isSuspended: false,
      };
    }
  }

  /**
   * Fetch user's moderation history from mod log
   * This is approximate based on mod log and cached decision history
   */
  static async getUserModerationHistory(
    username: string,
    subredditName: string
  ): Promise<UserModerationHistory> {
    try {
      // Fetch mod log items for this user
      const modLog = await reddit.getModLog({
        subreddit: subredditName,
        user: username,
      });

      const removedPosts = modLog
        .filter((log: any) => log.action === 'remove')
        .slice(0, 10)
        .map((log: any) => ({
          postId: log.targetId || '',
          title: log.targetTitle || 'Removed content',
          removedAt: log.createdAt?.getTime() || 0,
        }));

      const warningCount = modLog.filter((log: any) => log.action === 'warn').length;
      const removalCount = modLog.filter((log: any) => log.action === 'remove').length;

      return {
        totalRemoved: removalCount,
        totalWarnings: warningCount,
        recentRemovals: removedPosts,
        previousNotes: [],
      };
    } catch (error) {
      console.error(`[UserService] Error fetching moderation history for ${username}:`, error);
      // Return empty history on error
      return {
        totalRemoved: 0,
        totalWarnings: 0,
        recentRemovals: [],
        previousNotes: [],
      };
    }
  }

  /**
   * Calculate user risk level based on history and reputation
   */
  static calculateRiskLevel(
    reputation: UserReputation,
    modHistory: UserModerationHistory
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // New accounts are slightly more risky
    if (reputation.accountAge < 30) {
      riskScore += 2;
    } else if (reputation.accountAge < 365) {
      riskScore += 1;
    }

    // Low karma users are riskier
    if (reputation.commentKarma < 100) {
      riskScore += 2;
    } else if (reputation.commentKarma < 1000) {
      riskScore += 1;
    }

    // Users with moderation history are higher risk
    if (modHistory.totalRemoved > 5) {
      riskScore += 2;
    } else if (modHistory.totalRemoved > 0) {
      riskScore += 1;
    }

    if (modHistory.totalWarnings > 2) {
      riskScore += 2;
    } else if (modHistory.totalWarnings > 0) {
      riskScore += 1;
    }

    // Suspended or unverified accounts
    if (reputation.isSuspended) {
      riskScore += 3;
    }

    if (riskScore <= 2) return 'low';
    if (riskScore <= 4) return 'medium';
    return 'high';
  }

  /**
   * Get complete user profile with all context
   */
  static async getUserProfile(
    username: string,
    subredditName: string
  ): Promise<UserProfile> {
    const [reputation, modHistory] = await Promise.all([
      this.getUserReputation(username),
      this.getUserModerationHistory(username, subredditName),
    ]);

    const riskLevel = this.calculateRiskLevel(reputation, modHistory);

    return {
      reputation,
      modHistory,
      riskLevel,
      lastSeenActivity: Date.now(),
    };
  }
}
