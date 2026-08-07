---
tags: [frontend, design]
---

# Theme & Components

> **Redesigning?** Follow [[Design Language (Calm Serene)]] — the app-wide
> style reference. This note is the token/component inventory; that one is the
> how-to-style rulebook.

Design tokens in `frontend/src/theme/`; component library in
`frontend/src/components/`. These are **enforced conventions** (see
[[Frontend Architecture]]).

## Theme tokens (`theme/`)
- `colors.ts` — the palette. **Never hardcode colors**; always `colors.*`.
- `spacing` — scale object; use `spacing[4]`, not raw `16`.
- `typography` — presets; render text via `<Typography preset="...">`, never a
  raw `<Text>` in screens. `fontSizes.*` for raw numeric font sizes.
- `shadows` — elevation presets (`shadows.sm/md/lg/xl`).
- `layout` — common layout constants (see below).

### `layout` constants (spacing.ts)

| Key | Value | Use for |
|-----|-------|---------|
| `screenPaddingH` | 16 | horizontal screen padding |
| `screenPaddingV` | 24 | vertical screen padding |
| `cardPadding` | 16 | card inner padding |
| `cardRadius` | 12 | standard card border-radius |
| `cardRadiusSm` | 14 | selector rows, option chips |
| `cardRadiusLg` | 16 | large question cards |
| `pillRadius` | 999 | pill/badge border-radius |
| `inputHeight` | 52 | text input + button height |
| `buttonHeight` | 52 | primary button height |
| `buttonHeightSm` | 40 | secondary/small button |
| `tabBarHeight` | 64 | bottom tab bar |
| `headerHeight` | 56 | screen header |
| `avatarSm/Md/Lg` | 32/48/80 | avatar circles |
| `iconCircleLg` | 52 | stat/score circle icons |
| `progressBarHeight` | 4 | progress track + fill height |

> **Compliance:** quiz module was audited 2026-08-07 — zero hardcoded colors,
> shadows, or raw Text; all spacing/sizing violations fixed and committed.

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
