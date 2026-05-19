import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ModQueueItem, ModComment, AIAnalysis } from '../../shared/api';
import { PromptTemplates } from './prompt-templates';
import { AnalysisCacheService } from './analysis-cache';

/**
 * AI Service for moderation analysis using Gemini or fallback.
 * Uses structured prompts for reliable moderation recommendations.
 */

interface AIServiceConfig {
  apiKey?: string;
  provider: 'gemini' | 'openai' | 'demo';
}

export class AIService {
  private config: AIServiceConfig;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor(config: AIServiceConfig = { provider: 'demo' }) {
    this.config = config;
    // Auto-detect provider from environment if available
    if (!this.config.provider || this.config.provider === 'demo') {
      if (process.env.GOOGLE_API_KEY) {
        this.config.provider = 'gemini';
        this.config.apiKey = process.env.GOOGLE_API_KEY;
        this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      } else if (process.env.OPENAI_API_KEY) {
        this.config.provider = 'openai';
        this.config.apiKey = process.env.OPENAI_API_KEY;
      }
    } else if (config.provider === 'gemini' && config.apiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.apiKey);
    }
  }

  /**
   * Analyze a moderation queue item for rule violations.
   * Uses caching to avoid redundant API calls.
   */
  async analyzePost(
    post: ModQueueItem,
    comments: ModComment[],
    subredditRules?: string[]
  ): Promise<AIAnalysis> {
    try {
      // Check cache first
      const cached = await AnalysisCacheService.getCachedAnalysis(
        post.title,
        post.body
      );
      if (cached) {
        console.log(`[AIService] Using cached analysis for post ${post.postId}`);
        return cached;
      }

      let analysis: AIAnalysis;
      if (this.config.provider === 'gemini') {
        analysis = await this.analyzeWithGemini(post, comments, subredditRules);
      } else if (this.config.provider === 'openai') {
        analysis = await this.analyzeWithOpenAI(post, comments, subredditRules);
      } else {
        analysis = this.generateDemoAnalysis(post, comments);
      }

      // Cache the result
      await AnalysisCacheService.cacheAnalysis(post.title, post.body, analysis);
      return analysis;
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
   * Analyze with Gemini API - sends optimized structured prompt for better results.
   */
  private async analyzeWithGemini(
    post: ModQueueItem,
    comments: ModComment[],
    subredditRules?: string[]
  ): Promise<AIAnalysis> {
    if (!this.geminiClient) {
      console.warn('Gemini client not initialized, falling back to demo');
      return this.generateDemoAnalysis(post, comments);
    }

    try {
      const model = this.geminiClient.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const commentsText =
        comments.length > 0
          ? comments.map((c) => `- u/${c.author}: ${c.body}`).join('\n')
          : 'No comments';

      const rulesText = subredditRules?.length
        ? subredditRules
            .map((rule, idx) => `${idx + 1}. ${rule}`)
            .join('\n')
        : 'No specific rules provided';

      // Use optimized prompt template
      const prompt = PromptTemplates.getPostAnalysisPrompt(
        post.title,
        post.body || '',
        post.author,
        post.score,
        post.reports,
        commentsText,
        rulesText
      );

      const result = await model.generateContent(prompt);
      const responseText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Could not parse Gemini response, falling back to demo');
        return this.generateDemoAnalysis(post, comments);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and sanitize response
      return {
        summary: String(analysis.summary || '').slice(0, 200),
        violatedRules: Array.isArray(analysis.violatedRules)
          ? analysis.violatedRules.map((r: any) => {
              if (typeof r === 'string') return r;
              return {
                ruleNumber: parseInt(r.ruleNumber) || 0,
                ruleTitle: String(r.ruleTitle || '').slice(0, 100),
                description: String(r.description || '').slice(0, 200),
              };
            })
          : [],
        confidence: Math.max(
          0,
          Math.min(100, parseInt(String(analysis.confidence)) || 50)
        ),
        suggestedAction: [
          'approve',
          'review',
          'warn',
          'remove',
          'escalate',
        ].includes(String(analysis.suggestedAction))
          ? (analysis.suggestedAction as
              | 'approve'
              | 'review'
              | 'warn'
              | 'remove'
              | 'escalate')
          : 'review',
        reasoning: String(analysis.reasoning || '').slice(0, 300),
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.generateDemoAnalysis(post, comments);
    }
  }

  /**
   * Placeholder for OpenAI integration.
   */
  private async analyzeWithOpenAI(
    _post: ModQueueItem,
    _comments: ModComment[],
    _subredditRules?: string[]
  ): Promise<AIAnalysis> {
    // TODO: Implement OpenAI API integration
    // For now, return demo analysis as fallback
    return this.generateDemoAnalysis(_post, _comments);
  }

  /**
   * Demo removal reason.
   */
  private generateDemoRemovalReason(violatedRules: string[]): string {
    const rules = violatedRules.join(', ');
    return `Hello,\n\nYour post was removed because it likely violates: ${rules}.\n\nPlease review our subreddit guidelines before reposting.\n\nThanks!`;
  }

  /**
   * Generate removal reason with Gemini API - uses optimized prompt template.
   */
  private async generateReasonWithGemini(
    rules: string[],
    postTitle: string,
    violatedRules: string[]
  ): Promise<string> {
    if (!this.geminiClient) {
      return this.generateDemoRemovalReason(violatedRules);
    }

    try {
      const model = this.geminiClient.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = PromptTemplates.getRemovalReasonPrompt(
        postTitle,
        violatedRules,
        rules.join('\n')
      );

      const result = await model.generateContent(prompt);
      const reason =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return reason.slice(0, 500);
    } catch (error) {
      console.error('Gemini removal reason generation error:', error);
      return this.generateDemoRemovalReason(violatedRules);
    }
  }

  /**
   * Placeholder for OpenAI removal reason generation.
   */
  private async generateReasonWithOpenAI(
    _rules: string[],
    _postTitle: string,
    violatedRules: string[]
  ): Promise<string> {
    return this.generateDemoRemovalReason(violatedRules);
  }
}

// Singleton instance
export const aiService = new AIService();
