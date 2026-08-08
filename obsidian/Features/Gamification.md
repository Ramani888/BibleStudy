---
title: Gamification
tags: [feature, gamification]
updated: 2026-08-08
---

# Gamification

> Achievements, daily-study streaks, and a friends leaderboard that reward
> engagement — 18 code-defined achievements grant +5 credits on unlock, streaks
> are derived from daily-login REWARD transactions, and friends compete on
> current streak.

## Screens

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| AchievementsScreen | `Achievements` | ProfileStack | Full 18-badge list grouped by category, unlocked vs locked with per-badge progress bars |
| LeaderboardScreen | `Leaderboard` | ProfileStack | Rank you + your friends by current daily-study streak |

Streaks have no dedicated screen — the **current streak** number is surfaced
inline on `HomeScreen` (featured card, weekly goal ring) and `ProfileScreen`
(stat block). Entry points: Achievements is a `MenuItem` on ProfileScreen;
Leaderboard is reached from `FriendsScreen` (pressable header), **not** from the
Profile menu.

## Features & functionality

### AchievementsScreen
- Summary header: trophy icon + "X of 18 achievements unlocked" (`unlockedCount`).
- Badges grouped by category in fixed order: **streak → study → quiz → ai → social**
  (`CATEGORY_ORDER`); labels remap `social`→"Community", `ai`→"AI".
- Each badge row shows an icon (mapped from `a.icon` via `ICON_BY_KEY`, fallback
  `TrophyIcon`); unlocked badges show the coloured icon, locked show a `LockIcon`.
- Unlocked badge: green check + "+{reward}" tag (the +5 credit grant). Locked
  badge: "{progress}/{threshold}" text + a `ProgressBar` (`progress/threshold`).
- Loading spinner, `ErrorState` with retry. Refetches on mount (see Data flow).

### LeaderboardScreen
- One row per person = you + all your friends. Rows sorted server-side.
- Rank column: medals 🥇🥈🥉 for top 3, then numeric `index + 1`.
- Avatar + name (`" (you)"` appended when `item.isMe`); your row is highlighted
  (`rowMe`: primary border + surface).
- Subtitle: "Best {longestStreak} · {achievements} achievement(s)" (pluralised).
- Trailing: flame icon + current `streak` (large, warning colour).
- Header caption "Ranked by current daily-study streak." Pull-to-refresh.
- Empty state ("No one to rank yet") with a "Find Friends" CTA → `SearchUsers`.
  (Note: you are always present, so the list is never truly empty in practice —
  the empty state only shows while `!isFetching` with zero rows.)

### Streak surfacing (no own screen)
- **Home**: `useStreak()` → `streak` drives "{streak} day streak · weekly goal
  {min(streak,7)}/7" and a progress ring `min(streak,7)/7` on the featured card.
- **Profile**: `useStreak()` → stat block showing `streakData?.streak ?? 0` with
  a flame, labelled "Streak".

## Data flow

```
AchievementsScreen → useAchievements()  key ['achievements']      → achievementsApi.getAll() → GET /achievements       → achievements.controller.getAchievements → getAchievements(userId)
LeaderboardScreen  → useLeaderboard()   key ['friends','leaderboard'] → friendsApi.leaderboard() → GET /friends/leaderboard → friends.controller.getLeaderboard   → getLeaderboard(userId)
Home / Profile     → useStreak()        key ['credits','streak']  → creditsApi.getStreak()  → GET /credits/streak    → credits.controller                        → getStreak(userId)
```

- `useAchievements` uses `staleTime: 30_000` and refetches on mount — because the
  GET runs a server-side unlock check, opening the screen unlocks anything pending
  (and grants the credits) even if nothing triggered it earlier.
- Unlocks otherwise happen out-of-band via fire-and-forget triggers (see below);
  no mutation hook is involved.

## Backend

### Module: `backend/src/modules/achievements/`
- `achievements.defs.ts` — the 18 `AchievementDef`s (data, not DB rows).
- `achievements.service.ts` — `computeMetrics`, `checkAchievements`, `getAchievements`.
- `achievements.controller.ts` — thin wrapper for `getAchievements`.
- `achievements.routes.ts` — `router.use(authMiddleware)` then `GET /`.
- **No `.dto.ts`** — the module is read-only (single GET, no body).

