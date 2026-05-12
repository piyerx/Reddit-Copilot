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
  reports: string[];
  reportCount: number;
  score: number;
  numComments: number;
  createdAt: number;
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
export type AIAnalysis = {
  summary: string;
  violatedRules: string[];
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
