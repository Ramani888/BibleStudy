---
tags: [frontend, design, home, plan]
updated: 2026-08-05
---

# Home Screen — Content Plan

Deciding **what information Home shows**, grounded in the app's full feature set.
Styling is already handled (themed, dark-aware, no inline) — this note is only
about *content / information architecture*. Companion to [[Screen Map]] and
[[Design Language (Calm Serene)]].

## What the app can do (the menu Home draws from)
- **Study core** — folders → sets → cards; public sets; friends' shared sets
- **Study & Quiz** — study sessions, Quiz v2 (7 modes, best scores); cards have
  spaced-repetition fields (`nextReviewAt`, `lastStudiedAt`)
- **AI** — chat assistant (spends credits), history, bookmarks, suggested cards
- **Credits** — balance, daily claim, streak (login-based), transactions
- **Social** — friends (requests/search), groups, **activity feed**, **notifications**
- **Notes & Media** — personal notes, PDF viewer
- **Daily verse**
- **Gatherings/Map** — built but **unreachable** (not mounted) → ignore for Home

## Home's job (one sentence)
When a user opens the app each day, Home should: **(1) reconnect them
spiritually (verse), (2) get them straight into today's study (the core loop),
(3) show progress to keep the habit, and (4) surface a glimpse of their
community** — without becoming a cluttered dashboard.

## Content blocks — prioritized (MoSCoW)

### MUST — the daily core
1. **Header** — greeting (time + first name), avatar → Profile, credit badge.
   Data: `useAuthStore`, `useCreditBalance`. ✅ have data.
2. **Verse of the Day** — serif indigo hero. The devotional anchor.
   Data: `useDailyVerse`. ✅ have data.
3. **TODAY card** — the single primary action, dynamic by state:
   - cards due for review → *"12 cards due · Review"* (→ Quiz/Study)
   - else last studied set → *"Continue: {set}"*
   - else new user → *"Create your first set"*
   Data: `useSets` (✅) + **due count needs a small backend endpoint** (see
   Decision A).
4. **Progress** — 🔥 streak · N sets · N cards, one calm row.
   Data: `useStreak`, `useSets`. ✅ have data.
   ⚠️ Note: streak = daily *login/claim* days, not study days
   (`credits.service.ts`). Label honestly ("day streak") or change later.

### SHOULD — engagement / retention
5. **My sets** — 2–3 recent sets to jump back in. Data: `useSets`. ✅
6. **Community glimpse** — ONE compact row surfacing the social layer that's
   otherwise buried in Profile: e.g. pending friend requests, or latest
   activity-feed item, or unread notifications count → deep-links in.
   Data: `useActivities` / `useFriends` / `useNotifications`. ✅ have data.

### COULD — nice-to-have
7. **Ask AI** — a slim entry into AIChat ("Ask about a verse…"), since AI is a
   headline feature. Data: navigate only. ✅
8. **Notifications bell** in header with unread badge. Data: `useNotifications`. ✅

### EXCLUDE (and why)
- **Library / AI / Profile nav tiles** — redundant with the bottom tab bar.
- **Map / gatherings** — feature is unreachable.
- **Notes / Media** — personal utilities; belong in Profile, not daily Home.

## Recommended layout (calm, one hero + prioritized sections)
```
Header:  Good morning, David          🔔  🪙  (avatar)
Hero:    ❝ Verse of the day ❞  — John 3:16
TODAY:   📖  12 cards due for review        [ Review → ]
Progress: 🔥 5 day streak · 12 sets · 240 cards
My Sets:  ▸ Romans deep-dive   ▸ Psalms memory      (See all)
Community: 👥 2 friend requests · Sarah added a set   (→)
```

## Open decisions (need user input)
- **A. Due-cards endpoint?** Add `GET /cards/due-summary` (real "N due") vs
  ship "Continue last set" only for now.
- **B. Community glimpse on Home?** Include block 6 (surfaces friends/groups/
  notifications) or keep Home purely study-focused?
- **C. Ask-AI shortcut?** Include block 7 or not?
- **D. Progress style?** Slim one-line row vs the current 3 stat chips.

## Status
✅ IMPLEMENTED 2026-08-05. Decisions: A=added `GET /cards/due-summary`
(dueCount/dueSets/topSet), B=Community row included, C=Ask-AI shortcut skipped
(not in the approved wireframe), D=slim progress row. Home rebuilt with all 6
blocks, fully themed via `useTheme()`/`makeStyles` (no inline), dark-aware.
Backend + frontend typecheck clean. Nav fix: `ProfileTab` now typed with
`NavigatorScreenParams<ProfileStackParamList>` so cross-tab nested nav works.
Still device-untested; Inter font + other-module migrations still pending.
