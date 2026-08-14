---
title: Home Dashboard
tags: [feature, home]
updated: 2026-08-14
---

# Home Dashboard

> The signed-in landing screen: a personalized dashboard that surfaces what to study next, streak, cross-tab shortcuts, summary stats, social activity, and public discovery.

## Screens

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| HomeScreen | `HomeTab` | AppNavigator (bottom tab, no inner stack) | Aggregated dashboard — featured hero card, quick-action grid, recent sets, summary stats, friends/discover rails, activity feed |

`HomeScreen` is the sole screen of `HomeTab`; it is a tab leaf with no inner stack, so all navigation is **cross-tab**. File: `frontend/src/screens/home/HomeScreen.tsx`. Sub-components inline: `StickyHeader`, `FeaturedCard`, `QuickAction`, `SetRow`, `SetMiniCard`, `ActivityItem`, `SummaryCard`, `SectionRow`. Navigation logic extracted to **`useHomeNavigation`** hook (Phase 4 god-screen split, commit `8935a9e`, 2026-08-12).

## Section order (top → bottom)

1. **Sticky header** — non-scrolling
2. **Hero card** (`FeaturedCard`) — primary CTA
3. **Quick-action grid** (`QuickAction` × 8)
4. **My Sets** (`SetRow` list, conditional on `recentSets.length > 0`)
5. **Summary stats** (`SummaryCard`, always rendered)
6. **From your friends** (horizontal rail, conditional)
7. **Recent activity** (`ActivityItem` list, conditional)
8. **Discover** (horizontal rail, conditional)

## Features & functionality

### Sticky header (`StickyHeader`, non-scrolling, hairline bottom border)
- **Avatar + greeting** (left): time-based greeting + first name. Tap → ProfileTab → Profile.
- **AI shortcut** (sparkles icon): → AITab → AIChat.
- **Notification bell**: → ProfileTab → Notifications. Red badge with unread count; renders `9+` when `> 9`.

### Featured card (`FeaturedCard`, `backgroundColor: colors.accent`)
Hero background is **indigo/violet** (`colors.accent`) — theme-token-driven, adapts to light/dark.
Badge and progress fill use **white** (`colors.textOnAccent`) to contrast with indigo.

Three mutually exclusive states (priority order):
1. **DUE** — `dueSummary.dueCount > 0 && dueSummary.topSet` exists. White badge, white text `"DUE"`. Title = top set title, subtitle = `"{dueCount} card(s) to review"`. Tap → QuizTab → QuizSetup pre-loaded with `topSet`.
2. **CONTINUE** — no due cards but user has sets. White badge `"CONTINUE"`. Title = `sets[0].title`, subtitle = card count. Tap → LibraryTab → SetDetail.
3. **START** — new user, no sets. White badge `"START"`. Copy "Create your first study set". Tap → LibraryTab → CreateSet.

**Progress + streak footer**: fill width = `min(streak, 7) / 7`; fill color = `colors.textOnAccent` (white); footer `"{streak} day streak · weekly goal {min(streak,7)}/7"` with flame icon (`colors.warning`).

### Quick-action grid (`QuickAction` × 8, 4 per row, circular icon + label)
All 8 are genuine deep links (not tab-bar duplicates): **Create Set**, **Study Plans**, **Achievements**, **Leaderboard**, **Notes**, **Media**, **Discover**, **Friends**.
Positioned at slot 2 (after hero, before My Sets). Logic lives in `useHomeNavigation.ts` → `quickActions`.

### My Sets (`SetRow`, vertical list, only if `recentSets.length > 0`)
- Up to 4 sets sorted by `updatedAt` desc.
- Each row: title + card count + DUE pill (when set id matches `dueSummary.topSet.id`) or chevron.
- Card bg: `isDark ? colors.chipIdle : CARD_FILL_LIGHT`. Shadow guarded by `!isDark`.
- Tap → LibraryTab → SetDetail. "See all" → LibraryTab → Library.

### Summary card (`SummaryCard`, 6 stat tiles, always rendered)
Friends / Folders / Sets / Cards / Credits / Notes counts. All default to `0` while loading.

### From your friends (horizontal `SetMiniCard` rail, conditional)
Up to 8 friends' sets. Tap → LibraryTab → SetDetail (`isOwner: false`). "See all" → LibraryTab → FriendsSets.

### Recent activity (`ActivityItem`, conditional)
Up to 5 items from friends activity feed. `activityText()` maps `Activity.type` to a sentence. Display-only, no tap target.

