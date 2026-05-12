
# Reddit Mod Co-Pilot
## AI-Powered Context-Aware Moderation Assistant for Reddit Mods

---

# Overview

Reddit Mod Co-Pilot is an AI-assisted moderation tool built using Reddit Devvit for the Reddit Mod Tools & Migrated Apps Hackathon.

The tool is designed to reduce moderator workload by helping moderators:
- review flagged posts faster
- understand moderation context instantly
- make more consistent moderation decisions
- reduce repetitive manual tasks
- improve moderation team coordination

The app is NOT an autonomous moderation bot.

Instead:
> It acts as an intelligent moderation assistant ("Co-Pilot") that helps moderators make decisions faster while keeping humans fully in control.

---

# Why This Project Exists

Research from Reddit moderator discussions revealed recurring pain points:

## Major Problems Found

### 1. Too Much Manual Review
Moderators spend massive time:
- reviewing reports
- checking context
- handling repetitive rule violations
- writing removal reasons
- managing queue overload

### 2. Automation Is Too Dumb
AutoModerator:
- lacks context understanding
- creates false positives
- misses nuance
- is hard to configure/debug

### 3. Poor Moderation UX
Mods repeatedly complain about:
- too many clicks
- slow workflows
- missing coordination tools
- lack of post-level notes
- weak moderation visibility

### 4. Lack of Context
Moderators often need to:
- check user history
- inspect comment chains
- search previous similar cases
- manually infer likely rule violations

This creates:
- decision fatigue
- inconsistent moderation
- slow queue processing

---

# Project Goal

Build a polished moderation assistant that:
- understands context
- summarizes posts/comments
- suggests likely rule violations
- generates moderation actions
- improves moderator workflow speed

---

# Core Product Vision

## "AI Assistant, Not AI Judge"

The tool should:
- help moderators
- accelerate workflows
- reduce repetitive effort

The tool should NOT:
- automatically ban users
- fully automate moderation
- replace moderators

---

# Hackathon Alignment

This project aligns strongly with judging criteria:

| Criteria | Alignment |
|---|---|
| Community Impact | Saves moderator time |
| Reliable UX | Simple one-screen moderation flow |
| Polish | Modern AI-assisted workflow |
| Ecosystem Impact | Broadly useful for many subreddits |
| Innovation | Context-aware moderation assistance |

---

# Tech Stack

## Core Stack

### Reddit Platform
- Devvit SDK
- Reddit APIs
- Devvit App Hosting

### Frontend
- Devvit Custom Post Components
- React-like Devvit UI Components
- TypeScript

### Backend Logic
- TypeScript
- Devvit server functions

### AI Layer
Choose one:
- OpenAI API
- Gemini API

Recommended:
- Gemini 1.5 Flash (fast + cheap)

### Storage
Devvit KV Store:
- moderation notes
- decision history
- cached AI summaries
- subreddit rules

---

# High-Level Architecture

```text
Moderator Queue Item
        ↓
Fetch Post + Comments + Metadata
        ↓
AI Processing Layer
        ↓
Generate:
- Summary
- Rule Match
- Confidence
- Suggested Action
- Removal Reason
        ↓
Display in Moderation UI
        ↓
Moderator Decision
        ↓
Store Notes + Action History
```

---

# MVP Features (Must Build)

# 1. AI Queue Summarizer

## Purpose

Quickly summarize flagged posts/comments.

## Input

* post title
* post body
* top comments
* reports
* metadata

## Output

Example:

```text
Summary:
User posted a low-effort meme repost with no meaningful discussion.

Potential Issue:
Likely violates Rule 2 (Low-effort content)

Confidence:
82%
```

## Benefits

* reduces reading time
* helps moderators triage faster

---

# 2. Rule Matching Engine

## Purpose

Match content against subreddit rules.

## Workflow

Moderators input subreddit rules.

AI evaluates:

* which rules may apply
* why
* confidence level

## Example

```text
Possible Violated Rules:
- Rule 2: Low-effort content
- Rule 5: Reposts

Reason:
Image appears reposted and title lacks original discussion value.
```

---

# 3. Mod Notes System

## Purpose

Provide post-level moderation memory.

## Features

* internal moderator notes
* decision logs
* team coordination comments
* moderation history

## Example

```text
Moderator Notes:
- User warned previously for repost spam
- Similar content removed last week
```

## Why Important

Research repeatedly showed:

> moderators desperately want post-level notes.

This is a high-value feature.

---

# 4. One-Click Removal Reason Generator

## Purpose

Reduce repetitive typing.

## Workflow

AI generates:

* polite removal message
* violated rule references
* customizable tone

## Example

```text
Hello,

Your post was removed because it likely violates Rule 2:
Low-effort or repetitive content.

Please review subreddit guidelines before reposting.

Thanks.
```

## Benefits

* saves time
* improves consistency
* reduces moderator effort

---

# 5. Suggested Moderator Actions

## Purpose

Accelerate moderation decisions.

## Suggested Actions

* Approve
* Remove
* Send Warning
* Escalate
* Manual Review Needed

## Example

```text
Suggested Action:
Remove + Warning

Reason:
High confidence repost with prior user history.
```

---

# Optional Advanced Features (Only If Time Permits)

# 1. Similar Past Cases

AI searches moderation history for:

