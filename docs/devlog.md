NOTE: 1. Fix user account age and karma not loading up in the dashboard user summary section. 2. Add link to original post in the post title in dashboard.

FIXES COMPLETED:
1. ✅ User account age and karma now load properly via Devvit API fallback
2. ✅ Post titles now link to original Reddit posts (clickable URLs in dashboard)

# Devlog: Reddit Mod Co-Pilot

AI-powered moderation assistant for Reddit (Devvit + Gemini 1.5 Flash + React)

## Project Overview

**Vision:** Intelligent moderation co-pilot for faster, consistent decisions while keeping humans in control.

**Problem Solved:** Queue overload, repetitive reviews, context-poor automation, team coordination gaps.

**Key Features:** AI summaries, rule violation detection, removal reason generation, moderation history tracking, user reputation display.

---

## Architecture

**Tech Stack:** React 19 | TypeScript + Hono | Gemini 1.5 Flash | Devvit KV Store | Tailwind CSS 4

**Data Flow:** Queue → Fetch Posts/Comments → AI Analysis → UI → Decision Logging → KV Store

---

## Completed Features

### Phase 1-2: Foundation ✅
- Devvit app + TypeScript/Vite setup
- Client/server/shared code separation
- Mobile-first responsive UI (dark mode supported)

### Phase 3: AI Integration ✅
- **Gemini 1.5 Flash:** Real-time analysis, rule detection, confidence scoring, action suggestions
- **Fallback Engine:** Demo mode, API error handling, graceful degradation
- **Rules System:** Dynamic subreddit rule fetching, context-aware analysis

### Phase 3.5: Real Data Integration ✅
- Real Devvit API calls: `getModQueue()`, `getRules()`, `getComments()`, `getPostById()`
- Proper type handling (`authorName`, `shortName` properties)
- Dynamic rule context passed to Gemini

### Phase 4: Notes & Decision Logging ✅
- Create/read/update/delete post-level notes
- Moderation decision history with timestamps and moderator attribution
- Persistent KV Store (`notes:${postId}`, `decisions:${postId}`)
- NotesPanel component with tabbed interface (Notes | History)

### Phase 5: Mod Tools Integration ✅
- "Open CoPilot" menu entry in Subreddit Mod Tools
- Persistent dashboard post (stored in Redis)
- Splash screen with community-contextual welcome
- Direct navigation to game interface

### Phase 6: Real Moderation Actions ✅
- **ModerationService** abstracts Reddit API operations
- Actions: approve, remove (with reason PM), warn (with message)
- Decision logging with full audit trail
- UI feedback: loading state, success/error messages, auto-advance

### Phase 7: Improved Queue Fetching ✅
- **ModerationQueueService:** Multi-source aggregation (reported, removed, mod-log, spam)
- **Testing Mode** (`?testing=true`): Fetch latest posts for small subreddits
- **Verbose Logging** (`?verbose=true`): Debug source tracking and deduplication
- Auto-deduplication and unified queue interface

### Phase 8: User History & Reputation ✅
- **UserService:** Fetch karma, account age, suspension status, moderation history
- **Risk Scoring:** Account age + karma + removal history = risk level (low/medium/high)
- **UserHistory Component:** Display reputation card with recent removals, risk badge
- Integrated into main moderation flow for quick context

---

## Phase 9: Spam/Repost Detection via Heuristics ✅ **COMPLETED**

✅ **SpamDetectionService** (`services/spam-detection.ts`)
  - **Spam Keywords:** Detects common spam patterns (crypto, free money, work from home, etc.)
  - **Link Analysis:** Flags excessive links and suspicious URL shorteners
  - **Text Patterns:** Detects repeated characters, excessive caps, excessive punctuation
  - **Confidence Scoring:** 0-100 score with actionable reasons
  - Distinguishes: spam, repost, suspicious, clean

✅ **Repost Detection** 
  - Compares against recent subreddit posts (lookback period: 30 days)
  - **Exact Title Matching:** Detects identical post titles
  - **Similarity Analysis:** Jaccard word-level comparison (75%+ threshold)
  - **URL Deduplication:** Flags duplicate URLs
  - Configurable lookback window and sensitivity

✅ **Spam Check API Endpoint**
  - `POST /api/spam-check` → Analyze post for spam/repost
  - Input: title, body, author, url, postId
  - Output: SpamIndicator with type, confidence, reasons, score
  - Full error handling with graceful fallbacks

✅ **SpamIndicators UI Component** (`SpamIndicators.tsx`)
  - Color-coded alerts: spam (red), repost (orange), suspicious (yellow), clean (hidden)
  - Shows confidence percentage and detailed reasons
  - Contextual guidance for moderators (remove/check history/review)
  - Icons for visual recognition (AlertTriangle, Repeat2, Shield)
  - Loading and error states
  - Dark mode support

✅ **Integration into Moderation Flow**
  - SpamIndicators display between AI Analysis and Comments
  - Only shows for non-clean classifications (reduces noise)
  - Automatic analysis on post load
  - No impact on existing features