### Discover (horizontal `SetMiniCard` rail, conditional)
Up to 8 public sets. Tap → LibraryTab → SetDetail (`isOwner: false`). "See all" → LibraryTab → PublicSets.

### Side effect: auto daily-credit claim
`useAutoDailyClaim()` runs on mount and on foreground resume — see edge cases.

## Data flow
`HomeScreen` fans out to **13 hooks** on mount (all React Query):

- Due summary: `useDueSummary` → `GET /api/v1/cards/due-summary`
- Streak: `useStreak` → `GET /api/v1/credits/streak` (`staleTime` 60s)
- Credits balance: `useCreditBalance` → `GET /api/v1/credits/balance`
- Unread count: `useNotifications(1)` — Home reads only `unreadCount`
- Daily claim (side effect): `useAutoDailyClaim` → `POST /api/v1/credits/claim-daily`
- Sets/content: `useSets`, `usePublicSets`, `useFriendsSets`, `useFriendsActivityFeed`, `useFriends`, `useFolders`, `useNotes`

> **Removed**: `useDailyVerse` — the daily verse section was removed from Home in the 2026-08-11 redesign.

## Backend
Home is a **read-only aggregator** — it owns no backend module.

- `GET /api/v1/cards/due-summary` — `getDueSummary(userId)` groups cards by `setId` where `nextReviewAt <= now`, returns `{ dueCount, dueSets, topSet }`.
- `GET /api/v1/credits/streak` — reads `CreditTransaction` rows of `type: 'REWARD'`, dedupes dates, computes streak.
- `GET /api/v1/credits/balance` — user balance.
- `POST /api/v1/credits/claim-daily` — idempotent per calendar day; invalidates `['credits']` on success.
- `GET /api/v1/notifications?page=1` — returns `{ notifications, total, unreadCount }`.

## Data model
- **Card.nextReviewAt** (`DateTime?`) — SM-2 spaced repetition is **LIVE** (commit `d1c2da9`): quiz flow writes `nextReviewAt` via `cards.service.applyReviews`. Due-summary query filters `nextReviewAt <= now`. Cards never quizzed have `nextReviewAt = null` and are not counted as due.
- **CreditTransaction** — daily `REWARD` rows are the sole source of streak. No dedicated Streak model.
- **Notification** — `unreadCount` = rows where `read = false`.

## Edge cases, rules & gotchas

- **Cross-tab navigation — `initial: false` required.** Every Home action jumps via `navigation.navigate('<Tab>', { screen, params, initial: false })`. The `initial: false` param is critical for non-root destinations — without it, React Navigation makes the deep screen the *only* route in the target stack (no Library/Profile underneath). Consequence: back pops to HomeTab and clicking the tab later shows the sub-screen instead of the root. Root destinations (`Library`, `AIChat`, `Profile`, `QuizHub`) don't need `initial: false`. Fix: commit `035fb45` (2026-08-14). See [[Navigation & Architecture]].
- **`sets[0]` vs recent-sorted mismatch.** Featured CONTINUE uses `sets[0]` (raw API order); My Sets rail sorts by `updatedAt` desc. These can point at different sets.
- **Due-cards deep-link.** DUE state links into QuizSetup for `topSet` only (most due cards). `dueSets` is fetched but not surfaced.
- **Streak semantics.** Streak = consecutive days with a daily-credit REWARD, not study days. `useAutoDailyClaim` fires on mount **and every foreground resume** — streak advances just by opening the app.
- **Unread badge freshness.** No polling; bell badge updates on refetch or mutation invalidation only. Caps at `9+`.
- **Everything degrades to empty, not error.** Every rail/section is guarded by `length > 0`; scalars default to `0`. No explicit loading or error UI anywhere on Home.
- **Heavy fan-out on mount.** 13 queries fire on Home focus; most share cache keys with their home tabs.
- **Recent activity is display-only** — no navigation target, max 5 items.

## Design system compliance (2026-08-11 audit)
- Hero `backgroundColor`: `colors.accent` (indigo/violet) — changed from `colors.featuredSurface` (dark/black)
- Hero badge bg: `colors.textOnAccent` (white); badge text: `colors.accent`
- Hero progress fill: `colors.textOnAccent` (white)
- `shadowColor`: `colors.textPrimary` (theme token, not hardcoded `#000`)
- Spacing: `width/height: 40` → `spacing.huge`; `bellBadge` top/right/minWidth/height → spacing tokens
- Meditation-parity audit passed (Check 12 was the only violation — now fixed)

## Related
[[AI Chat]] · [[Study Core]] · [[Gamification]] · [[Navigation & Architecture]] · [[Social]] · [[Architecture Overview]] · [[Database Schema]]
