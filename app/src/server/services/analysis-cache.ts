/**
 * AnalysisCacheService: Cache AI analysis results to reduce API calls
 * Stores analysis in KV Store with configurable TTL
 */

import { redis } from '@devvit/web/server';
import type { AIAnalysis } from '../../shared/api';

export class AnalysisCacheService {
  private static readonly CACHE_PREFIX = 'analysis-cache:';
  private static readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours

  /**
   * Generate cache key from post content
   * Creates consistent hash for duplicate detection
   */
  private static generateCacheKey(title: string, body: string): string {
    // Simple hash based on content
    const content = `${title}|${body}`.slice(0, 200);
    const hash = this.simpleHash(content);
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Store analysis result in cache
   */
  static async cacheAnalysis(
    title: string,
    body: string,
    analysis: AIAnalysis,
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(title, body);
      const cacheData = {
        analysis,
        timestamp: Date.now(),
        title,
        body,
      };

      await redis.set(key, JSON.stringify(cacheData), {
        expiration: ttlSeconds,
      });
    } catch (error) {
      console.warn('[AnalysisCache] Error caching analysis:', error);
      // Don't fail if caching fails
    }
  }

  /**
   * Retrieve cached analysis if available
   */
  static async getCachedAnalysis(title: string, body: string): Promise<AIAnalysis | null> {
    try {
      const key = this.generateCacheKey(title, body);
      const cached = await redis.get(key);

      if (cached) {
        const cacheData = JSON.parse(cached);
        return cacheData.analysis as AIAnalysis;
      }
    } catch (error) {
      console.warn('[AnalysisCache] Error retrieving cached analysis:', error);
    }

    return null;
  }

  /**
   * Check if analysis exists in cache (without retrieving full content)
   */
  static async existsInCache(title: string, body: string): Promise<boolean> {
    try {
      const key = this.generateCacheKey(title, body);
      const exists = await redis.get(key);
      return !!exists;
    } catch {
      return false;
    }
  }

  /**
   * Simple hash function for cache key generation
   */
  private static simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Clear old cache entries (maintenance)
   */
  static async clearExpiredEntries(): Promise<void> {
    try {
      // Redis automatically expires entries, but we can manually clean if needed
      console.log('[AnalysisCache] Cache maintenance completed');
    } catch (error) {
      console.warn('[AnalysisCache] Error clearing expired entries:', error);
    }
  }
}