### Endpoints
- `GET /api/v1/achievements` — auth. Returns the full 18-badge list with per-user
  `progress` / `unlocked` / `unlockedAt`; runs `checkAchievements` first.
- `GET /api/v1/friends/leaderboard` — auth. You + friends ranked by streak.
- `GET /api/v1/credits/streak` — auth. `{ streak, longestStreak }` (see [[Credits & Subscriptions]]).

### Service functions
- **`computeMetrics(userId)`** — one `Promise.all` computing all 10 metrics:
  - `cards_created` = `activity.count(type=CREATED_CARD)`
  - `sets_created` = `activity.count(type=CREATED_SET)`
  - `quizzes_taken` = `quizAttempt.count`
  - `perfect_quiz` = `quizAttempt.count(scorePct=100)`
  - `quiz_modes` = distinct non-null `quizAttempt.mode` count
  - `friends` = `friendship.count`
  - `groups_joined` = `groupMember.count`
  - `ai_questions` = `aIChat.count`
  - `streak` = `getStreak(userId).longestStreak` (**longest, not current** — so an
    earned streak badge never re-locks after the streak breaks)
  - `plans_completed` = user's `studyPlan`s where `steps.length > 0` AND every step
    has progress for this user
- **`checkAchievements(userId)`** → `string[]` newly-unlocked keys. Idempotent.
  Computes metrics + loads existing `UserAchievement` keys, filters defs to those
  not-yet-unlocked with `metric >= threshold`. If none, returns `[]`. Otherwise a
  single `$transaction`: `createMany` unlocks (`skipDuplicates`), increments
  `user.creditBalance` by the summed reward, `createMany` `REWARD` credit txns
  ("Achievement unlocked: {title}"). Then fires one push/in-app notification per
  unlock via `sendPushToUser(..., { type: 'achievement', id: key })`, each
  `.catch(()=>{})` (non-critical).
- **`getAchievements(userId)`** — calls `checkAchievements` first (decision C-3),
  then maps all 18 defs to `{ key, title, description, icon, category, reward,
  threshold, progress: min(current, threshold), unlocked, unlockedAt }`.
- **`triggerAchievementCheck(userId)`** (`utils/achievementCheck.ts`) —
  fire-and-forget: dynamic-imports the service (avoids circular imports), calls
  `checkAchievements`, swallows all errors. Never blocks/breaks the caller.
- **`getStreak(userId)`** (`credits.service.ts`) — loads all `type=REWARD` credit
  txns ascending; builds a `Set` of local date strings (`toLocalDateStr` =
  `YYYY-MM-DD` in server-local time). Current streak = consecutive days counted
  backward from today. Longest = longest consecutive run across all history.
  Returns `{ streak, longestStreak: max(streak, longest) }`; `{0,0}` if no rewards.
- **`getLeaderboard(userId)`** (`friends.service.ts`) — loads you + all friendships;
  one `userAchievement.groupBy` for achievement counts across everyone; then
  `getStreak` per person (one REWARD query each — a `ponytail:` comment flags this
  as fine for normal friend counts). Sort: `streak` desc → `longestStreak` desc →
  `name.localeCompare`. Each row: `{ userId, name, profileImage, streak,
  longestStreak, achievements, isMe }`.

## Data model

```prisma
model UserAchievement {
  userId     String
  key        String            // matches AchievementDef.key in code
  unlockedAt DateTime @default(now())
  user       User     @relation(..., onDelete: Cascade)
  @@id([userId, key])          // composite PK = built-in unlock idempotency
  @@index([userId])
}
```

- **Only unlocks are persisted.** Definitions (title/threshold/reward/metric) live
  in code, so tweaking `achievements.defs.ts` never corrupts data.
- Streaks have **no table** — derived on the fly from `CreditTransaction` rows
  (`type = REWARD`). See [[Database Schema]].
- Notifications use `Notification` (`type: String`, here `'achievement'`).

## Edge cases, rules & gotchas

