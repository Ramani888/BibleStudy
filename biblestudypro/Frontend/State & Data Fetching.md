---
tags: [frontend, state]
---

# State & Data Fetching

Two-store split — a deliberate separation of **client state** from **server state**.

## Zustand — client/auth state

- `frontend/src/store/auth.store.ts` — the only Zustand store. Holds auth status
  + tokens; the single source of truth that gates [[Navigation|RootNavigator]].
- Use Zustand for state that is **local to the client** and not owned by the API.

## React Query v5 — server state

- Every server resource is fetched through a `use<Feature>` hook (see
  [[Hooks & API Layer]]).
- **Query keys are string arrays**: `['sets']`, `['sets', setId]`,
  `['cards', setId]`.
- **Mutations invalidate** the relevant query key in `onSuccess`.
- Screens never call the API directly — they consume hooks, which own
  caching/loading/error.

## The rule of thumb

| State kind | Where it lives |
|------------|----------------|
| "Am I logged in?", tokens | Zustand (`auth.store`) |
| Anything from `/api/v1/*` | React Query hook |
| Ephemeral UI (modals, form) | local `useState` / react-hook-form |

## Forms

`react-hook-form` + `zod` for validation (mirrors the backend DTOs — see
[[Backend Architecture]]).

## See also
- [[Hooks & API Layer]] — the full hook ↔ api ↔ client chain
- [[Auth & Token Flow]] — how auth state is produced and refreshed
