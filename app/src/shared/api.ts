export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Moderation Queue Types
export type ModQueueItem = {
  id: string;
  postId: string;
  title: string;
  author: string;
  body: string;
  url?: string;
  reports: string[];
  reportCount: number;
  score: number;
  numComments: number;
  createdAt: number;
  subreddit?: string;
};

export type ModQueueResponse = {
  type: 'modqueue';
  items: ModQueueItem[];
  total: number;
};

export type QueueItemResponse = {
  type: 'queue-item';
  item: ModQueueItem;
  comments: ModComment[];
};

export type ModComment = {
  id: string;
  author: string;
  body: string;
  score: number;
  createdAt: number;
};

// AI Analysis Types
export type ViolatedRule = {
  ruleNumber: number;
  ruleTitle: string;
  description?: string;
};

export type AIAnalysis = {
  summary: string;
  violatedRules: (string | ViolatedRule)[];
  confidence: number;
  suggestedAction: 'approve' | 'remove' | 'warn' | 'escalate' | 'review';
  reasoning: string;
};

export type AIAnalysisResponse = {
  type: 'ai-analysis';
  analysis: AIAnalysis;
  cached: boolean;
};

export type RemovalReasonResponse = {
  type: 'removal-reason';
  reason: string;
  politeTone: string;
};

// Subreddit Rules Types
export type SubredditRule = {
  id: string;
  title: string;
  description: string;
  priority: number;
};

export type RulesResponse = {
  type: 'rules';
  rules: SubredditRule[];
};

// Notes & Decision Log Types
export type PostNote = {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type DecisionLog = {
  id: string;
  postId: string;
  action: 'approve' | 'remove' | 'warn' | 'escalate' | 'review' | 'none';
  moderator: string;
  reason: string;
  aiSummary?: string;
  confidence?: number;
  timestamp: number;
  notes?: string;
};

export type PostNotesResponse = {
  type: 'post-notes';
  notes: PostNote[];
};

export type DecisionLogResponse = {
  type: 'decision-log';
  log: DecisionLog[];
};

export type CreateNoteRequest = {
  postId: string;
  content: string;
};

export type CreateNoteResponse = {
  type: 'note-created';
  note: PostNote;
};

export type LogDecisionRequest = {
  postId: string;
  action: 'approve' | 'remove' | 'warn' | 'escalate' | 'review' | 'none';
  reason: string;
  aiSummary?: string;
  confidence?: number;
  notes?: string;
};

export type LogDecisionResponse = {
  type: 'decision-logged';
  log: DecisionLog;
};

// Moderation Action Types
export type ModerationActionRequest = {
  postId: string;
  action: 'approve' | 'remove' | 'warn';
  removalReason?: string;
  warningMessage?: string;
};

export type ModerationActionResponse = {
  type: 'action-result';
  success: boolean;
  message: string;
  action: 'approve' | 'remove' | 'warn';
  postId: string;
};

// User History & Reputation Types
export type UserReputation = {
  username: string;
  accountAge: number | null;
  linkKarma: number;
  commentKarma: number;
  isVerified: boolean;
  isSuspended: boolean;
};

export type UserModerationHistory = {
  totalRemoved: number;
  totalWarnings: number;
  recentRemovals: Array<{
    postId: string;
    title: string;
    removedAt: number;
  }>;
  previousNotes: string[];
};

export type UserProfile = {
  reputation: UserReputation;
  modHistory: UserModerationHistory;
  riskLevel: 'low' | 'medium' | 'high';
  lastSeenActivity: number;
};

export type UserProfileResponse = {
  type: 'user-profile';
  profile: UserProfile;
};

// Spam Detection Types
export type SpamIndicator = {
  type: 'spam' | 'repost' | 'suspicious' | 'clean';
  confidence: number;
  reasons: string[];
  score: number;
};

export type SpamAnalysisResponse = {
  type: 'spam-analysis';
  analysis: SpamIndicator;
};
