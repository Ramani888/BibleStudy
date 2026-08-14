---
title: Study Plans
tags: [feature, study-plans]
updated: 2026-08-14
---

# Study Plans

> Ordered sequences of flashcard sets a user works through step-by-step — as a **personal** plan (D1) or an admin-authored **group** plan with a per-member leaderboard (D2).

## Screens

One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| StudyPlansScreen | `StudyPlans` | LibraryStack | List the caller's personal plans (progress %); entry to create/detail. |
| PlanDetailScreen | `PlanDetail` | LibraryStack | View a personal plan: steps, progress bar, toggle step done, delete plan. |
| CreatePlanScreen | `CreatePlan` (Library, modal) · `CreateGroupPlan` (Profile, modal) | LibraryStack + ProfileStack | **One screen reused for both** — creates a personal plan or, when passed `{ groupId }`, a group plan. |
| GroupPlanDetailScreen | `GroupPlanDetail` | ProfileStack | View a group plan: steps + **leaderboard** of all members' completion; toggle own progress. |
| (GroupDetailScreen — Study Plans section) | `GroupDetail` | ProfileStack | Lists the group's plans; admins get a "New" button. See [[Social]]. |

Entry points: **LibraryScreen** header has a Pressable → `StudyPlans` (personal). **GroupDetailScreen** has a "Study Plans" section → `GroupPlanDetail` / `CreateGroupPlan` (group).

## Features & functionality

**StudyPlansScreen (personal list)**
- Lists personal plans via `usePlans()` (`GET /plans`), each row shows title, description, a `ProgressBar` (`completedSteps/totalSteps`), and the fraction.
- Header "+" → `navigation.navigate('CreatePlan')`.
- Row tap → `PlanDetail` with `{ planId }`.
- `EmptyState` when no plans, whose CTA also opens `CreatePlan`.
- Loading spinner / `ErrorState` with retry.

**CreatePlanScreen (shared)**
- Title (required), description (optional), and an **ordered** multi-select of the caller's own sets (`useSets()`).
- `selected: string[]` is order-preserving — tap toggles in/out, and selection order becomes step order.
- Save disabled until title non-empty AND ≥1 set selected AND not pending.
- On success: **personal** plan → `navigation.replace('PlanDetail', { planId })` (jumps straight in); **group** plan (`groupId` present) → `navigation.goBack()` to GroupDetail (its list refetches).
- `groupId` is read defensively: `(route.params as { groupId?: string })?.groupId`.
- **iOS keyboard gap fix** (commit `a1f4ca8`, 2026-08-14): title input is wrapped in a `KeyboardAvoidingView` and the screen includes a bottom safe-area inset — prevents the input field from being hidden behind the keyboard on iPhone.

**PlanDetailScreen (personal)**
- Description, aggregate `ProgressBar`, "🎉 Plan complete!" banner when all steps done.
- Each step: a completion circle (tap toggles via `useToggleStep`) + step body (tap → `SetDetail` **same LibraryStack**, `isOwner: true`).
- Step label falls back `step.title || set.title || 'Set removed'` (set may be null if the underlying set was deleted).
- Header trash icon → `ConfirmDialog` → `useDeletePlan`; copy reassures "Your sets are not affected."

**GroupPlanDetailScreen (group)**
- Same step list + progress banner ("🎉 You finished this plan!").
- Step tap → **cross-tab** navigation: `navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId, setTitle, isOwner: false } })` — jumps out of ProfileStack into LibraryTab's SetDetail.
- **Leaderboard** below steps: `useMembersProgress` rows sorted highest-completion-first, each with rank number, `Avatar`, name (" (you)" for self via `useAuthStore`), a per-member `ProgressBar`, and `completed/total`.

**GroupDetailScreen — Study Plans section** (see [[Social]])
- `useGroupPlans(groupId)` lists the group's plans; each row → `GroupPlanDetail`.
- Admins (`myMembership.role === 'ADMIN'`) see a "New" button → `CreateGroupPlan` with `{ groupId }`. Non-admins see read-only copy.

## Data flow

```
StudyPlansScreen   → usePlans()            ['plans']              → plansApi.list           → GET    /plans
PlanDetailScreen   → usePlan(id)           ['plans', id]          → plansApi.get            → GET    /plans/:id
                   → useToggleStep(id)                            → completeStep/uncomplete → POST   /plans/steps/:stepId/complete  (or DELETE)
                   → useDeletePlan()                              → plansApi.remove         → DELETE /plans/:id
CreatePlanScreen   → useSets() + useCreatePlan()                  → plansApi.create         → POST   /plans   (body may carry groupId)
GroupDetailScreen  → useGroupPlans(gid)    ['groupPlans', gid]    → plansApi.listGroup      → GET    /plans/group/:groupId
GroupPlanDetail    → usePlan(id) + useMembersProgress(id) ['plans', id, 'members'] → plansApi.membersProgress → GET /plans/:id/members-progress
```

