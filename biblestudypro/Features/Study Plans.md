---
title: Study Plans
tags: [feature, study-plans]
updated: 2026-08-14
---

# Study Plans

> Ordered sequences of flashcard sets a user works through step-by-step, as a **personal** plan (D1).
>
> **D2 group study plans were REMOVED** (cut with the groups feature, deferred post-launch). Group-plan screens, endpoints, hooks, and guards below are annotated **REMOVED** — only the personal-plan content is current.

## Screens

One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| StudyPlansScreen | `StudyPlans` | LibraryStack | List the caller's personal plans (progress %); entry to create/detail. |
| PlanDetailScreen | `PlanDetail` | LibraryStack | View a personal plan: steps, progress bar, toggle step done, delete plan. |
| CreatePlanScreen | `CreatePlan` (Library, modal) | LibraryStack | Creates a personal plan. |
| ~~GroupPlanDetailScreen~~ | ~~`GroupPlanDetail`~~ | — | **REMOVED** (group plans cut). |
| ~~(GroupDetailScreen — Study Plans section)~~ | ~~`GroupDetail`~~ | — | **REMOVED** (groups cut). |

Entry point: **LibraryScreen** header has a Pressable → `StudyPlans` (personal). *(The former GroupDetail "Study Plans" section and `CreateGroupPlan` entry point are **REMOVED**.)*

## Features & functionality

**StudyPlansScreen (personal list)**
- Lists personal plans via `usePlans()` (`GET /plans`), each row shows title, description, a `ProgressBar` (`completedSteps/totalSteps`), and the fraction.
- Header "+" → `navigation.navigate('CreatePlan')`.
- Row tap → `PlanDetail` with `{ planId }`.
- `EmptyState` when no plans, whose CTA also opens `CreatePlan`.
- Loading spinner / `ErrorState` with retry.

**CreatePlanScreen (personal)**
- Title (required), description (optional), and an **ordered** multi-select of the caller's own sets (`useSets()`).
- `selected: string[]` is order-preserving — tap toggles in/out, and selection order becomes step order.
- Save disabled until title non-empty AND ≥1 set selected AND not pending.
- On success → `navigation.replace('PlanDetail', { planId })` (jumps straight in). *(The former group-plan branch — `groupId` param → `navigation.goBack()` to GroupDetail — is **REMOVED**.)*
- **iOS keyboard gap fix** (commit `a1f4ca8`, 2026-08-14): title input is wrapped in a `KeyboardAvoidingView` and the screen includes a bottom safe-area inset — prevents the input field from being hidden behind the keyboard on iPhone.

**PlanDetailScreen (personal)**
- Description, aggregate `ProgressBar`, "🎉 Plan complete!" banner when all steps done.
- Each step: a completion circle (tap toggles via `useToggleStep`) + step body (tap → `SetDetail` **same LibraryStack**, `isOwner: true`).
- Step label falls back `step.title || set.title || 'Set removed'` (set may be null if the underlying set was deleted).
- Header trash icon → `ConfirmDialog` → `useDeletePlan`; copy reassures "Your sets are not affected."

**GroupPlanDetailScreen (group) — REMOVED**
- The group-plan detail screen, its cross-tab step navigation, and the members-progress **leaderboard** (`useMembersProgress`) were **REMOVED** with the groups feature.

**GroupDetailScreen — Study Plans section — REMOVED**
- The group's plan list (`useGroupPlans`) and the admin "New" → `CreateGroupPlan` entry point were **REMOVED**.

## Data flow

```
StudyPlansScreen   → usePlans()            ['plans']              → plansApi.list           → GET    /plans
PlanDetailScreen   → usePlan(id)           ['plans', id]          → plansApi.get            → GET    /plans/:id
                   → useToggleStep(id)                            → completeStep/uncomplete → POST   /plans/steps/:stepId/complete  (or DELETE)
                   → useDeletePlan()                              → plansApi.remove         → DELETE /plans/:id
CreatePlanScreen   → useSets() + useCreatePlan()                  → plansApi.create         → POST   /plans
```

*(REMOVED with group plans: `GET /plans/group/:groupId` + `useGroupPlans`, and `GET /plans/:id/members-progress` + `useMembersProgress`.)*

`useToggleStep` invalidates `['plans', planId]`, `['plans']`, `['credits']`, and `['achievements']` (a completion may finish a plan → grant the "Plan Finisher" credit reward). `useCreatePlan` invalidates `['plans']`.

## Backend

- **Module**: `backend/src/modules/plans/` — `plans.routes.ts` · `plans.controller.ts` · `plans.service.ts` (owns all Prisma) · `plans.dto.ts` (zod).
- ~~**Helper**: `backend/src/utils/planAccess.ts` — `memberHasGroupPlanAccess(userId, setId)`.~~ **REMOVED** with group plans.

**Endpoints** (all under `/api/v1/plans`, all require `authMiddleware`):

| Method / route | Purpose |
|---|---|
| `POST /` | Create a personal plan. |
| `GET /` | List caller's plans. |
| ~~`GET /group/:groupId`~~ | **REMOVED** (group plans cut). |
| ~~`GET /:id/members-progress`~~ | **REMOVED** (group leaderboard cut). |
| `GET /:id` | Get one plan with steps + caller's own progress (owner). |
| `PATCH /:id` | Update title/description (owner only). |
| `DELETE /:id` | Delete plan (owner only). |
| `POST /:id/steps` | Add a step from an owned set (owner only). |
| `PATCH /:id/steps/reorder` | Reorder steps by id list (owner only, transactional). |
| `DELETE /steps/:stepId` | Remove a step (owner only). |
| `POST /steps/:stepId/complete` | Mark step done for caller (owner). |
| `DELETE /steps/:stepId/complete` | Un-mark step for caller. |

