---
tags: [frontend, design, home, plan]
updated: 2026-08-11
---

# Home Screen — Content Plan

Deciding **what information Home shows**, grounded in the app's full feature set.
Companion to [[Screen Map]] and [[Design Language (Calm Serene)]].

## Home's job (one sentence)
Get the user straight into today's study, show momentum, and surface community — without becoming a cluttered dashboard.

## Final content blocks (as shipped 2026-08-11)

| # | Section | Condition | Priority |
|---|---------|-----------|----------|
| 1 | Sticky header (greeting, avatar, AI, bell) | Always | Must |
| 2 | Hero card (due / continue / create + streak) | Always | Must |
| 3 | Quick-action grid (8 shortcuts) | Always | Must |
| 4 | My Sets (4 rows, sorted by updatedAt) | `sets.length > 0` | Must |
| 5 | Summary stats (Friends/Folders/Sets/Cards/Credits/Notes) | Always | Should |
| 6 | From your friends (horizontal rail) | `friendsSets.length > 0` | Should |
| 7 | Recent activity feed | `activities.length > 0` | Should |
| 8 | Discover (public sets rail) | `publicSets.length > 0` | Could |

## Key decisions (history)

| Decision | Choice | Reason |
|----------|--------|--------|
| Daily verse on Home? | **Removed** (2026-08-11) | Took up ~190px below hero with no CTA; verse is spiritual/passive, Home should be action-first |
| Hero background color | **`colors.accent`** (indigo) | Dark `featuredSurface` felt off-brand; indigo matches the app's core theme |
| Hero badge + progress fill | **White** (`colors.textOnAccent`) | Green clashed with indigo bg; white is clean and on-theme |
| Quick actions position | **Slot 2** (after hero) | Provides visual variety + shortcuts immediately; My Sets follows as primary actionable content |
| Social sections | **Keep both** (friends rail + activity) | Visual richness; each occupies different format (horizontal cards vs feed rows) |
| Discover rail | **Keep** | Adds depth; conditionally rendered so new users don't see it |
| Get Started cards (Create/Explore/AI) | **Removed** | Hero already handles empty state with "START" CTA |

## What was removed from previous versions
- `VerseCard` + `useDailyVerse` hook — daily verse removed 2026-08-11
- `GroupCard` / Groups rail — Groups feature removed entirely (commit `1742f44`)
- Get Started 3-card block — removed in favour of hero empty state

## Excluded (and why)
- **Map / gatherings** — feature unreachable (no FE screens mounted)
- **Notes / Media shortcuts** — personal utilities, belong in Profile
- **Study Plan progress** — not yet surfaced on Home (future addition)

## Status
✅ Fully redesigned and committed 2026-08-11 (`a4a3f43`). Meditation-parity audit clean. TypeScript clean.
