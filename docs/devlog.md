# Devlog: Reddit Mod Co-Pilot

An AI-powered moderation assistant built with Devvit, Gemini 1.5 Flash, and React.

## Project Overview

**Vision:** Create an intelligent moderation co-pilot that helps Reddit moderators make faster, more consistent decisions while keeping humans fully in control.

**Core Problem:** Reddit moderators face:
- Queue overload and repetitive reviews
- Slow, manual moderation workflows
- AutoModerator's lack of context awareness
- Difficulty coordinating decisions across teams

**Solution:** AI-assisted moderation interface that summarizes posts, suggests rule violations, generates removal reasons, and maintains moderation history.

---

## Architecture

### Tech Stack
- **Frontend:** React 19 with Devvit Custom Post Components
- **Backend:** TypeScript with Hono server framework
- **AI:** Gemini 1.5 Flash API (auto-detects via GOOGLE_API_KEY)
- **Storage:** Devvit KV Store (Redis)
- **Icons:** Lucide React (premium SVG)
- **Styling:** Tailwind CSS 4 with Reddit-native design

### Data Flow
```
Moderation Queue → Fetch Real Posts/Comments → AI Analysis Layer
     ↓
Generate Summary + Rule Matches + Confidence
     ↓
Display in UI → Moderator Decision → Log to KV Store
```

---

## Completed Features

### Phase 1-2: Core Infrastructure
✅ Devvit app setup with TypeScript/Vite
✅ Client/server/shared code separation
✅ Mobile-first responsive UI (single-column layout)
✅ Dark mode support throughout

### Phase 3: AI Integration
✅ **Gemini 1.5 Flash Integration**
  - Real-time post analysis with structured JSON prompts
  - Automatic rule violation detection
  - Confidence scoring (0-100%)
  - Suggested actions: approve/remove/warn/escalate/review
  - Professional removal reason generation

✅ **Fallback Heuristic Engine**
  - Graceful degradation when API unavailable
  - Demo analysis mode for development
  - Rate-limit handling (60 req/min free tier)

### Phase 3+: Real Data Integration
✅ **Real Devvit API Calls**
  - `reddit.getModQueue()` → Fetch flagged posts/comments
  - `reddit.getRules()` → Fetch subreddit-specific rules
  - `reddit.getComments()` → Load comment context
  - `reddit.getPostById()` → Fetch post details
  - Proper type casting with Devvit's `authorName`, `shortName` properties

✅ **Rules System**
  - Fetch real subreddit rules dynamically
  - Pass rules to Gemini for context-aware analysis
  - `/api/rules` endpoint for rule retrieval

### Phase 4: Notes & Decision Logging
✅ **Post-Level Notes System**
  - Create, read, update, delete notes per post
  - Mod notes persist in KV Store
  - Team coordination and decision memory

✅ **Decision Log**
  - Track all moderation actions (approve/remove/warn/escalate)
  - Store AI analysis context with each decision
  - Moderator attribution and timestamps
  - Full moderation history per post

✅ **NotesPanel Component**
  - Tabbed interface: Notes | Decision History
  - Add notes with keystroke efficiency
  - View past decisions with AI confidence/summary
  - Displays who made what decision and when

---

## UI/UX Implementation

