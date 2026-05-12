import type { ModQueueItem, ModComment, AIAnalysis } from '../../shared/api';

/**
 * AI Service for moderation analysis using Gemini or fallback.
 * Uses a simple prompt-based approach for deterministic outputs.
 */

interface AIServiceConfig {
  apiKey?: string;
  provider: 'gemini' | 'openai' | 'demo';
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = { provider: 'demo' }) {
    this.config = config;
    // Auto-detect provider from environment if available
    if (!this.config.provider || this.config.provider === 'demo') {
      if (process.env.GOOGLE_API_KEY) {
        this.config.provider = 'gemini';
        this.config.apiKey = process.env.GOOGLE_API_KEY;
      } else if (process.env.OPENAI_API_KEY) {
        this.config.provider = 'openai';
        this.config.apiKey = process.env.OPENAI_API_KEY;
      }
    }
  }

  /**
   * Analyze a moderation queue item for rule violations.
   */
  async analyzePost(
    post: ModQueueItem,
    comments: ModComment[],
    subredditRules?: string[]
  ): Promise<AIAnalysis> {
    try {
      if (this.config.provider === 'gemini') {
        return await this.analyzeWithGemini(post, comments, subredditRules);
      } else if (this.config.provider === 'openai') {
        return await this.analyzeWithOpenAI(post, comments, subredditRules);
      } else {
        return this.generateDemoAnalysis(post, comments);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      // Fallback to demo analysis on error
      return this.generateDemoAnalysis(post, comments);
    }
  }

  /**
   * Generate a removal reason based on violated rules.
   */
  async generateRemovalReason(
    rules: string[],
    postTitle: string,
    violatedRules: string[]
  ): Promise<string> {
    try {
      if (this.config.provider === 'gemini') {
        return await this.generateReasonWithGemini(
          rules,
          postTitle,
          violatedRules
        );
      } else if (this.config.provider === 'openai') {
        return await this.generateReasonWithOpenAI(
          rules,
          postTitle,
          violatedRules
        );
      } else {
        return this.generateDemoRemovalReason(violatedRules);
      }
    } catch (error) {
      console.error('Removal Reason Generation Error:', error);
      return this.generateDemoRemovalReason(violatedRules);
    }
  }

  /**
   * Demo analysis - heuristic-based fallback.
   */
  private generateDemoAnalysis(
    post: ModQueueItem,
    comments: ModComment[]
  ): AIAnalysis {
    const body = (post.body || '').toLowerCase();
    const title = (post.title || '').toLowerCase();
    const violations: string[] = [];
    let confidence = 0.5;

    // Simple heuristic detection
    if (post.body && post.body.length < 50) {
      violations.push('Potential low-effort content');
      confidence = 0.6;
    }

    if (post.reportCount > 0) {
      violations.push(`${post.reportCount} user report(s)`);
      confidence = Math.min(0.9, confidence + 0.2);
    }

    if (
      body.includes('repost') ||
      body.includes('copy') ||
      body.includes('duplicate')
    ) {
      violations.push('Possible repost or duplicate content');
      confidence = Math.min(0.95, confidence + 0.25);
    }

    if (body.includes('spam') || body.includes('promote')) {
      violations.push('Potential spam or self-promotion');
      confidence = Math.min(0.95, confidence + 0.2);
    }

    const action =
      confidence > 0.8
        ? 'remove'
        : confidence > 0.6
          ? 'warn'
          : confidence > 0.4
            ? 'review'
            : 'approve';

    return {
      summary: `Post by u/${post.author}: "${title.slice(0, 50)}${title.length > 50 ? '...' : ''}". ${
        comments.length > 0
          ? `Received ${comments.length} comments.`
          : 'No comments yet.'
      }`,
      violatedRules: violations,
      confidence: Math.round(confidence * 100),
      suggestedAction: action,
      reasoning:
        violations.length > 0
          ? `Detected potential issues: ${violations.join(', ')}.`
          : 'No significant issues detected.',
    };
  }

  /**
   * Placeholder for Gemini integration.
   */
  private async analyzeWithGemini(
    post: ModQueueItem,
    comments: ModComment[],
    subredditRules?: string[]
  ): Promise<AIAnalysis> {
    // TODO: Implement Gemini API integration
    // For now, return demo analysis as fallback
    return this.generateDemoAnalysis(post, comments);
  }

  /**
   * Placeholder for OpenAI integration.
   */
  private async analyzeWithOpenAI(
    post: ModQueueItem,
    comments: ModComment[],
    subredditRules?: string[]
  ): Promise<AIAnalysis> {
    // TODO: Implement OpenAI API integration
    // For now, return demo analysis as fallback
    return this.generateDemoAnalysis(post, comments);
  }

  /**
   * Demo removal reason.
   */
  private generateDemoRemovalReason(violatedRules: string[]): string {
    const rules = violatedRules.join(', ');
    return `Hello,\n\nYour post was removed because it likely violates: ${rules}.\n\nPlease review our subreddit guidelines before reposting.\n\nThanks!`;
  }

  /**
   * Placeholder for Gemini removal reason generation.
   */
  private async generateReasonWithGemini(
    rules: string[],
    postTitle: string,
    violatedRules: string[]
  ): Promise<string> {
    return this.generateDemoRemovalReason(violatedRules);
  }

  /**
   * Placeholder for OpenAI removal reason generation.
   */
  private async generateReasonWithOpenAI(
    rules: string[],
    postTitle: string,
    violatedRules: string[]
  ): Promise<string> {
    return this.generateDemoRemovalReason(violatedRules);
  }
}

// Singleton instance
export const aiService = new AIService();
