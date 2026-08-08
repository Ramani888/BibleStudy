---
title: Home Dashboard
tags: [feature, home]
updated: 2026-08-08
---

# Home Dashboard

> The signed-in landing screen: a personalized dashboard that surfaces what to study next, the daily verse, streak, and cross-tab shortcuts into every other feature area.

## Screens
One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| HomeScreen | `HomeTab` | AppNavigator (bottom tab, no inner stack) | Aggregated dashboard — featured "what to study next" card, quick-action grid, recent/friends/discover set rails, groups, activity feed, summary stats, daily verse |

`HomeScreen` is the sole screen of `HomeTab`; it is a tab leaf, not a stack, so all its navigation targets are **cross-tab** jumps (see [[Navigation]]). File: `frontend/src/screens/home/HomeScreen.tsx` (self-contained — all sub-components live inline in that one file: `StickyHeader`, `FeaturedCard`, `QuickAction`, `SetRow`, `SetMiniCard`, `GroupCard`, `ActivityItem`, `SummaryCard`, `VerseCard`, `SectionRow`).

## Features & functionality
Exhaustive — every user-facing capability, grouped by UI block (top → bottom).

### Sticky header (`StickyHeader`, non-scrolling, hairline bottom border)
- **Avatar + greeting** (left, one `Pressable`): shows `Avatar` (user `profileImage`, falls back to initials from name), a time-based greeting line (`Good morning` <12h, `Good afternoon` <17h, else `Good evening`) and the user's **first name** (`user.name.split(' ')[0]`, falls back to `'Friend'`). Tapping → **ProfileTab → Profile**.
- **AI shortcut** (sparkles icon): → **AITab → AIChat** (see [[AI Chat]]).
- **Notification bell** (bell icon): → **ProfileTab → Notifications**. Shows a red badge with the unread count when `unread > 0`; renders `9+` when `unread > 9`.

### Featured card (`FeaturedCard`, dark hero, `colors.featuredSurface`)
A single adaptive CTA with three mutually exclusive states, chosen in this priority order:
1. **DUE** (green badge) — shown when `dueSummary.dueCount > 0 && dueSummary.topSet` exists. Title = the top set's title, subtitle = `"{dueCount} card(s) to review"`. Tapping → **QuizTab → QuizSetup** pre-loaded with the top set (`preSelectedSetIds: [topSet.id]`, `preSelectedSetTitles: [topSet.title]`). See [[Study Core]] / quiz.
2. **CONTINUE** (badge) — when no due cards but the user has at least one set. Title = `sets[0].title` (the first set returned by `useSets`, **not** the most-recently-updated one), subtitle = card count. Tapping → **LibraryTab → SetDetail**.
3. **START** (badge) — new user with no sets. Copy "Create your first study set". Tapping → **LibraryTab → CreateSet**.
- **Weekly-goal progress bar** + **streak footer**: fill = `min(streak, 7) / 7`; footer text `"{streak} day streak · weekly goal {min(streak,7)}/7"` with a flame icon. Streak comes from `useStreak` (see [[Gamification]]).

### Quick-action grid (`QuickAction` × 8, 4 per row, circular icon buttons)
Cross-tab shortcuts: **Library** (LibraryTab→Library), **Quiz** (QuizTab→QuizHub), **AI Chat** (AITab→AIChat), **Notes** (ProfileTab→Notes), **Media** (ProfileTab→Media), **Discover** (LibraryTab→PublicSets), **Friends** (ProfileTab→Friends), **Profile** (ProfileTab→Profile).

### My Sets rail (`SetRow`, vertical list, only if `recentSets.length > 0`)
- Up to 4 sets, **sorted by `updatedAt` desc** (this is the true "recent" list, unlike the featured CONTINUE card which uses `sets[0]`).
- Each row shows title + card count; a green **DUE** pill replaces the chevron when that set's id equals `dueSummary.topSet.id`. Tap → **LibraryTab → SetDetail**.
- "See all" → LibraryTab → Library.

### Summary card (`SummaryCard`, 6 stat tiles, always rendered)
Friends / Folders / Sets / Cards / Credits / Notes counts. `Cards` = sum of `_count.cards` across all `sets`; `Credits` = `creditData.balance`; others = respective array `.length`. All default to `0` while loading.

### From-your-friends rail (`SetMiniCard`, horizontal, only if any) 
Up to 8 friends' sets (flattened from the infinite-query pages). Tap → LibraryTab → SetDetail with `isOwner: false`. "See all" → LibraryTab → FriendsSets.

### Your Groups rail (`GroupCard`, horizontal, only if any)
Up to 8 groups, member count shown. Tap → ProfileTab → GroupDetail. "See all" → ProfileTab → Groups.