- **The 18 definitions** (key · category · metric · threshold · reward=5):
  - Study: `first_card` (cards_created 1), `cards_10` (10), `cards_50` (50),
    `first_set` (sets_created 1), `sets_5` (5), `first_plan` (plans_completed 1).
  - Quiz: `first_quiz` (quizzes_taken 1), `quiz_10` (10),
    `perfect_quiz` (perfect_quiz 1), `quiz_explorer` (quiz_modes 4).
  - Streak: `streak_3` (3), `streak_7` (7), `streak_30` (30), `streak_100` (100)
    — all on the `streak` metric = **longestStreak**.
  - Social: `first_friend` (friends 1), `joined_group` (groups_joined 1).
  - AI: `first_ai` (ai_questions 1), `ai_50` (50).
- **Reward is a locked decision (C-2): every unlock = +5 credits.** Summed and
  granted in one balance increment when multiple unlock at once.
- **Unlock idempotency is triple-guarded**: `checkAchievements` filters out
  already-unlocked keys, `createMany` uses `skipDuplicates`, and the composite PK
  `@@id([userId, key])` prevents duplicate rows at the DB level.
- **Real-time trigger points** (all via `triggerAchievementCheck`, fire-and-forget):
  1. `utils/activity.ts → logActivity` — covers CREATED_CARD/SET, JOINED_GROUP,
     ADDED_FRIEND in one place (whenever any activity is logged).
  2. `quiz.service.ts` (attempt saved) — quizzes_taken / perfect_quiz / quiz_modes.
  3. `ai.service.ts` (AI question) — ai_questions.
  4. `credits.service.ts` (daily login reward) — streak milestones.
  5. `plans.service.ts` (plan step completed) — plans_completed ("Plan Finisher").
  - Plus a lazy catch-all: `getAchievements` runs a check on every screen open, so
    anything a trigger missed still unlocks when the user views the screen.
- **Trigger failures are silent by design** — `triggerAchievementCheck` and the
  notification `.catch(()=>{})` never propagate errors to the user-facing action.
- **Streak is coupled to the credits system, not study events.** A "day" counts
  only if a `REWARD` transaction exists that day. Daily-login rewards are the main
  source, but **achievement-unlock REWARD txns also count** — the `Set<date>`
  collapses same-day duplicates, so an unlock can't inflate a day already covered,
  but unlocking on a day with no login reward *would* mark that day as active.
  ponytail-worthy coupling to note if streak logic ever changes.
- **Streak uses server-local time** (`toLocalDateStr` = local `getFullYear/Month/Date`)
  — timezone-dependent, not the user's device TZ.
- **`computeMetrics` streak uses longestStreak** on purpose: streak badges must not
  re-lock. But the badge *progress bar* also uses longestStreak, so a locked
  `streak_30` shows progress against your best-ever run, not your current run.
- **Leaderboard ranks by current `streak`** (header says so), tiebroken by
  `longestStreak` then name. Achievement count is displayed but does **not** affect
  rank.
- **Self-inclusion**: you are always in the leaderboard (`[me, ...friends]`), so it
  never renders the empty state for a user with zero friends unless the row array
  is somehow empty; the "Find Friends" CTA is for the friendless case.
- **Perf ceiling**: `getLeaderboard` runs one REWARD query per person (N+1 on
  friends). Flagged `ponytail:` — batch into a grouped query only if someone has
  hundreds of friends.
- **Frontend icon mapping** (`ICON_BY_KEY`) is keyed on `a.icon` (e.g. `card`,
  `flame`, `sparkles`); an unmapped icon name silently falls back to `TrophyIcon`.

## This session's additions (A–G arc)

The whole achievements module is a Phase-C deliverable: 17→18 definitions with
real-time unlocks, +5-credit grants (decision C-2), unlock notifications, and
streak surfacing on Home/Profile. Phase D1 added the `first_plan` /
"Plan Finisher" achievement + its trigger in `plans.service.ts`
(see [[Credits & Subscriptions]] and the plans work). Leaderboard ties the
[[Social]] friend graph into the gamification loop.

## Related

[[Credits & Subscriptions]] · [[Social]] · [[AI Chat]] · [[Quiz]] · [[Architecture Overview]] · [[Database Schema]]
