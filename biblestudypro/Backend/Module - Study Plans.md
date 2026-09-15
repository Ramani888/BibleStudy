---
tags: [backend, module, plans]
updated: 2026-08-08
---

# Module — Study Plans

Path: `backend/src/modules/plans/` (+ `backend/src/utils/planAccess.ts`).
Mounted at `/api/v1/plans`. Feature note: [[Study Plans]].

Ordered sequences of study **sets** ("steps") with per-user completion progress.
A plan is **personal** (D1) — owned by its creator, followed against their own progress.

> **D2 group study plans were built then REMOVED** (cut with the groups feature, deferred
> post-launch): no `groupId` column, no group endpoints, no `assertGroupAdmin`/`assertCanAccessPlan`,
> no `memberHasGroupPlanAccess`.

## Models
- **StudyPlan** — `title`, `description`, `userId` (creator).
- **StudyPlanStep** — `planId`, `setId`, `order`, optional `title`. One step = one Set.
- **StudyPlanProgress** — unique `(userId, stepId)`; existence = that user completed
  that step.

See [[Database Schema]].

## Endpoints (all behind `authMiddleware`)
- `POST /`                        — create a personal plan from `setIds[]`.
- `GET /`                         — list caller's plans with completed/total.
- `GET /:id`                     — plan detail with per-step `set` summary + caller's completion.
- `PATCH /:id` · `DELETE /:id`   — owner-only edit / delete.
- `POST /:id/steps` · `DELETE /steps/:stepId` · `PATCH /:id/steps/reorder` — owner-only step mgmt.
- `POST /steps/:stepId/complete` · `DELETE /steps/:stepId/complete` — mark/unmark own progress.

*(REMOVED with group plans: `GET /group/:groupId` and `GET /:id/members-progress`.)*

## Service guards (`plans.service.ts`)
- `assertOwnedPlan` — mutations (update/delete/steps/reorder) **and reads** require **plan ownership**.
- `assertOwnedSets` — a plan/step can only reference sets the caller **owns** (can't build
  a plan from other people's sets). Bad IDs → `INVALID_SETS` 400.
- `completeStep` calls `triggerAchievementCheck(userId)` → may unlock the **Plan Finisher**
  achievement. See [[Module - Gamification]].

*(REMOVED with group plans: `assertGroupAdmin`, `assertCanAccessPlan` group-member path, `getMembersProgress`.)*

## ~~Member set-access seam~~ — REMOVED
`memberHasGroupPlanAccess` (`utils/planAccess.ts`) and its call sites in `sets.service.ts` /
`cards.service.ts` were **REMOVED** with group plans. Set/card read access is now owner +
friend-shared only.

## Client
Hooks: `usePlans`; screens under the Library/Profile stacks. See [[Hooks & API Layer]].

## See also
[[Study Plans]] · [[Module - Gamification]] · [[Module - Social (Friends, Activities, Notifications)]] · [[Module - Library (Folders, Sets, Cards)]] · [[Database Schema]]
