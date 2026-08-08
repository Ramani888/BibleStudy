---
title: <Feature Area Name>
tags: [feature, <area-slug>]
updated: 2026-08-08
---

# <Feature Area Name>

> One-sentence purpose of this feature area.

## Screens
One row per screen in this area. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| ExampleScreen | `Example` | LibraryStack | … |

## Features & functionality
Exhaustive bullets — every user-facing capability, grouped by screen. Do not
summarise; list each action, button, state, and what it does.

## Data flow
`Screen → hook (query key) → api fn → METHOD /route → controller → service → Prisma`.
Name the actual hooks, query keys, api functions, and endpoints.

## Backend
- **Module**: `backend/src/modules/<m>/` — list the 4 files.
- **Endpoints**: every `METHOD /api/v1/<path>` with auth + one-line purpose.
- **Service functions**: each exported fn + what it does + guards.
- **DTOs**: zod validation rules.

## Data model
Relevant Prisma models + key fields + relations. Note any @@unique / cascade.

## Edge cases, rules & gotchas
Everything non-obvious: permission checks, credit costs, quota, floors, ownership
rules, provider routing, error codes, empty/loading states, race conditions,
known limitations, TODOs. This section must be thorough — it's the reason the vault exists.

## This session's additions (A–G arc)
What changed for this area during the monetization build (if anything).

## Related
[[Other Feature notes]] · [[Architecture Overview]] · [[Database Schema]]
