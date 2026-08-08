---
tags: [backend, module, gamification]
updated: 2026-08-08
---

# Module — Gamification

Path: `backend/src/modules/achievements/` (+ `backend/src/utils/achievementCheck.ts`,
`getStreak` in `credits.service.ts`, `getLeaderboard` in `friends.service.ts`).
Mounted at `/api/v1/achievements`. Feature note: [[Gamification]].

Achievements, study streaks, and a friends leaderboard — all **derived from existing
data** (activities, quiz attempts, chats, plans, credit rewards), so no new
tracking tables beyond the unlock ledger.

## achievements

### Definitions live in code
`achievements.defs.ts` holds `ACHIEVEMENTS: AchievementDef[]` — 18 defs across
`study | quiz | streak | social | ai` categories. Each has a `metric`, a `threshold`,
and a `reward` (`REWARD = 5` credits, locked decision C-2). Only **unlocks** are
persisted, so editing defs never corrupts data.

`AchievementMetric` = `cards_created`, `sets_created`, `quizzes_taken`, `perfect_quiz`,
`quiz_modes`, `streak`, `friends`, `groups_joined`, `ai_questions`, `plans_completed`.

### Service (`achievements.service.ts`)
- `computeMetrics(userId)` — one parallel batch of counts computing every metric from
  existing rows (`Activity`, `QuizAttempt`, `Friendship`, `GroupMember`, `AIChat`,
  `StudyPlan`+progress, `getStreak`). `streak` uses **longestStreak** so a streak badge
  never re-locks.
- `checkAchievements(userId)` — idempotent unlock: persists new `UserAchievement` rows,
  increments `creditBalance`, writes `REWARD` `CreditTransaction`s, and fires push +
  in-app notification — all in one `$transaction`. Already-unlocked keys are skipped.
  Returns newly-unlocked keys.
- `getAchievements(userId)` — runs a check first (opening the screen unlocks anything
  pending, decision C-3), then returns the full list with `progress`/`unlocked`/`unlockedAt`.

### Real-time trigger
`utils/achievementCheck.ts` → `triggerAchievementCheck(userId)`: fire-and-forget,
error-swallowing, dynamic-import (avoids circular deps). Called from user actions
(AI question, plan-step completion, etc.) so unlocks happen without blocking the request.

## streak (`getStreak` in `credits.service.ts`)
`getStreak(userId)` derives a study streak from **`CreditTransaction` rows of type
`REWARD`** (the daily-claim / achievement rewards). Returns `{ streak, longestStreak }`:
- `streak` — consecutive days with a reward counting back from today (local date).
- `longestStreak` — longest consecutive run across all history.
Powers the `streak_*` achievements and the leaderboard.

## leaderboard (`getLeaderboard` in `friends.service.ts`)
`GET /api/v1/friends/leaderboard` — ranks the caller + their friends by `streak`,
tie-broken by `longestStreak` then name. Each row: `streak`, `longestStreak`,
`achievements` count (one grouped `UserAchievement` query), `isMe`.
> ponytail note in source: `getStreak` runs one REWARD query per person — fine at
> normal friend counts; batch into a grouped query if someone racks up hundreds.

## Endpoints
- `GET /api/v1/achievements` — full achievement list w/ progress (auth required).
- `GET /api/v1/friends/leaderboard` — friends streak/achievement board (see [[Module - Social (Friends, Groups, Gatherings, Map)]]).

## Client
Hooks: `useAchievements`, leaderboard via `useFriends`; Home surfaces streak. See [[Hooks & API Layer]].

## See also
[[Gamification]] · [[Module - AI & Credits]] · [[Module - Study Plans]] · [[Module - Social (Friends, Groups, Gatherings, Map)]] · [[Database Schema]]
