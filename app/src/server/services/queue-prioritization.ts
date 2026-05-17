/**
 * QueuePrioritizationService: Ranks moderation items by urgency
 * Factors: user risk, report count, recency, spam indicators, pattern matching
 */

import type { ModQueueItem } from '../../shared/api';

export interface PrioritizedItem {
  item: ModQueueItem;
  priorityScore: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
}

export class QueuePrioritizationService {
  /**
   * Calculate priority score for a queue item
   * Higher score = higher priority (should be reviewed first)
   */
  static calculatePriority(
    item: ModQueueItem,
    userRiskLevel?: 'low' | 'medium' | 'high',
    spamConfidence?: number
  ): PrioritizedItem {
    let score = 0;
    const reasons: string[] = [];

    // Report count (0-30 points)
    if (item.reportCount > 5) {
      score += 30;
      reasons.push(`High report count: ${item.reportCount}`);
    } else if (item.reportCount > 2) {
      score += 20;
      reasons.push(`Multiple reports: ${item.reportCount}`);
    } else if (item.reportCount > 0) {
      score += 10;
      reasons.push(`User reported (${item.reportCount})`);
    }

    // User risk level (0-35 points)
    if (userRiskLevel === 'high') {
      score += 35;
      reasons.push('High-risk user (prior violations)');
    } else if (userRiskLevel === 'medium') {
      score += 15;
      reasons.push('Medium-risk user history');
    }

    // Spam confidence (0-25 points)
    if (spamConfidence && spamConfidence > 0) {
      const spamBoost = Math.round((spamConfidence / 100) * 25);
      score += spamBoost;
      reasons.push(`Spam/repost detected (${Math.round(spamConfidence)}%)`);
    }

    // Recency bonus (0-10 points) - very recent posts get slight boost
    const ageMinutes = (Date.now() - item.createdAt) / 60000;
    if (ageMinutes < 5) {
      score += 10;
      reasons.push('Very recent post');
    } else if (ageMinutes < 15) {
      score += 5;
      reasons.push('Recently posted');
    }

    // Negative factors (reduce priority)
    // Already removed/approved items lower priority
    if (item.title.includes('[Mod Removed]')) {
      score = Math.max(0, score - 20);
      reasons.push('Already moderated');
    }

    // Determine urgency level
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (score >= 60) {
      urgency = 'critical';
    } else if (score >= 40) {
      urgency = 'high';
    } else if (score >= 20) {
      urgency = 'medium';
    }

    return {
      item,
      priorityScore: Math.min(100, score),
      urgency,
      reasons,
    };
  }

  /**
   * Sort queue items by priority
   */
  static prioritizeQueue(
    items: ModQueueItem[],
    userRiskMap?: Map<string, 'low' | 'medium' | 'high'>,
    spamConfidenceMap?: Map<string, number>
  ): PrioritizedItem[] {
    const prioritized = items.map((item) =>
      this.calculatePriority(
        item,
        userRiskMap?.get(item.author),
        spamConfidenceMap?.get(item.postId)
      )
    );

    // Sort by priority score (descending)
    return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
