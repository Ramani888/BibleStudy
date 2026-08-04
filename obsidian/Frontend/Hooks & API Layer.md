---
tags: [frontend, api]
---

# Hooks & API Layer

The chain from screen to backend:

```
Screen  →  use<Feature> (React Query)  →  <module>.api.ts  →  client.ts (axios)  →  /api/v1/<module>
```

## `api/client.ts` (do not touch lightly)

The shared axios instance. Request interceptor attaches the JWT; response
interceptor performs **refresh-on-401** and retries once. Per CLAUDE.md, changing
the token-refresh logic requires a full review. See [[Auth & Token Flow]].

## `api/<module>.api.ts` — typed request functions

One file per backend module, all importing `./client`. Each function returns raw
response data (React Query handles the rest):

`auth` · `users` · `folders` · `sets` · `cards` · `ai` · `credits` ·
`friends` · `groups` · `gatherings` · `map` · `activities` · `notifications` ·
`notes` · `media` — 1:1 with the [[Backend Architecture|backend modules]].

## `hooks/use<Feature>.ts` — React Query wrappers

Present hooks:

| Hook | Backs |
|------|-------|
| `useAI` | AI chat + sessions |
| `useCards` / `useSets` / `useFolders` | study core |
| `useSetStats` / `useNoteStats` | derived counts |
| `useCredits` / `useAutoDailyClaim` | credit economy + daily claim |
| `useDailyVerse` | home daily verse |
| `useNotes` | notes |
| `useMedia` | media uploads |
| `useFriends` / `useGroups` / `useGatherings` / `useMap` | social layer |
| `useActivities` / `useNotifications` | feed + notifications |
| `useProfile` / `useUser` | profile |
| `useStudySession` | study flow |
| `useConfirmDialog` / `useFolderModal` | UI helpers (not server state) |

## Conventions
- Query keys are string arrays; mutations invalidate on success — see
  [[State & Data Fetching]].
- Never bypass a hook to call the API from a screen.
