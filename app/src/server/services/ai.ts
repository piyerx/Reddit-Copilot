import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ModQueueItem, ModComment, AIAnalysis } from '../../shared/api';

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
   * Analyze with Gemini API - sends structured prompt for moderation analysis.
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

      const prompt = `You are a Reddit moderation assistant. Analyze this post and determine if it violates subreddit rules.

**Subreddit Rules:**
${rulesText}

**Post Details:**
- Title: ${post.title}
- Author: u/${post.author}
- Body: ${post.body || '[no body text]'}
- Upvotes: ${post.score}
- Reports: ${post.reportCount > 0 ? post.reports.join(', ') : 'None'}

**Top Comments:**
${commentsText}

**Your task:**
1. Identify any rule violations (reference the rule number and title)
2. Rate confidence as a percentage (0-100)
3. Suggest an action: approve, review, warn, or remove
4. Provide brief, specific reasoning explaining which rule is violated and why

**Respond in this exact JSON format only:**
{
  "summary": "one-sentence summary of the post",
  "violatedRules": [
    {
      "ruleNumber": 1,
      "ruleTitle": "Rule title here",
      "description": "Why this rule is violated"
    }
  ],
  "confidence": 75,
  "suggestedAction": "remove",
  "reasoning": "Specific explanation of the violation"
}`;

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
   * Generate removal reason with Gemini API.
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

      const prompt = `You are a Reddit moderator. Generate a professional, concise removal message.

**Post Title:** ${postTitle}

**Subreddit Rules:**
${rules.join('\n')}

**Violated Rules:**
${violatedRules.join('\n')}

Write a friendly but firm removal notice (2-3 sentences) that explains why the post was removed and encourages the user to revise and resubmit. Be respectful but clear.`;

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
