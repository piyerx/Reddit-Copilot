/**
 * PromptTemplates: Optimized prompts for consistent and accurate moderation analysis
 * Focuses on clarity, structure, and specific guidance for Gemini
 */

export class PromptTemplates {
  /**
   * Optimized structured prompt for post analysis
   * Emphasizes rule-specific analysis and confidence justification
   */
  static getPostAnalysisPrompt(
    title: string,
    body: string,
    author: string,
    score: number,
    reports: string[],
    comments: string,
    rules: string
  ): string {
    return `You are an expert Reddit moderation assistant with years of experience.
Your job is to analyze posts and determine if they violate subreddit rules.

**SUBREDDIT RULES:**
${rules}

**POST TO REVIEW:**
Title: "${title}"
Author: u/${author}
Score: ${score}
Reports: ${reports.length > 0 ? reports.join(' | ') : 'None'}
Body: ${body || '[No text]'}

**RECENT DISCUSSION:**
${comments}

**YOUR ANALYSIS (JSON format):**
Respond ONLY with valid JSON. No markdown. No code blocks. Just raw JSON.

Analyze this post carefully:
1. Does it violate ANY of the stated rules? Which ones specifically?
2. How confident are you? (0-100, where 100 = certain violation, 0 = definitely allowed)
3. What action should a moderator take?
4. Why? Be specific - cite the exact rule and explain the violation.

{
  "summary": "1-2 sentence objective summary of the post content",
  "violatedRules": [
    {
      "ruleNumber": 1,
      "ruleTitle": "Rule title from above",
      "description": "Specific explanation of how this rule is violated"
    }
  ],
  "confidence": 75,
  "suggestedAction": "remove",
  "reasoning": "Detailed reasoning: This post violates [Rule X] because [specific evidence]. [Supporting details from comments/body]."
}`;
  }

  /**
   * Removal reason generation prompt
   * Creates clear, user-friendly removal messages
   */
  static getRemovalReasonPrompt(
    postTitle: string,
    violatedRules: string[],
    reasoning: string
  ): string {
    return `Generate a professional, friendly removal message for a Reddit post.

Post Title: "${postTitle}"
Violated Rules: ${violatedRules.join(', ')}
Moderation Reasoning: ${reasoning}

Write a removal message that:
1. Is concise (2-3 sentences max)
2. Cites the specific rule(s) violated
3. Explains briefly why
4. Suggests how to fix it (if applicable)
5. Is respectful and helpful, not punitive

Do NOT include Reddit formatting. Write plain text.

---
START MESSAGE:
`;
  }

  /**
   * Similar cases analysis prompt
   * Finds patterns in previous removals
   */
  static getSimilarCasesPrompt(
    currentPostTitle: string,
    currentPostBody: string,
    similarPosts: Array<{ title: string; removal_reason: string }>
  ): string {
    const similarList = similarPosts
      .slice(0, 5)
      .map((p, i) => `${i + 1}. "${p.title}" - Reason: ${p.removal_reason}`)
      .join('\n');

    return `Analyze the following post and compare it to similar previously-removed posts.

**CURRENT POST:**
Title: "${currentPostTitle}"
Body: ${currentPostBody || '[No text]'}

**SIMILAR PREVIOUSLY REMOVED POSTS:**
${similarList}

Compare these posts. Answer ONLY in JSON format:

{
  "hasSimilarPattern": true,
  "similarityScore": 0.85,
  "commonPatterns": ["low-effort repost", "spam promotion"],
  "insights": "This post follows the same pattern as 3 recent removals: X, Y, Z. All were removed for the same reason."
}`;
  }
}