### Design System
- Reddit-native background (#dae0e6 light, #111c1c dark)
- Professional, modern interface without emojis
- Consistent spacing, shadows, and typography
- Sticky bottom action bar for quick moderation

### Key Components
1. **QueueCarousel:** Displays current moderation item
   - Navigation (prev/next) with boundary checks
   - Post title, body, reports, score, comments count
2. **AISummary:** AI analysis results
   - Summary + reasoning
   - Rule violations with AlertTriangle icon
   - Confidence meter (gradient progress bar)
   - Action suggestion (colored pill badge)
3. **CommentsView:** Top comments context
   - Comment author, body, score
   - TrendingUp icons for vote scores
4. **NotesPanel:** Post-level coordination
   - Add moderator notes
   - View decision history
   - Track action trails

### Icon Usage (Lucide React)
- Bot → CoPilot Analysis header
- AlertTriangle → Rule violations
- ChevronLeft/Right → Navigation
- MessageSquare → Comments section
- TrendingUp → Confidence/scores
- CheckCircle2/AlertCircle/XCircle → Action buttons

---

## API Endpoints

### Moderation Queue
- `GET /api/modqueue` → Real queue from `reddit.getModQueue()`
- `GET /api/queue-item/:postId` → Post + comments details
- `GET /api/rules` → Subreddit rules

### AI Analysis
- `POST /api/analyze` → Gemini analysis with real rules context
- `POST /api/removal-reason` → Generate removal message

### Notes & Decisions (Phase 4)
- `GET /api/notes/:postId` → Fetch post notes
- `POST /api/notes` → Create note
- `GET /api/decisions/:postId` → Fetch decision log
- `POST /api/decisions` → Log moderation action

---

## Service Layer

### AIService (`ai.ts`)
- Modular provider abstraction (demo/Gemini/OpenAI)
- `analyzePost()` with subreddit rules context
- `generateRemovalReason()` with rule references
- Automatic fallback to demo on API errors

### NotesService (`notes.ts`)
- CRUD operations on post notes
- Decision log tracking
- Redis KV Store persistence
- Timestamp and moderator attribution

---

## Key Implementation Details

### Real Data Handling
- Devvit API uses `authorName` (not `author.name`)
- Rule objects have `shortName` property (not `title`)
- PostId properly typed as `t3_${string}` template literal
- Graceful null/undefined handling throughout

### Gemini Integration
- Structured JSON prompt for reliable responses
- Auto-detects GOOGLE_API_KEY from environment
- Free tier: 60 requests/minute (sufficient for hackathon)
- Rate limit handling + graceful degradation

### KV Store Usage
- `notes:${postId}` → Array of post notes
- `decisions:${postId}` → Array of moderation decisions
- Atomic operations with JSON serialization
- Full CRUD with timestamps

---

## Testing Status

✅ **Build:** Clean compile (TypeScript strict mode)
✅ **Types:** Full type safety across API contracts
✅ **APIs:** All endpoints callable with proper error handling
✅ **UI:** Mobile-responsive, dark mode verified
✅ **AI:** Gemini integration tested with structured prompts

---

## Known Limitations

1. **Private Subreddit Auth:** App requires mod permissions to fetch real queue
2. **AI Confidence:** Gemini 1.5 Flash occasionally misses nuanced violations
3. **UI Customization:** Limited to Devvit custom post components
4. **Performance:** Initial queue load depends on subreddit modqueue size

---

## Phase 5: Mod Tools Integration (In Progress)

✅ **Mod Tools Menu Entry**
  - "Open CoPilot" menu item in Subreddit Mod Tools
  - Single persistent dashboard post (created on app install)
  - Post ID stored in Redis for efficient reuse
  - Menu navigates directly to game entrypoint (bypasses splash)
  - Professional mod-only entry point

✅ **Splash Screen (Public/User-Facing)**
  - Community-contextual welcome screen
  - "Access Moderation Queue" button → expands to dashboard
  - Feature overview (AI analysis, removal reasons, team coordination)
  - Professional design with Sparkles icon and gradient
  - Dark mode support

🔄 **Future Enhancement: Smart Access Control**
  - Auto-expand for moderators (skip splash)
  - Prevent non-mods from accessing dashboard
  - Issue: Devvit event trust restrictions with auto-expansion
  - Solution: Will implement server-side validation + proper permission checks
  - Timeline: Phase 6+

---
- Phase 6: User history + reputation summary display
- Phase 7: Spam/repost detection via heuristics
- Phase 8: Prompt tuning and performance optimization
- Queue prioritization (urgent cases first)
- Similar past cases lookup

---

## Project Status

**Current Phase:** 5 - Mod Tools Integration (In Progress) ⏳

**Build:** Ready for testing with menu integration
**Features:** MVP + professional mod tools entry point
**Code Quality:** TypeScript strict, modular, well-documented
**UI/UX:** Professional Reddit-native design, mod-only access
**AI:** Real Gemini integration with fallback

Next: Real Reddit API integration for approve/remove/warn actions; real-world subreddit testing.