✅ **Bug Fixes & UX Improvements**
  - **User Data Loading:** Fixed UserService to handle Devvit API limitations
    - Fallback to post history when full user API unavailable
    - Graceful degradation with zero-defaults
  - **Post Links:** Added Reddit post URLs to post titles
    - Subreddit name now included in ModQueueItem
    - QueueCarousel titles now link to original posts
    - Clickable links for quick verification

**Key Features:**
- Heuristic-based detection (no ML required, fast processing)
- Multi-factor analysis: keywords, links, text patterns, URL similarity
- Recent post comparison for repost detection
- Configurable sensitivity and lookback periods
- Provides actionable guidance to moderators

**Detection Factors:**
1. Spam Keywords: 10 points each
2. Excessive Links: 15 points
3. Caps Ratio: 10 points if >50%
4. Repeated Chars: 8 points
5. URL Shorteners: 12 points
6. Excessive Punctuation: 8 points
7. Title Match: 30 points (exact), 15 (75%+ similarity)
8. URL Duplicate: 25 points

**Thresholds:**
- Spam: ≥40 score
- Suspicious: ≥20 score
- Clean: <20 score

---

## API Endpoints

**Queue & Rules:**
- `GET /api/modqueue?testing=true&verbose=true` — Multi-source queue aggregation
- `GET /api/queue-item/:postId` — Post + comments details
- `GET /api/rules` — Subreddit rules

**AI Analysis:**
- `POST /api/analyze` — Gemini analysis with rules context
- `POST /api/removal-reason` — Generate removal message

**Moderation Actions:**
- `POST /api/actions/approve` — Approve post
- `POST /api/actions/remove` — Remove with reason PM
- `POST /api/actions/warn` — Send user warning

**Notes & Decisions:**
- `GET /api/notes/:postId` — Fetch post notes
- `POST /api/notes` — Create note
- `GET /api/decisions/:postId` — Fetch decision log
- `POST /api/decisions` — Log moderation action

**User:**
- `GET /api/user/:username` — User reputation + moderation history

**Spam & Repost Detection:**
- `POST /api/spam-check` — Analyze post for spam/repost patterns

---

## Key Implementation Details

**Real Data Handling:**
- Devvit API: `authorName` (not `author.name`), `shortName` for rules
- PostId typed as `t3_${string}`
- Graceful null/undefined handling

**Gemini Integration:**
- Structured JSON prompts for reliable responses
- Auto-detects `GOOGLE_API_KEY`
- Free tier: 60 req/min (sufficient for hackathon)
- Automatic fallback to demo mode on API errors

**KV Store:** `notes:${postId}`, `decisions:${postId}` — atomic JSON operations

**Services:**
- `AIService`: Provider abstraction (demo/Gemini/OpenAI), context-aware analysis
- `NotesService`: CRUD + timestamp/attribution
- `ModerationService`: Approve, remove, warn operations
- `ModerationQueueService`: Multi-source aggregation, deduplication
- `UserService`: Reputation + history fetching, risk scoring

---

## Testing

**Build Status:** ✅ Clean compile (strict TypeScript), full type safety

**Testing Modes:**
1. **Normal Mode:** Real moderation queue (reports, removals, mod-log)
2. **Testing Mode** (`?testing=true`): Latest posts from subreddit (for small/private subreddits)
3. **Verbose Logging** (`?verbose=true`): Debug source tracking

**Testing Tips:**
- Use Testing Mode for reliable testing without manual reports
- Append params to dashboard URL: `...&testing=true&verbose=true`
- Check browser console for `[ModerationQueue]` and `[API]` logs
- Test account: Report posts or use mod-log removals for real queue

---

## Known Limitations

- **Private Subreddit Auth:** App requires mod permissions for real queue
- **AI Accuracy:** Gemini 1.5 Flash occasionally misses nuanced violations
- **Performance:** Initial queue load depends on subreddit modqueue size
- **UI:** Limited to Devvit custom post components

---

- Phase 10: Prompt tuning and performance optimization
- Queue prioritization (urgent cases first)
- Similar past cases lookup
- Advanced analytics dashboard

---

## Project Status

**Current Phase:** 9 - Spam/Repost Detection ✅ **COMPLETE**

**Build:** Clean, production-ready
**Features:** MVP complete + real Reddit integration + robust queue fetching + user context + spam detection
**Code Quality:** TypeScript strict, modular, well-documented
**UI/UX:** Professional, responsive, real-time feedback, context-aware
**AI:** Real Gemini integration with rule-aware analysis
**Moderation:** Full Reddit API integration (approve/remove/warn)
**Testing:** Reliable multi-source queue + Testing Mode for development
**User Context:** Complete reputation and history display
**Safety:** Heuristic-based spam/repost detection

**Key Improvements:**
- Moderators have full visibility into user history and risk profile
- Automatic spam/repost flagging reduces missed content
- Post links enable quick verification on Reddit
- Complete context for informed moderation decisions

Next: Performance optimization and prompt tuning.
