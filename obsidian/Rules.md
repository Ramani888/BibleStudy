---
title: Project Rules
tags: [rules, conventions]
updated: 2026-08-08
---

# Project Rules

> **Source of truth is the repo `CLAUDE.md`** (loaded by Claude Code every session).
> This note mirrors it for humans browsing the vault. When they disagree, `CLAUDE.md` wins —
> update it first, then sync this note.

## Architecture invariants
- Backend: 19 modules, each `modules/<m>/` with `routes`/`controller`/`service`/`dto`. **Prisma lives only in `service.ts`.**
- New module ⇒ mount in `app.ts` + a Prisma migration.
- Achievements are **code-defined** (`achievements.defs.ts` + `computeMetrics`); only unlocks persist (`UserAchievement`).
- Studying = FlashCard flip inside `SetDetail` — there is no StudyScreen.

## Frontend conventions (falsifiable)
- Functional components, named exports; `styles`/`makeStyles(theme)` at file bottom.
- No API calls in screens — always via a `use<Feature>` React Query hook; query keys are string arrays; invalidate on mutate.
- Nav route ⇒ add to `navigation/types.ts` first, then navigator, then screen. Cross-tab: `navigate('ProfileTab', { screen: '…' })`.
- Theme only: `colors.*`, `spacing[n]`, `<Typography preset>`. No hardcoded colors/numbers/`<Text>`.
- Safe-area: tab screens `edges={['top']}` only.

## Process rules
- **Commit per feature** as it lands.
- **Type-check both ends before every commit** (`npx tsc --noEmit`).
- **Verify money/DB/permission logic with a runnable throwaway script** (asserting the outcome) before claiming done.
- After a phase lands: update `APP_SCOPE.md` + the relevant [[Home|Features note]] + memory.
- Restart backend after `.env`/`schema.prisma` changes. Device API base = Mac LAN IP, not localhost.

## Do NOT touch without full review
`api/client.ts` refresh logic · `ai.service.ts` provider seam · `subscriptions/` verify+grant ·
`config/plans.ts` (product IDs mirror App Store Connect + `subscription.types.ts`). No force-push,
no `prisma migrate reset` on real DB, no hardcoded keys.

## Known gaps (facts)
- Spaced repetition dormant (`nextReviewAt` never written → due count ~0).
- Map/Gatherings: backend-only, no frontend screens/routes.
- Media chat needs funded Claude; IAP needs App Store Connect products + `APPLE_IAP_SHARED_SECRET` (`IAP_SETUP.md`).
- Refresh tokens not rotated.

## Related
[[Architecture Overview]] · [[Navigation]] · [[Backend Architecture]] · [[Theme & Components]]
