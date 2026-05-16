/**
 * SpamDetectionService: Heuristic-based spam and repost detection
 * Uses simple patterns to detect common spam, spam-like behavior, and likely reposts
 */

import { reddit } from '@devvit/web/server';

export interface SpamIndicator {
  type: 'spam' | 'repost' | 'suspicious' | 'clean';
  confidence: number; // 0-100
  reasons: string[];
  score: number;
}

export class SpamDetectionService {
  /**
   * Common spam patterns and keywords
   */
  private static readonly SPAM_KEYWORDS = [
    'free money',
    'click here',
    'buy now',
    'limited time',
    'viagra',
    'crypto',
    'nft',
    'gambling',
    'win money',
    'work from home',
    'make cash',
  ];

  /**
   * Heuristic-based spam detection
   * Looks for patterns common in spam content
   */
  static detectSpam(post: { title: string; body: string; author: string }): SpamIndicator {
    const { title, body } = post;
    const content = `${title} ${body}`.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/|www\./g) || []).length;
    if (linkCount > 3) {
      score += 15;
      reasons.push(`Multiple links detected (${linkCount})`);
    }

    // Check for spam keywords
    for (const keyword of this.SPAM_KEYWORDS) {
      if (content.includes(keyword)) {
        score += 10;
        reasons.push(`Spam keyword: "${keyword}"`);
      }
    }

    // Check for excessive caps
    const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
    if (capsRatio > 0.5 && title.length > 10) {
      score += 10;
      reasons.push('Excessive capitalization');
    }

    // Check for repeated characters
    const repeatChars = content.match(/(.)\1{4,}/g);
    if (repeatChars && repeatChars.length > 0) {
      score += 8;
      reasons.push(`Repeated characters detected: ${repeatChars.slice(0, 2).join(', ')}`);
    }

    // Check for suspicious domain patterns
    if (
      content.includes('bit.ly') ||
      content.includes('tinyurl') ||
      content.includes('short.link')
    ) {
      score += 12;
      reasons.push('URL shortener detected (common spam vector)');
    }

    // Check for excessive punctuation
    const punctuationCount = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationCount > 2) {
      score += 8;
      reasons.push('Excessive punctuation');
    }

    // Determine type
    let type: 'spam' | 'suspicious' | 'clean' = 'clean';
    if (score >= 40) {
      type = 'spam';
    } else if (score >= 20) {
      type = 'suspicious';
    }

    return {
      type,
      confidence: Math.min(score, 100),
      reasons,
      score,
    };
  }

  /**
   * Repost detection using title and URL similarity
   * Compares against recent posts in subreddit
   */
  static async detectRepost(
    post: { title: string; url?: string; postId: string },
    subredditName: string,
    lookbackDays: number = 30
  ): Promise<SpamIndicator> {
    const { title, url, postId } = post;
    const reasons: string[] = [];
    let score = 0;

    try {
      // Fetch recent posts from subreddit
      const subreddit = await reddit.getSubredditByName(subredditName);
      const newListing = await subreddit.getNewPosts({ limit: 100 });
      const recentPosts = await newListing.all();

      const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - lookbackMs;

      let exactMatches = 0;
      let similarMatches = 0;

      for (const recentPost of recentPosts) {
        if (recentPost.id === postId) continue;
        if (recentPost.createdAt && recentPost.createdAt.getTime() < cutoffTime) continue;

        const recentTitle = (recentPost.title || '').toLowerCase();
        const currentTitle = title.toLowerCase();

        // Exact title match
        if (recentTitle === currentTitle) {
          exactMatches++;
          score += 30;
          reasons.push(`Exact title match: "${recentPost.title?.substring(0, 50)}..."`);
        }

        // Similar title (75%+ similarity)
        if (this.calculateSimilarity(recentTitle, currentTitle) > 0.75) {
          similarMatches++;
          score += 15;
          reasons.push(`Similar title: "${recentPost.title?.substring(0, 50)}..."`);
        }

        // Same URL
        if (
          url &&
          recentPost.url &&
          url.toLowerCase() === recentPost.url.toLowerCase()
        ) {
          score += 25;
          reasons.push('Duplicate URL');
        }
      }

      if (exactMatches > 1) {
        score += 20;
        reasons.push(`${exactMatches} exact matches found`);
      }

      if (similarMatches > 2) {
        score += 15;
        reasons.push(`${similarMatches} similar posts in recent history`);
      }
    } catch (error) {
      console.warn('[SpamDetection] Error checking for reposts:', error);
      // Don't fail entirely on error
      reasons.push('Could not fully check repost history');
    }

    // Determine type
    let type: 'repost' | 'suspicious' | 'clean' = 'clean';
    if (score >= 35) {
      type = 'repost';
    } else if (score >= 15) {
      type = 'suspicious';
    }

    return {
      type,
      confidence: Math.min(score, 100),
      reasons,
      score,
    };
  }

  /**
   * Combined spam + repost analysis
   */
  static async analyzePost(
    post: { title: string; body: string; author: string; url?: string; postId: string },
    subredditName: string
  ): Promise<SpamIndicator> {
    // Check for spam patterns
    const spamIndicator = this.detectSpam(post);

    // Check for reposts (only if not already flagged as high-confidence spam)
    let repostIndicator: SpamIndicator | null = null;
    if (spamIndicator.confidence < 60) {
      try {
        repostIndicator = await this.detectRepost(
          { title: post.title, url: post.url, postId: post.postId },
          subredditName
        );
      } catch (error) {
        console.warn('[SpamDetection] Error in repost detection:', error);
      }
    }

    // Combine results - pick the worse/more confident indicator
    if (repostIndicator && repostIndicator.confidence > spamIndicator.confidence) {
      return repostIndicator;
    }

    return spamIndicator;
  }

  /**
   * Simple string similarity using Levenshtein-like approach
   * Returns 0-1 score
   */
  private static calculateSimilarity(a: string, b: string): number {
    // Normalize strings
    const normalize = (s: string) => s.replace(/[^\w\s]/g, '').split(/\s+/).sort().join(' ');
    const normA = normalize(a);
    const normB = normalize(b);

    if (normA === normB) return 1;

    const wordsA = normA.split(' ');
    const wordsB = normB.split(' ');
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);

    // Jaccard similarity for word-level comparison
    const intersection = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;

    return union > 0 ? intersection / union : 0;
  }
}
