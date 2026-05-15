NOTE: 1. Fix user account age and karma not loading up in the dashboard user summary section. 2. Add link to original post in the post title in dashboard.

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

- Phase 9: Spam/repost detection via heuristics
- Phase 10: Prompt tuning and performance optimization
- Queue prioritization (urgent cases first)
- Similar past cases lookup

---

## Project Status

**Current Phase:** 8 - User History & Reputation Display ✅ **COMPLETE**

**Build:** Clean, production-ready
**Features:** MVP complete + real Reddit integration + robust queue fetching + user context
**Code Quality:** TypeScript strict, modular, well-documented
**UI/UX:** Professional, responsive, real-time feedback, context-aware
**AI:** Real Gemini integration with rule-aware analysis
**Moderation:** Full Reddit API integration (approve/remove/warn)
**Testing:** Reliable multi-source queue + Testing Mode for development
**User Context:** Complete reputation and history display

**Key Improvement:** Moderators now have full visibility into user history and risk profile before making moderation decisions.

Next: Spam/repost detection via heuristics.