### Recent activity (`ActivityItem`, only if any)
Up to 5 items from the friends activity feed. `activityText()` maps `Activity.type` (`ADDED_FRIEND`, `JOINED_GROUP`, `JOINED_GATHERING`, `CREATED_SET`, `STUDIED_CARDS`, `CREATED_NOTE`, default) to a sentence. No tap target (display-only).

### Discover rail (`SetMiniCard`, horizontal, only if any)
Up to 8 public sets. Tap → LibraryTab → SetDetail with `isOwner: false`. "See all" → LibraryTab → PublicSets.

### Daily verse (`VerseCard`, purple box, bottom of scroll)
Big italic verse text with decorative corner quote marks + reference. Renders `null` if either `text` or `reference` is missing (so it silently disappears while the query is loading/empty).

### Side effect: auto daily-credit claim
`useAutoDailyClaim()` runs on mount — see edge cases.

## Data flow
`HomeScreen` fans out to **14 hooks** on mount (all React Query; no API calls in the component). The Home-specific ones:

- Daily verse: `useDailyVerse` (key `['daily-verse']`, `staleTime` 12h) → `aiApi.getDailyVerse` → `GET /api/v1/ai/daily-verse` → `ai.controller.getDailyVerse` → `ai.service.getDailyVerse`.
- Due summary: `useDueSummary` (key `['cards','due-summary']`) → `cardsApi.dueSummary` → `GET /api/v1/cards/due-summary` → `cards.controller.getDueSummary` → `cards.service.getDueSummary`.
- Streak: `useStreak` (key `['credits','streak']`, `staleTime` 60s) → `creditsApi.getStreak` → `GET /api/v1/credits/streak` → `credits.controller.getStreak` → `credits.service.getStreak`.
- Unread count: `useNotifications(1)` (key `['notifications', 1]`) → `notificationsApi.list(1)` → `GET /api/v1/notifications?page=1` → `notifications.service.list`; the header reads only `notifData.unreadCount`.
- Credits balance: `useCreditBalance` (key `['credits','balance']`).
- Daily claim (side effect): `useAutoDailyClaim` → `useClaimDailyLogin` → `creditsApi.claimDailyLogin` → `POST /api/v1/credits/claim-daily` (invalidates `['credits']` on success).

Other feed hooks reused verbatim from their own areas: `useSets`, `usePublicSets`, `useFriendsSets`, `useFriendsActivityFeed`, `useGroups`, `useFriends`, `useFolders`, `useNotes` (see [[Study Core]], [[Social]]).

## Backend
Home is a **read-only aggregator** — it owns no backend module. It reads endpoints from four existing modules.

- **`backend/src/modules/ai/`** (`ai.routes.ts` · `ai.controller.ts` · `ai.service.ts` · `ai.dto.ts`)
  - `GET /api/v1/ai/daily-verse` (auth) — returns today's verse. `getDailyVerse()` fetches `https://bible-api.com/data/web/random` with a **5s AbortController timeout**; on non-OK response, missing `random_verse`, JSON parse error, or timeout it returns the **hardcoded John 3:16** (`HARDCODED_VERSE`). Never charges credits, never touches Prisma.
- **`backend/src/modules/cards/`**
  - `GET /api/v1/cards/due-summary` (auth) — `getDueSummary(userId)` does a Prisma `card.groupBy({ by:['setId'], where:{ set:{ userId }, nextReviewAt:{ lte: now } } })`, sums to `dueCount`, counts groups as `dueSets`, and resolves `topSet` (the setId with the most due cards) to `{id,title}`. Returns `{ dueCount, dueSets, topSet }`.
- **`backend/src/modules/credits/`**
  - `GET /api/v1/credits/streak` (auth) — `getStreak(userId)` reads all `CreditTransaction` rows of `type: 'REWARD'`, dedupes to a set of local-date strings, walks backward from today to compute the current streak, and scans the sorted set for the longest run. Returns `{ streak, longestStreak }`.
  - `GET /api/v1/credits/balance` (auth) — user balance.
  - `POST /api/v1/credits/claim-daily` (auth) — idempotent per calendar day; records a `REWARD` transaction (this is what feeds the streak calc above).
- **`backend/src/modules/notifications/`**
  - `GET /api/v1/notifications?page=1` (auth) — `list(userId, page)` returns `{ notifications, total, unreadCount }`; `unreadCount = prisma.notification.count({ where:{ userId, read:false } })`. Home only consumes `unreadCount`.