* similar removed posts
* prior moderator decisions

This makes moderation more consistent.

---

# 2. Queue Prioritization

AI ranks:

* urgent cases
* likely spam
* high-risk violations

---

# 3. User Reputation Summary

Show:

* prior removals
* warning count
* ban history
* moderator notes

---

# 4. AI Spam/Repost Detection

Simple heuristic-based:

* title similarity
* duplicate links
* repeated media hashes

DO NOT overbuild.

---

# Features To Avoid

These are too large/risky for hackathon scope:

* Full autonomous moderation
* AI image detection pipelines
* Complex ML training systems
* Enterprise dashboards
* Huge analytics systems
* Advanced regex builders
* Massive external scraping systems

---

# UI/UX Design Philosophy

Research strongly highlighted:

* too many clicks
* cluttered workflows
* poor moderation UX

So UI should be:

## Goals

* compact
* fast
* contextual
* keyboard-friendly
* minimal navigation
* one-screen workflow

---

# Suggested UI Layout

```text
-------------------------------------------------
POST
-------------------------------------------------
Title
Body
Comments Preview

-------------------------------------------------
AI ANALYSIS
-------------------------------------------------
Summary
Potential Violations
Confidence
Suggested Action

-------------------------------------------------
MOD NOTES
-------------------------------------------------
Internal Notes
Previous Actions

-------------------------------------------------
QUICK ACTIONS
-------------------------------------------------
[Approve]
[Remove]
[Warn]
[Escalate]
-------------------------------------------------
```

---

# Suggested Folder Structure

```text
project-root/
│
├── src/
│   ├── main.ts
│   ├── api/
│   │   ├── ai.ts
│   │   ├── reddit.ts
│   │   └── storage.ts
│   │
│   ├── components/
│   │   ├── QueueCard.tsx
│   │   ├── SummaryPanel.tsx
│   │   ├── NotesPanel.tsx
│   │   └── ActionButtons.tsx
│   │
│   ├── services/
│   │   ├── moderation.ts
│   │   ├── summarizer.ts
│   │   ├── rules.ts
│   │   └── notes.ts
│   │
│   └── utils/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# AI Prompting Strategy

Keep prompts:

* short
* structured
* deterministic

## Example Prompt

```text
You are a Reddit moderation assistant.

Analyze this Reddit post.

Return:
1. Summary
2. Possible violated rules
3. Confidence score
4. Suggested moderator action

Rules:
[SUBREDDIT RULES]

Post:
[TITLE + BODY + COMMENTS]
```

---

# Data Storage Design

## Store:

* moderation notes
* cached summaries
* decision history
* rule configurations

## Do NOT Store:

* unnecessary personal data
* excessive user tracking

Keep system lightweight.

---

# Development Roadmap

# Phase 1 — Setup

* Setup Devvit app
* Configure subreddit install
* Setup repository
* Setup API keys

---

# Phase 2 — Core Queue UI

* Fetch posts/comments
* Display moderation card
* Build moderation layout

---

# Phase 3 — AI Integration

* connect Gemini/OpenAI
* generate summaries
* generate rule matches

---

# Phase 4 — Notes System

* save notes
* moderation history
* display prior actions

---

# Phase 5 — Quick Actions

* approve/remove/warn
* generate removal reasons

---

# Phase 6 — Polish

* improve loading states
* improve formatting
* reduce latency
* better prompts
* UX cleanup

---

# Demo Video Strategy

VERY IMPORTANT.

The demo should focus on:

> moderator time savings.

## Recommended Demo Flow

### 1. Show Mod Queue Problem

* overloaded queue
* repetitive moderation

### 2. Open Co-Pilot

* AI instantly summarizes post
* shows likely violated rules

### 3. Show Notes + Context

* previous moderator notes
* similar history

### 4. One-Click Moderation

* generate removal reason
* remove post instantly

### 5. Final Value Statement

> "Reddit Mod Co-Pilot helps moderators make faster, more consistent moderation decisions without replacing human judgment."

---

# Team Task Distribution

## Developer 1 (You)

* architecture
* AI integration
* backend logic
* Devvit integration
* moderation actions

## Developer 2

* UI polishing
* testing
* notes system
* documentation
* prompt tuning
* demo preparation
* subreddit testing

---

# Important Constraints

## Prioritize:

* polish
* reliability
* simplicity
* UX

## Avoid:

* feature bloat
* overengineering
* huge infrastructure

---

# Final Positioning

## Product Tagline

> "AI-powered moderation assistance for faster, smarter Reddit moderation."

OR

> "A context-aware moderation co-pilot for Reddit communities."

---

# Success Metric

The app succeeds if moderators can:

* process reports faster
* make fewer repetitive decisions
* reduce context switching
* improve moderation consistency

---

# Key Insight

Moderators do NOT want:

* fully automated moderation

They DO want:

* intelligent assistance
* contextual recommendations
* faster workflows

This project directly solves that problem.

---

# Reference Research

This project direction was derived from repeated moderator complaints including:

* queue overload
* weak automation
* too many clicks
* lack of post notes
* context-blind moderation
* repetitive workflows
* AutoModerator limitations

Source references:

* Reddit Mod Hackathon PDF 
* Moderation Research Analysis 
* Hackathon Guide Notes 
* Final Direction Analysis 

---

```
```