`useToggleStep` invalidates `['plans', planId]`, `['plans']`, `['groupPlans']`, `['credits']`, and `['achievements']` (a completion may finish a plan → grant the "Plan Finisher" credit reward). `useCreatePlan` invalidates `['plans']` and, if `groupId`, `['groupPlans', groupId]`.

## Backend

- **Module**: `backend/src/modules/plans/` — `plans.routes.ts` · `plans.controller.ts` · `plans.service.ts` (owns all Prisma) · `plans.dto.ts` (zod).
- **Helper**: `backend/src/utils/planAccess.ts` — `memberHasGroupPlanAccess(userId, setId)`.

**Endpoints** (all under `/api/v1/plans`, all require `authMiddleware`):

| Method / route | Purpose |
|---|---|
| `POST /` | Create plan. If `groupId` present → group plan (admin-only). |
| `GET /` | List caller's **personal** plans only (`groupId = null`). |
| `GET /group/:groupId` | List a group's plans (must be a member). |
| `GET /:id/members-progress` | Group-plan leaderboard (owner or member; must be a group plan). |
| `GET /:id` | Get one plan with steps + caller's own progress (owner or group member). |
| `PATCH /:id` | Update title/description (owner only). |
| `DELETE /:id` | Delete plan (owner only). |
| `POST /:id/steps` | Add a step from an owned set (owner only). |
| `PATCH /:id/steps/reorder` | Reorder steps by id list (owner only, transactional). |
| `DELETE /steps/:stepId` | Remove a step (owner only). |
| `POST /steps/:stepId/complete` | Mark step done for caller (owner or group member). |
| `DELETE /steps/:stepId/complete` | Un-mark step for caller. |

> **Route order gotcha:** `/group/:groupId`, `/:id/members-progress` and the `/steps/...` routes are declared **before** `/:id` so Express doesn't swallow "group" / "steps" as an `:id`.

