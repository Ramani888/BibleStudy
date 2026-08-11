---
tags: [backend, module, plans]
updated: 2026-08-08
---

# Module — Study Plans

Path: `backend/src/modules/plans/` (+ `backend/src/utils/planAccess.ts`).
Mounted at `/api/v1/plans`. Feature note: [[Study Plans]].

Ordered sequences of study **sets** ("steps") with per-user completion progress.
A plan is either **personal** (`groupId = null`) or a **group plan** (`groupId`
set) that every group member follows against their own progress.

## Models
- **StudyPlan** — `title`, `description`, `userId` (creator), optional `groupId`.
- **StudyPlanStep** — `planId`, `setId`, `order`, optional `title`. One step = one Set.
- **StudyPlanProgress** — unique `(userId, stepId)`; existence = that user completed
  that step. Group members each accumulate their own progress rows.

See [[Database Schema]].

## Endpoints (all behind `authMiddleware`)
- `POST /`                        — create plan from `setIds[]` (+ optional `groupId`).
- `GET /`                         — list caller's **personal** plans (`groupId=null`) with completed/total.
- `GET /group/:groupId`          — list a group's plans (caller must be a member).
- `GET /:id`                     — plan detail with per-step `set` summary + caller's completion.
- `GET /:id/members-progress`    — per-member completion leaderboard (group plans only).
- `PATCH /:id` · `DELETE /:id`   — owner-only edit / delete.
- `POST /:id/steps` · `DELETE /steps/:stepId` · `PATCH /:id/steps/reorder` — owner-only step mgmt.
- `POST /steps/:stepId/complete` · `DELETE /steps/:stepId/complete` — mark/unmark own progress.

## Service guards (`plans.service.ts`)
- `assertOwnedPlan` — mutations (update/delete/steps/reorder) require **plan ownership**.
- `assertCanAccessPlan` — reads + completing a step allow the **owner OR a group member**
  (returns the plan; throws `NotFoundError` to avoid leaking existence).
- `assertOwnedSets` — a plan/step can only reference sets the caller **owns** (can't build
  a plan from other people's sets). Bad IDs → `INVALID_SETS` 400.
- `assertGroupAdmin` — creating a **group** plan requires group owner or `ADMIN` member.
- `getMembersProgress` — 400 `NOT_GROUP_PLAN` on a personal plan; sorts members by completion desc.
- `completeStep` calls `triggerAchievementCheck(userId)` → may unlock the **Plan Finisher**
  achievement. See [[Module - Gamification]].

## Member set-access seam (`utils/planAccess.ts`)
`memberHasGroupPlanAccess(userId, setId)` returns true if the set is referenced by a
**group** plan step in a group the user belongs to. This lets group members read/study
sets they don't own **without cloning them**. Called from:
- `sets.service.ts` (get set) — owner OR group-plan access.
- `cards.service.ts` (list/get cards) — owner, friend-shared, OR group-plan access.

## Client
Hooks: `usePlans`; screens under the Library/Profile stacks. See [[Hooks & API Layer]].

## See also
[[Study Plans]] · [[Module - Gamification]] · [[Module - Social (Friends, Groups, Gatherings, Map)]] · [[Module - Library (Folders, Sets, Cards)]] · [[Database Schema]]
