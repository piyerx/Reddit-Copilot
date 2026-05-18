/**
 * SpamDetectionService: Heuristic-based spam and repost detection
 * Uses simple patterns to detect common spam, spam-like behavior, and likely reposts
 */

import { SimilarCasesService } from './similar-cases';

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
    post: { title: string; body?: string; url?: string; postId: string },
    subredditName: string,
    lookbackDays: number = 30
  ): Promise<SpamIndicator> {
    const { title, body, url, postId } = post;
    const reasons: string[] = [];
    let score = 0;

    try {
      const precedentCases = await SimilarCasesService.findSimilarCases(title, body || '');

      let similarMatches = 0;
      for (const precedent of precedentCases) {
        if (precedent.postId === postId) continue;

        if (precedent.similarity >= 90) {
          similarMatches++;
          score += 30;
          reasons.push(`Very similar prior removal: "${precedent.title.substring(0, 50)}..."`);
        } else if (precedent.similarity >= 75) {
          similarMatches++;
          score += 15;
          reasons.push(`Similar prior removal: "${precedent.title.substring(0, 50)}..."`);
        }

        if (url && precedent.removalReason.toLowerCase().includes(url.toLowerCase())) {
          score += 10;
          reasons.push('Possible repeated URL pattern');
        }
      }

      if (similarMatches > 1) {
        score += 20;
        reasons.push(`${similarMatches} similar precedent cases found`);
      }
    } catch (error) {
      console.warn('[SpamDetection] Error checking for reposts:', error);
      // Don't fail entirely on error
      reasons.push('Could not fully check precedent history');
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
          { title: post.title, body: post.body, url: post.url, postId: post.postId },
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
