# Reddit Mod Co-Pilot: Technical Overview

## What It Is

Reddit Mod Co-Pilot is a moderator-only AI workspace that helps subreddit teams review queue items faster without removing human judgment from the final decision.

It combines queue context, AI summaries, safety signals, and moderation actions in one flow so moderators do not need to switch between multiple tabs and tools.

## Why It Matters

Moderation quality depends on speed, context, and consistency. The app reduces the time spent collecting information and surfaces the signals that matter most:

- post content and top comments
- subreddit rules and likely violations
- spam and repost risk
- urgency and prioritization
- similar historical cases
- decision logging for accountability

## How It Works

1. A moderator opens the app from Mod Tools.
2. The server verifies moderator access before exposing any moderation features.
3. The app loads queue items from Reddit.
4. For a selected item, it fetches post details, comments, and relevant context.
5. Gemini generates a concise summary, confidence estimate, and suggested action.
6. The safety layer adds spam, repost, and priority signals.
7. The moderator approves, removes, or warns.
8. The action is sent to Reddit and the decision is logged for future reference.

## Architecture Highlights

- React 19 + TypeScript on the client for a fast moderator UI.
- Hono on the server for route handling and access control.
- Devvit services for Reddit integration, queue retrieval, and moderation actions.
- Gemini 1.5 Flash for structured analysis with fallback behavior.
- Devvit KV Store for notes and moderation decisions.
- Redis for dashboard references and lightweight shared state.

## Safety and Trust

- Moderator-only guard on API and menu routes.
- Dedicated restricted screen for unauthorized users.
- Human-in-the-loop decision making for every final action.
- Fallback handling so the app stays usable even when AI output is incomplete.

## Judge-Friendly Talking Points

- Real-world moderation use case with direct utility for subreddit teams.
- Faster triage through queue context, AI summarization, and priority signals.
- More consistent decisions through notes, history, and similar-case recall.
- Clear safety posture with access control and non-autonomous moderation.
- Practical production stack using Devvit, React, TypeScript, Hono, and Gemini.

## Expected Impact

- Faster decision-making on high-volume queue items.
- Lower cognitive load for moderators.
- Better consistency across repeated moderation scenarios.
- Clearer auditability through decision notes and logs.

## Current Scope

The current build is intentionally focused on the moderation workflow that judges and users will value most: speed, safety, consistency, and a clean moderator experience.