## Data model
- **Card.nextReviewAt** (`DateTime?`) — the *only* field the due-summary query filters on. See the gotcha below.
- **CreditTransaction** (`type: REWARD | ...`, `createdAt`, `amount`, `userId`) — the daily `REWARD` rows are the **sole source of the streak**; there is no dedicated `streak`/`Streak` model. Study activity does not affect the streak — only claiming the daily credit does.
- **Notification** (`userId`, `read: boolean`) — `unreadCount` = rows where `read = false`.
- Set / Folder / Card counts come from `_count` includes on the respective list endpoints, not Home-specific queries.

## Edge cases, rules & gotchas
This is the reason the vault exists — read carefully.

- **Cross-tab navigation is the whole point.** Every Home action jumps to another tab's stack via `navigation.navigate('<Tab>', { screen, params })`:
  - Bell → **ProfileTab → Notifications**
  - AI shortcut / AI Chat quick action → **AITab → AIChat**
  - Featured CONTINUE / My-Sets row / friends & discover cards → **LibraryTab → SetDetail**
  - Featured DUE → **QuizTab → QuizSetup** (pre-selected set)
  - Featured START / no-sets → **LibraryTab → CreateSet**
  Because Home is a tab leaf with no header of its own, there is no back button — the destination tab's own back stack handles return.
- **Daily-verse fallback is silent.** On *any* failure (Bible API down, timeout >5s, malformed JSON, missing `random_verse`) the backend returns the hardcoded **John 3:16**, so the card always has content — the user never sees an error. The 12h `staleTime` means the verse can also appear "stuck" for half a day. If the query is still loading, `VerseCard` returns `null` and the whole block is absent.
- **`sets[0]` vs recent-sorted mismatch.** The featured **CONTINUE** card uses `sets[0]` (raw API order), while the **My Sets** rail sorts by `updatedAt` desc. These can point at different sets — the hero "Continue" is not guaranteed to be the most recently touched set.
- **Due-cards deep-link.** DUE state links straight into QuizSetup for `topSet` only (the single set with the most due cards), not all due sets. `dueSets` is fetched but never surfaced in the UI.
- **⚠️ Spaced-repetition is effectively dormant.** `dueCount` is driven entirely by `Card.nextReviewAt <= now`, but **`nextReviewAt` is never written anywhere in the backend** — it is only read in `getDueSummary`. It is nullable and defaults to null, and `null` fails the `lte: now` filter, so `dueCount` is `0` for every card unless something back-fills `nextReviewAt`. In practice the **DUE** state and the "TODAY" review flow will effectively never trigger until a review-scheduling writer is added. Flag this before relying on due counts. (See [[Study Core]] — quiz/study does not update `nextReviewAt`.)
- **Streak semantics.** Streak counts consecutive days with a **daily-credit REWARD**, computed from `CreditTransaction` rows, not from studying. `useAutoDailyClaim` is what keeps it alive: it fires `claim-daily` on mount **and every time the app returns to foreground** (AppState `background/inactive → active`), showing a "+N credit claimed!" toast on success and swallowing errors (already-claimed → silent). This means the streak advances just by opening the app once a day. `staleTime: 60s` on `useStreak` plus the `['credits']` invalidation on claim keeps the footer roughly fresh.
- **Unread badge freshness.** `useNotifications(1)` has no polling / refetch interval, so the bell badge only updates on screen focus/refetch or when a notifications mutation invalidates `['notifications']`. It can lag behind reality until the query refetches. Badge caps at `9+`.
- **Everything degrades to empty, not error.** Every rail/section is guarded by a `length > 0` check and every scalar defaults to `0`/`null`, so a brand-new user (or any failed query) sees a valid, mostly-empty dashboard rather than spinners or error states — there is **no explicit loading or error UI** anywhere on Home.
- **Heavy fan-out on mount.** 14 queries fire simultaneously on Home focus; most are shared cache keys reused by their home tabs, but a cold open still triggers ~10 network requests at once.
- **Recent activity is display-only** (no navigation target) and shows at most 5 items.

## This session's additions (A–G arc)
Home is the surfacing point for several monetization-arc features rather than the owner:
- **Streak surfacing** (Phase C, [[Gamification]]) — the featured card's weekly-goal bar + streak footer and `useAutoDailyClaim`'s foreground re-claim are the visible edge of the streak/achievements work.
- **Variable credits / daily reward** (Phase C) — the auto daily-claim toast and the `Credits` summary tile read the same credit ledger.
- No Home-owned backend was added; Home consumes the existing `ai`, `cards`, `credits`, `notifications` endpoints.

## Related
[[AI Chat]] · [[Study Core]] · [[Gamification]] · [[Navigation]] · [[Social]] · [[Architecture Overview]] · [[Database Schema]]