**Service functions & guards** (`plans.service.ts`):
- Internal guards: `assertGroupAdmin` (group owner OR member with `role === 'ADMIN'`), `isGroupMember`, `assertCanAccessPlan` (owner OR member of the plan's group — else 404), `assertOwnedSets` (all setIds must be counted as owned by the user, dedup via `new Set`, else 400 `INVALID_SETS`), `assertOwnedPlan`.
- `createPlan` — validates owned sets, admin-checks if `groupId`, creates plan + steps in order (`order: i`).
- `listPlans` — personal only (`groupId: null`), returns `{totalSteps, completedSteps}` computed from caller's progress.
- `getPlan` — access-checked; returns steps ordered by `order`, each with `set` (id/title/color/cardCount) and `completed`/`completedAt` from **caller's** progress rows.
- `updatePlan` / `deletePlan` — owner-only (delete cascades steps + progress).
- `addStep` — owner-only, set must be owned, new `order = max+1`.
- `removeStep` — owner-only via `plan: { userId }` filter.
- `reorderSteps` — owner-only, `$transaction` of `updateMany` per id (scoped to `planId`).
- `completeStep` — access-checked (owner **or member**), `upsert` on `userId_stepId` (idempotent), then `triggerAchievementCheck(userId)`.
- `uncompleteStep` — `deleteMany({ userId, stepId })` (no achievement recheck).
- `listGroupPlans` — member-gated; `completedSteps` reflects the **caller's** progress.
- `getMembersProgress` — must be a group plan (else 400 `NOT_GROUP_PLAN`); counts each member's completed steps in the plan; **sorted highest-completion-first**.

**DTOs** (`plans.dto.ts`):
- `CreatePlanDto`: `title` 1–200, `description` ≤1000 optional, `setIds` uuid[] 1–100, `groupId` uuid optional.
- `UpdatePlanDto`: title/description both optional (description nullable).
- `AddStepDto`: `setId` uuid, `title` ≤200 optional.
- `ReorderStepsDto`: `stepIds` uuid[] 1–100.

## Data model

`backend/prisma/schema.prisma`:

- **StudyPlan** — `id`, `userId` (author/owner), `title`, `description?`, `groupId?` (**null = personal (D1); set = group plan (D2)**), timestamps. `user` cascade-deletes plans; `steps StudyPlanStep[]`. Indexes on `userId`, `groupId`. *(No FK relation to Group — `groupId` is a bare indexed column; membership is checked at the service layer.)*
- **StudyPlanStep** — `id`, `planId`, `setId`, `order` (Int, default 0), `title?`. `plan` and `set` both cascade on delete (deleting the set deletes the step). `progress StudyPlanProgress[]`. Indexes on `planId`, `setId`.
- **StudyPlanProgress** — **per-user step completion**, composite `@@id([userId, stepId])`, plus `completedAt` (default now). Both `user` and `step` cascade. Indexed on `userId`. This separate table is why group plans can track each member independently (the same step row has one progress row per member).

## Edge cases, rules & gotchas

- **Personal vs group split** — `groupId = null` is the discriminator. `listPlans` deliberately excludes group plans (`groupId: null`); group plans surface only via `GET /plans/group/:groupId` under [[Social]]'s GroupDetail.
- **Author of a group plan is still its `userId`** — the admin who created it owns it. `assertOwnedPlan` (used by update/delete/add/remove/reorder step) is `userId`-scoped, so **only the creating admin** can edit a group plan's structure, not other admins.
- **Admin-only group create** — `assertGroupAdmin` passes for group owner or a member with `role === 'ADMIN'`. A plain member creating a plan with a `groupId` gets `ForbiddenError`.
- **Can't build plans from others' sets** — `assertOwnedSets` counts owned rows and compares to the deduped set size; any foreign/nonexistent id → 400 `INVALID_SETS`.
- **Per-user progress** — `completeStep` upserts on `userId_stepId`, so it's idempotent and members never collide. `completedSteps` on any read reflects *the caller's* rows, never a global count (except the leaderboard, which counts per-member).
- **Member set access without cloning** — this is the crux of D2. `memberHasGroupPlanAccess(userId, setId)` returns true if any group plan (any group the user belongs to) references that set. It's called in:
  - `sets.service.ts` (getSet): a non-owner can read a set if they have group-plan access.
  - `cards.service.ts` (list cards): for **PRIVATE** sets → allowed via group-plan access; for **FRIENDS** sets → allowed via friendship **or** group-plan access.
  So an admin can drop a PRIVATE/FRIENDS set into a group plan and members can study it (read set + cards) without a copy — but they can't otherwise browse it. See [[Study Core]].
- **Leaderboard** (`getMembersProgress`) — rejects non-group plans (400 `NOT_GROUP_PLAN`), counts each member's completed steps among the plan's step ids, sorts `b.completed - a.completed` (ties keep DB member order). `total === 0` short-circuits to 0 completed. Includes members with zero progress.
- **Cross-tab study navigation** — from a group plan (ProfileStack) tapping a step jumps to `LibraryTab → SetDetail` with `isOwner: false`; the personal PlanDetail (LibraryStack) navigates to `SetDetail` in-stack with `isOwner: true`. There is **no Study/Quiz launch from a plan step** — the step only opens SetDetail, from which the user starts study/quiz manually.
- **Deleted / removed sets** — steps cascade-delete when a set is deleted, so a step's `set` shouldn't normally be null; the UI still guards with `'Set removed'` fallback and disables the tap when `set` is null.
- **Delete semantics** — deleting a plan cascades steps + all members' progress; sets are untouched (UI says so).
- **Plan Finisher achievement** — def `first_plan` titled **"Plan Finisher"**, metric `plans_completed`, threshold 1, category `study`, reward **+5 credits** (locked decision C-2). `completeStep` fires `triggerAchievementCheck`; `useToggleStep` therefore invalidates `['credits']` + `['achievements']`. `uncompleteStep` does **not** re-check (unlocks are one-way). See [[Gamification]].
- **Reorder is transactional** but not atomic against concurrent step adds; last write wins on `order`.
- **Route ordering** must stay as-is (see backend note) or `group`/`steps`/`members-progress` would 404 as bad ids.

## This session's additions (A–G arc)

The entire feature is a session addition: **Phase D1** shipped personal study plans (plans module, per-user `StudyPlanProgress` designed D2-ready, "Plan Finisher" achievement). **Phase D2** added group study plans — nullable `groupId`, admin-only creation, member set access via `memberHasGroupPlanAccess` (unlocks the church/group revenue path), the `CreateGroupPlan`/`GroupPlanDetail` Profile screens, and the members-progress leaderboard. `CreatePlanScreen` is deliberately reused across both stacks via the optional `groupId` param.

## Related

[[Study Core]] · [[Social]] · [[Gamification]] · [[Architecture Overview]] · [[Database Schema]]
