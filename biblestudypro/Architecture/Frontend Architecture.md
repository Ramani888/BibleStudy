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
    ui/         → AccentIcon, AnimatedPressable, Avatar, Badge, Button, Card, ColorPicker,
                  Divider, FilterChip, Input, ListCard, ProgressBar, Screen, ScreenHeader, Spacer, Typography
    feedback/   → ActionSheet, ConfirmDialog, EmptyState, ErrorState, LoadingOverlay, Modal,
                  SelectSheet, SkeletonLoader
    forms/      → FormField, OTPInput
    domain/     → ChatBubble, CreditBadge, DailyVerseCard, FlashCard, FolderCard,
                  QuizModeSheet, SetActionSheet, SetCard
    icons/      → SVG icon components (no vector-icon lib)
  hooks/        → 26 hooks (use<Feature>.ts) — see [[Hooks & API Layer]]
  navigation/   → RootNavigator → Auth | App (tabs) — see [[Navigation]]
  screens/      → per-domain folders (auth, home, onboarding, library, quiz, ai, profile)
  store/        → auth.store.ts (Zustand)
  theme/        → colors, spacing, typography, shadows — see [[Theme & Components]]
  types/        → per-domain TS types
  utils/        → formatters, storage, validators
```

## Conventions (enforced)

- **Functional components, named exports** only (no default exports from screens).
- Screen-specific sub-components co-located in `screens/<domain>/components/`.
- `StyleSheet.create` inside a `makeStyles(theme)` factory (module-level, memoized
  via `useMemo(() => makeStyles(theme), [theme])`). Needed for dark-mode aware styles.
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

## Screen layout convention

All screens use `<Screen>` + `<ScreenHeader>` + body + optional `<Screen footer>`.
- Stack navigators: `headerShown: false` everywhere — screens draw their own headers.
- Tab screens: `edges={['top']}` (tab bar owns bottom inset).
- Modal screens: `edges={['top','bottom']}` + `keyboardAvoiding` prop.
- Canonical flow: **Header → Body → Footer** on every screen. Footers without a
  CTA show an informational pinned bar (result counts, etc.).

## Scale

~39 screens across auth, home, onboarding, library (9), quiz (5), ai (2),
profile (20, hosts the whole social layer). Study and Map features removed.
Full inventory: [[Screen Map]].
