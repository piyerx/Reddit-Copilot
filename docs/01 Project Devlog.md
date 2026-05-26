# Devlog: Reddit Mod Co-Pilot

AI-powered moderation assistant for Reddit built with Devvit, Gemini 1.5 Flash, React 19, and TypeScript.

## Project Snapshot

- Vision: build an intelligent moderation co-pilot that helps moderators move faster while staying fully in control.
- Problem addressed: queue overload, repetitive reviews, context-poor automation, and coordination gaps.
- Core value: AI summaries, likely rule detection, removal reason generation, moderation history, and user reputation context.

## Architecture

- Tech stack: React 19, TypeScript, Hono, Gemini 1.5 Flash, Devvit KV Store, and Tailwind CSS 4.
- Data flow: queue items are fetched, posts and comments are loaded, AI analysis runs, the moderator reviews the result, and the decision is logged to KV Store.

## Development Log

### Foundation

- Set up the Devvit app with a TypeScript and Vite-based workflow.
- Split the codebase into client, server, and shared layers.
- Built a mobile-first responsive UI with dark mode support.

### AI Integration

- Added Gemini 1.5 Flash for real-time analysis, rule detection, confidence scoring, and action suggestions.
- Included a graceful fallback path for API errors and demo mode.
- Wired subreddit rule fetching into the analysis flow so prompts stay context-aware.

### Real Data Integration

- Connected real Devvit API calls for queue items, rules, comments, and post lookup.
- Handled Reddit-specific field names such as `authorName` and `shortName` correctly.
- Passed rule context directly into Gemini prompts for better moderation guidance.

### Notes and Decision Logging

- Added post-level notes with create, read, update, and delete support.
- Added moderation decision history with timestamps and moderator attribution.
- Stored notes and decisions in persistent KV Store keys: `notes:${postId}` and `decisions:${postId}`.
- Built the Notes panel around a simple Notes and History tab layout.

### Mod Tools Integration

- Added an "Open CoPilot" menu entry in Subreddit Mod Tools.
- Stored a persistent dashboard post reference in Redis.
- Designed the splash screen to feel community-aware and welcoming.
- Kept navigation direct so moderators can move into the review flow quickly.

### Moderation Actions

- Wrapped Reddit moderation operations in a dedicated ModerationService.
- Supported approve, remove with reason PM, and warn with message.
- Logged every action with an audit trail.
- Added UI feedback for loading states, success and error messages, and auto-advance.

### Queue Quality Improvements

- Expanded queue fetching to aggregate reported items, removed items, mod-log entries, and spam sources.
- Added Testing Mode for small subreddits and private community workflows.
- Added Verbose Logging to help debug source tracking and deduplication.
- Introduced auto-deduplication and a unified queue interface.

### User History and Reputation

- Added a UserService to fetch karma, account age, suspension status, and moderation history.
- Combined account age, karma, and removal history into low, medium, and high risk tiers.
- Built a UserHistory component that surfaces reputation and recent removals.
- Brought user context into the main moderation flow so decisions are faster and better informed.

### Spam and Repost Detection

- Added a SpamDetectionService for common spam patterns such as crypto, free money, work from home, excessive links, suspicious URL shorteners, repeated characters, caps-heavy text, and excessive punctuation.
- Added repost detection using a 30-day lookback, exact title matching, Jaccard similarity, and URL deduplication.
- Scored results from 0 to 100 and labeled them as spam, repost, suspicious, or clean.
- Exposed the detection logic through `POST /api/spam-check`.
- Built the SpamIndicators UI to show color-coded alerts, confidence, reasons, and moderation guidance.
- Kept user data loading resilient when full Devvit profile data is not available.

### Performance and Prompt Tuning

- Added AnalysisCacheService to cache AI analysis results for 24 hours using hash-based keys.
- Added QueuePrioritizationService to score items from 0 to 100 using report count, user risk, spam and repost confidence, and recency.
- Added priority levels for critical, high, medium, and low items with reason summaries.
- Exposed the prioritized queue through `GET /api/priority-queue`.
- Added a Priority Indicator UI for urgency badges, score, and detailed reasons.
- Added SimilarCasesService to store removal records and find similar posts by title, body, and rule match.
- Set the similarity threshold above 40 percent, with 50 records per rule and 90-day retention.
- Exposed similar case lookup through `POST /api/similar-cases`.
- Stored removal decisions automatically as similar-case records.
- Tuned prompt templates to use structured JSON output for more consistent Gemini responses.

## API Endpoints

### Queue and Rules

- `GET /api/modqueue?testing=true&verbose=true` for multi-source queue aggregation.
- `GET /api/queue-item/:postId` for post and comment details.
- `GET /api/rules` for subreddit rules.

### AI Analysis

- `POST /api/analyze` for Gemini analysis with rule context.
- `POST /api/removal-reason` for generating a removal message.

### Moderation Actions

- `POST /api/actions/approve` to approve a post.
- `POST /api/actions/remove` to remove with a reason PM.
- `POST /api/actions/warn` to send a user warning.

### Notes and Decisions

- `GET /api/notes/:postId` to fetch post notes.
- `POST /api/notes` to create a note.
- `GET /api/decisions/:postId` to fetch a decision log.
- `POST /api/decisions` to log a moderation action.

### User and Safety

- `GET /api/user/:username` for user reputation and moderation history.
- `POST /api/spam-check` to analyze spam and repost patterns.

## Key Implementation Details

- Devvit API handling uses `authorName` instead of `author.name`, `shortName` for rules, and `t3_${string}` post IDs.
- Gemini integration auto-detects `GOOGLE_API_KEY` and falls back to demo mode on errors.
- KV Store keys are `notes:${postId}` and `decisions:${postId}` with atomic JSON operations.
- Services include AIService, NotesService, ModerationService, ModerationQueueService, and UserService.

## Testing and Reliability

- Build status is clean with strict TypeScript and full type safety.
- Normal mode uses the real moderation queue from reports, removals, and mod-log data.
- Testing Mode uses recent subreddit posts for small or private subreddits.
- Verbose Logging prints source tracking and deduplication details.
- For live data, moderators can report posts or rely on mod-log removals.

## Known Limitations

- Private subreddit auth still requires moderator permissions for the real queue.
- Gemini 1.5 Flash can still miss nuanced violations.
- Initial queue load depends on subreddit modqueue size.
- UI scope is limited to Devvit custom post components.

## Project Status

- The build is production-ready for the hackathon scope.
- The MVP is complete with real Reddit integration, robust queue fetching, user context, spam detection, and prioritization tooling.
- The codebase uses strict TypeScript, modular services, and documented flows.
- The UI is professional, responsive, context-aware, and feedback-rich.
- AI analysis is backed by real Gemini integration with rule-aware prompts and caching.
- Moderation actions support approve, remove, and warn flows.
- Safety relies on heuristic spam and repost detection.
- Performance improves through analysis caching and priority-based review.
- Consistency improves through similar-case storage.

## Recent Update

- Added a moderator access guard that checks the current Reddit user against subreddit moderators before serving the app.
- Protected the API routes and the Mod Tools menu action so non-mods receive a clean `403` instead of loading the dashboard.
- Added a dedicated unauthorized screen with dark-only styling, playful copy, and a self-made `snoo_lock.png` asset.
- Updated the splash and queue flow so non-mod users see the same access restriction message instead of the moderation UI.
- Kept the overall visual tone darker and softer so the restricted state feels subtle rather than harsh.
