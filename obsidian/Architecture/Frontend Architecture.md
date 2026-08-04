---
tags: [architecture, frontend]
---

# Frontend Architecture

React Native 0.84.1 CLI (no Expo), React 19.2, TypeScript strict. Root:
`frontend/src/`.

## Directory map

```
frontend/src/
  api/          → axios client.ts + one <module>.api.ts per backend module
  components/
    ui/         → Button, Card, Input, Typography, Avatar, Badge, Divider, ProgressBar, Spacer
    feedback/   → Modal, ActionSheet, EmptyState, ErrorState, LoadingOverlay, SkeletonLoader
    forms/      → FormField, OTPInput
    domain/     → ChatBubble, CreditBadge, DailyVerseCard, DifficultyBadge, FlashCard, FolderCard, SetCard
  hooks/        → one use<Feature>.ts per domain (React Query) — see [[Hooks & API Layer]]
  navigation/   → RootNavigator → Auth | App (tabs) — see [[Navigation]]
  screens/      → per-domain screen folders — see [[Screen Map]]
  store/        → auth.store.ts (Zustand)
  theme/        → colors, spacing, typography, shadows — see [[Theme & Components]]
  types/        → per-domain TS types
  utils/        → formatters, storage, validators
```

## Conventions (enforced)

- **Functional components, named exports** only (no default exports from screens).
- Screen-specific sub-components co-located in `screens/<domain>/components/`.
- `StyleSheet.create` at the bottom of each file, named `styles`.
- Import order: React → RN core → 3rd-party → internal.
- Screen props typed via convenience types from `navigation/types.ts`
  (e.g. `LibraryScreenProps<'Library'>`).
- **Never** put API calls in screens — always go through a [[Hooks & API Layer|hook]].
- **Theme discipline:** no hardcoded colors (`colors.*`), spacing via the
  `spacing` scale, text via `<Typography preset="...">` not raw `<Text>`.
  See [[Theme & Components]].

## Layers

```
Screen (UI)  →  use<Feature> hook (React Query cache)  →  <module>.api.ts  →  client.ts (axios)
Auth state:  store/auth.store.ts (Zustand)  →  gates RootNavigator
```

See [[State & Data Fetching]] for the Zustand/React Query split and
[[Navigation]] for the navigator tree.

## Scale

~44 screens across auth, home, library, study, ai, map, profile (which hosts the
whole social layer), plus onboarding. Full inventory: [[Screen Map]].
