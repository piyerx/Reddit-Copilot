/**
 * SimilarCasesService: Find and retrieve similar previously-removed posts
 * Helps moderators maintain consistency by showing precedent
 */

import { redis } from '@devvit/web/server';

export interface SimilarCase {
  postId: string;
  title: string;
  author: string;
  removedAt: number;
  removalReason: string;
  similarity: number; // 0-100
  ruleViolated: string;
}

export class SimilarCasesService {
  private static readonly SIMILAR_CASES_PREFIX = 'similar-cases:';
  private static readonly MAX_CASES = 5;

  /**
   * Store removal record for future similar case matching
   */
  static async storeRemovalRecord(
    postId: string,
    title: string,
    author: string,
    removalReason: string,
    ruleViolated: string,
    body?: string
  ): Promise<void> {
    try {
      const record = {
        postId,
        title,
        author,
        body: body || '',
        removedAt: Date.now(),
        removalReason,
        ruleViolated,
      };

      // Store by rule for easy lookup
      const ruleKey = `${this.SIMILAR_CASES_PREFIX}rule:${ruleViolated}`;
      const records = await redis.get(ruleKey);
      const recordsList = records ? JSON.parse(records) : [];

      // Keep only last 50 records per rule
      recordsList.push(record);
      if (recordsList.length > 50) {
        recordsList.shift();
      }

      await redis.set(ruleKey, JSON.stringify(recordsList), {
        expiration: 90 * 24 * 60 * 60, // 90 days
      });

      // Also index by title keywords
      this.indexRemovalRecord(record);
    } catch (error) {
      console.warn('[SimilarCases] Error storing removal record:', error);
    }
  }

  /**
   * Find similar cases to current post
   */
  static async findSimilarCases(
    title: string,
    body: string,
    ruleViolated?: string
  ): Promise<SimilarCase[]> {
    try {
      const similarCases = new Map<string, SimilarCase>();

      const addMatches = (records: any[]) => {
        for (const record of records) {
          const similarity = this.calculateSimilarity(
            title,
            body,
            record.title,
            record.body || ''
          );

          if (similarity > 0.4) {
            similarCases.set(record.postId, {
              postId: record.postId,
              title: record.title,
              author: record.author || 'unknown',
              removedAt: record.removedAt || Date.now(),
              removalReason: record.removalReason || '',
              similarity: Math.round(similarity * 100),
              ruleViolated: record.ruleViolated || 'unknown',
            });
          }
        }
      };

      // If we know the rule, start there
      if (ruleViolated) {
        const ruleKey = `${this.SIMILAR_CASES_PREFIX}rule:${ruleViolated}`;
        const records = await redis.get(ruleKey);

        if (records) {
          addMatches(JSON.parse(records));
        }
      }

      const keywords = this.extractKeywords(`${title} ${body}`);
      for (const keyword of keywords.slice(0, 8)) {
        const keywordKey = `${this.SIMILAR_CASES_PREFIX}keyword:${keyword}`;
        const records = await redis.get(keywordKey);

        if (records) {
          addMatches(JSON.parse(records));
        }
      }

      // Sort by similarity and return top results
      return [...similarCases.values()]
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.MAX_CASES);
    } catch (error) {
      console.warn('[SimilarCases] Error finding similar cases:', error);
      return [];
    }
  }

  /**
   * Index removal record for search
   */
  private static async indexRemovalRecord(record: {
    postId: string;
    title: string;
    body: string;
    author: string;
    removedAt: number;
    removalReason: string;
    ruleViolated: string;
  }): Promise<void> {
    try {
      const keywords = this.extractKeywords(`${record.title} ${record.body}`);

      for (const keyword of keywords.slice(0, 5)) {
        const keywordKey = `${this.SIMILAR_CASES_PREFIX}keyword:${keyword}`;
        const records = await redis.get(keywordKey);
        const recordsList = records ? JSON.parse(records) : [];

        if (!recordsList.some((r: any) => r.postId === record.postId)) {
          recordsList.push(record);
          if (recordsList.length > 20) {
            recordsList.shift();
          }
          await redis.set(keywordKey, JSON.stringify(recordsList));
        }
      }
    } catch {
      // Indexing failure is non-critical
    }
  }

  private static extractKeywords(text: string): string[] {
    return [...new Set(text.toLowerCase().split(/\s+/).filter((w) => w.length > 3))];
  }

  /**
   * Calculate content similarity (0-1 scale)
   * Uses keyword overlap and length similarity
   */
  private static calculateSimilarity(
    titleA: string,
    bodyA: string,
    titleB: string,
    bodyB: string
  ): number {
    // Title similarity weight: 70%, body similarity: 30%
    const titleScore = this.stringSimilarity(titleA, titleB);
    const bodyScore =
      bodyA && bodyB ? this.stringSimilarity(bodyA.slice(0, 200), bodyB.slice(0, 200)) : 0.5;

    return titleScore * 0.7 + bodyScore * 0.3;
  }

  /**
   * Simple string similarity using Jaccard index (word-level)
   */
  private static stringSimilarity(a: string, b: string): number {
    const normalize = (s: string) => s.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const wordsA = new Set(normalize(a));
    const wordsB = new Set(normalize(b));

    if (wordsA.size === 0 || wordsB.size === 0) {
      return 0;
    }

    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;

    return union > 0 ? intersection / union : 0;
  }
}