> **Route order gotcha:** the `/steps/...` routes are declared **before** `/:id` so Express doesn't swallow "steps" as an `:id`.

**Service functions & guards** (`plans.service.ts`):
- Internal guards: `assertOwnedSets` (all setIds must be counted as owned by the user, dedup via `new Set`, else 400 `INVALID_SETS`), `assertOwnedPlan`. *(The group guards `assertGroupAdmin` / `isGroupMember` / `assertCanAccessPlan` are **REMOVED**.)*
- `createPlan` — validates owned sets, creates plan + steps in order (`order: i`).
- `listPlans` — returns `{totalSteps, completedSteps}` computed from caller's progress.
- `getPlan` — owner-only; returns steps ordered by `order`, each with `set` (id/title/color/cardCount) and `completed`/`completedAt` from **caller's** progress rows.
- `updatePlan` / `deletePlan` — owner-only (delete cascades steps + progress).
- `addStep` — owner-only, set must be owned, new `order = max+1`.
- `removeStep` — owner-only via `plan: { userId }` filter.
- `reorderSteps` — owner-only, `$transaction` of `updateMany` per id (scoped to `planId`).
- `completeStep` — owner-only, `upsert` on `userId_stepId` (idempotent), then `triggerAchievementCheck(userId)`.
- `uncompleteStep` — `deleteMany({ userId, stepId })` (no achievement recheck).
- ~~`listGroupPlans`~~ / ~~`getMembersProgress`~~ — **REMOVED** with group plans.

**DTOs** (`plans.dto.ts`):
- `CreatePlanDto`: `title` 1–200, `description` ≤1000 optional, `setIds` uuid[] 1–100. *(The former `groupId` field is **REMOVED**.)*
- `UpdatePlanDto`: title/description both optional (description nullable).
- `AddStepDto`: `setId` uuid, `title` ≤200 optional.
- `ReorderStepsDto`: `stepIds` uuid[] 1–100.

## Data model

`backend/prisma/schema.prisma`:

- **StudyPlan** — `id`, `userId` (author/owner), `title`, `description?`, timestamps. `user` cascade-deletes plans; `steps StudyPlanStep[]`. Indexed on `userId`. *(The former `groupId?` column was **REMOVED** with group plans.)*
- **StudyPlanStep** — `id`, `planId`, `setId`, `order` (Int, default 0), `title?`. `plan` and `set` both cascade on delete (deleting the set deletes the step). `progress StudyPlanProgress[]`. Indexes on `planId`, `setId`.
- **StudyPlanProgress** — **per-user step completion**, composite `@@id([userId, stepId])`, plus `completedAt` (default now). Both `user` and `step` cascade. Indexed on `userId`.

## Edge cases, rules & gotchas

- **Can't build plans from others' sets** — `assertOwnedSets` counts owned rows and compares to the deduped set size; any foreign/nonexistent id → 400 `INVALID_SETS`.
- **Per-user progress** — `completeStep` upserts on `userId_stepId`, so it's idempotent. `completedSteps` on any read reflects *the caller's* rows, never a global count.
- ~~**Member set access without cloning** (`memberHasGroupPlanAccess`)~~ / ~~**Leaderboard** (`getMembersProgress`)~~ — **REMOVED** with group plans. Set/card read access is now owner + friend-shared only (no group-plan access path).
- **Study navigation** — the personal PlanDetail (LibraryStack) navigates to `SetDetail` in-stack with `isOwner: true`. There is **no Study/Quiz launch from a plan step** — the step only opens SetDetail, from which the user starts study/quiz manually.
- **Deleted / removed sets** — steps cascade-delete when a set is deleted, so a step's `set` shouldn't normally be null; the UI still guards with `'Set removed'` fallback and disables the tap when `set` is null.
- **Delete semantics** — deleting a plan cascades steps + the caller's progress; sets are untouched (UI says so).
- **Plan Finisher achievement** — def `first_plan` titled **"Plan Finisher"**, metric `plans_completed`, threshold 1, category `study`, reward **+5 credits** (locked decision C-2). `completeStep` fires `triggerAchievementCheck`; `useToggleStep` therefore invalidates `['credits']` + `['achievements']`. `uncompleteStep` does **not** re-check (unlocks are one-way). See [[Gamification]].
- **Reorder is transactional** but not atomic against concurrent step adds; last write wins on `order`.
- **Route ordering** must stay as-is (see backend note) or `steps` would 404 as a bad id.

## This session's additions (A–G arc)

**Phase D1** shipped personal study plans (plans module, per-user `StudyPlanProgress`, "Plan Finisher" achievement). **Phase D2 (group study plans) was built then REMOVED** with the groups feature — the `groupId` column, admin-only creation, `memberHasGroupPlanAccess`, the `CreateGroupPlan`/`GroupPlanDetail` screens, and the members-progress leaderboard are all gone (deferred post-launch). Only the personal-plan D1 surface remains.

## Related

[[Quiz]] · [[Social]] · [[Gamification]] · [[Architecture Overview]] · [[Database Schema]]
