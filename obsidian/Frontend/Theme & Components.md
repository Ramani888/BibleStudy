---
tags: [frontend, design]
---

# Theme & Components

Design tokens in `frontend/src/theme/`; component library in
`frontend/src/components/`. These are **enforced conventions** (see
[[Frontend Architecture]]).

## Theme tokens (`theme/`)
- `colors.ts` — the palette. **Never hardcode colors**; always `colors.*`.
- `spacing` — scale object; use `spacing[4]`, not raw `16`.
- `typography` — presets; render text via `<Typography preset="...">`, never a
  raw `<Text>` in screens.
- `shadows` — elevation presets.

## Component library (`components/`)
- **ui/** — Button, Card, Input, Typography, Avatar, Badge, Divider, ProgressBar,
  Spacer
- **feedback/** — Modal, ActionSheet, EmptyState, ErrorState, LoadingOverlay,
  SkeletonLoader
- **forms/** — FormField, OTPInput (used in [[Auth & Token Flow|auth screens]])
- **domain/** — ChatBubble, CreditBadge, DailyVerseCard, DifficultyBadge,
  FlashCard, FolderCard, SetCard

## Rules
- Screens compose these primitives; they don't re-style base RN components.
- Screen-specific one-offs live in `screens/<domain>/components/`.

## Refactor context
A frontend refactor added 7 shared components + 5 hooks (Phases 1–3 done). The
remaining Phase 4 (splitting "god screens") is still pending — see project memory.
