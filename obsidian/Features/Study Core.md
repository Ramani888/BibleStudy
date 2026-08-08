---
title: Study Core
tags: [feature, study-core]
updated: 2026-08-08
---

# Study Core

> The study heart of BibleStudyPro: organise flashcards into folders and sets,
> author QA/story cards with images & blur, study by flipping cards, share
> sets (public/friends/group-plan), and surface a spaced-repetition "due"
> summary on Home.

## Screens
All study-core screens live in the **Library** tab's stack (`LibraryStack`).
There is **no dedicated `Study`/`StudyScreen`** — studying is done in-place by
flipping cards inside [[#SetDetailScreen]] via the `FlashCard` component. (The
CLAUDE.md map still references a `study/StudyScreen.tsx` + `useStudySession`
hook; neither exists in the codebase.)

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| LibraryScreen | `Library` | LibraryStack | Root: tabbed list of Sets / Folders, search, sort, quick actions |
| FolderDetailScreen | `FolderDetail` | LibraryStack | One folder's sets; edit/delete folder |
| SetDetailScreen | `SetDetail` | LibraryStack | Card list + **study (flip)** + reorder + blur + quiz launch + AI |
| CreateSetScreen | `CreateSet` | LibraryStack | New set form |
| EditSetScreen | `EditSet` | LibraryStack | Edit set (title/desc/visibility/color/folder) |
| CreateCardScreen | `CreateCard` | LibraryStack | New card form |
| EditCardScreen | `EditCard` | LibraryStack | Edit card |
| PublicSetsScreen | `PublicSets` | LibraryStack | Browse all PUBLIC sets, search, **clone** |
| FriendsSetsScreen | `FriendsSets` | LibraryStack | Browse friends' FRIENDS-visibility sets, **clone** |

> Study-plan screens (`StudyPlans`, `PlanDetail`, `CreatePlan`) also live in this
> stack but belong to the [[Study Plans]] feature (D1/D2), not the study core.

## Features & functionality

### LibraryScreen (`Library`)
- Two tabs (`activeTab`): **Sets** and **Folders**.
- Text search box (`filteredSets` client-side filter on title).
- Sort toggle (`sortOrder`) over sets.
- Pull-to-refresh (`useManualRefresh` → refetch folders + sets).
- Sets tab: `SetCard` per set (shows card count, color, visibility). Tap → `SetDetail`.
  - `SetActionSheet` per set: edit, delete (`useDeleteSet`), quiz, assign-to-folder (`useUpdateSet` sets `folderId`).
  - Quiz launch via `QuizModeSheet` → navigates to `Quiz`.
- Folders tab: `FolderCard` per folder. Tap → `FolderDetail`. Create/edit folder via `useFolderModal`; delete via `useDeleteFolder`.
- Empty states via `EmptyState` (separate copy for no-sets vs no-folders).
- Create buttons: new set → `CreateSet`, new folder → folder modal.

### FolderDetailScreen (`FolderDetail`)
- Header shows folder name/color. Lists that folder's sets (with card counts).
- Edit folder / delete folder actions.
- Tap set → `SetDetail`. Empty state when folder has no sets.

### SetDetailScreen (`SetDetail`) — the study surface
Params: `{ setId, setTitle, isOwner = true }`. `isOwner` is passed `false` when
arriving from public/friends browse, which hides all mutating controls.
- **Study / flip**: each card renders `FlashCard` — tap to flip (question ↔ answer) with a shared-value rotation animation; `onFlip(revealed)` callback.
- **Blur**: `isBlurred` cards render blurred answer (fill-in-the-blank style); blur only shown/toggleable when `isOwner`. Per-card blur toggle (`handleBlurToggle`) and **blur-all / unblur-all** (`handleBlurAll`) — persisted via `useUpdateCard`.
- **Reorder mode** (`reorderMode`): `DraggableFlatList` drag-to-reorder; save (`handleSaveReorder` → `useReorderCards`) / cancel. Owner only.
- **Card layout** toggle: `list` ↔ `grid` (`cardLayout`, local-only UI state).
- **Card search** within the set (`cardSearch`) — empty state adapts ("No cards match ...").
- Per-card `ActionSheet`: **Edit** (→ `EditCard`), **Copy** (`useCopyCard`), **Move** to another set (`useMoveCard` via a set picker), **Delete** (`useDeleteCard`, `ConfirmDialog`), and an **AI** action that deep-links to `AITab`/`AIChat` with an autoSend prompt built from the card.
- Header menu: **Quiz** (opens `QuizModeSheet` → `Quiz` route with this `setId`), and when owner: **Create Card**, **Edit Set**, grid/list toggle.
- Empty state: owner sees "Add Cards" CTA → `CreateCard`; non-owner sees read-only empty copy.

### Create/Edit Set (`CreateSet` / `EditSet`)
- Fields: title (required), description, visibility (`PRIVATE`/`PUBLIC`/`FRIENDS`), layout (`DEFAULT`/`MINIMAL`/`DETAILED`), color (hex), folder.
- `CreateSet` accepts optional `folderId` param to pre-file the set.
- Save via `useCreateSet` / `useUpdateSet`.

### Create/Edit Card (`CreateCard` / `EditCard`)
- Fields: question, answer (required), note, image (`imageId`), `isBlurred`, difficulty (`EASY`/`MEDIUM`/`HARD`), and type (`QA`/`STORY`).
- Save via `useCreateCard` / `useUpdateCard`.

### Public / Friends browse (`PublicSets` / `FriendsSets`)
- Infinite-scroll paginated lists (`useInfiniteQuery`, 20/page).
- `PublicSets` has a search box (server-side `search` param).
- Tap set → `SetDetail` with `isOwner: false` (read-only).
- **Clone** button → `useCloneSet` copies the set (+ all cards) into the user's library as PRIVATE.

## Data flow
```
LibraryScreen  → useFolders()          ['folders']            → foldersApi.list      → GET  /folders
               → useSets(folderId)     ['sets',{folderId}]    → setsApi.list         → GET  /sets
FolderDetail   → useFolder(id)         ['folders', id]        → foldersApi.getById   → GET  /folders/:id
SetDetail      → useSet(id)            ['sets', id]           → setsApi.getById      → GET  /sets/:id
               → useCards(setId)       ['cards', setId]       → cardsApi.listBySet   → GET  /cards/set/:setId
               → useUpdateCard / useReorderCards / useCopyCard / useMoveCard / useDeleteCard
PublicSets     → usePublicSets(search) ['public-sets',search] → setsApi.getPublic    → GET  /sets/public
FriendsSets    → useFriendsSets()      ['friends-sets']       → setsApi.getFriends   → GET  /sets/friends
(any)          → useCloneSet()                                → setsApi.clone        → POST /sets/:id/clone
Home           → useDueSummary()       ['cards','due-summary']→ cardsApi.dueSummary  → GET  /cards/due-summary
```
All mutations invalidate `['sets']` and/or `['folders']`; card mutations
invalidate `['cards', setId]`. Backend path per route: `controller → service
(owns Prisma) → Prisma`.

## Backend

### folders — `backend/src/modules/folders/`
`folders.routes.ts` · `folders.controller.ts` · `folders.service.ts` · `folders.dto.ts`
- `POST   /api/v1/folders` (auth) — create; validates parent belongs to user.
- `GET    /api/v1/folders` (auth) — list user's folders w/ `sets {id,title}`, newest first.
- `GET    /api/v1/folders/:id` (auth) — one folder + its sets (w/ card counts), owner-scoped.
- `PUT    /api/v1/folders/:id` (auth) — update; guards self-parent and cycles.
- `DELETE /api/v1/folders/:id` (auth) — delete; **refuses if it has sub-folders**; returns `affectedSets`.

Service guards: every fn is `where:{...,userId}` scoped. `updateFolder` rejects
`parentId === folderId` (ValidationError) and runs `wouldCreateCycle` (walks the
parent chain, `visited` set, hard cap 50) to block circular hierarchies.
`deleteFolder` counts `children` first and throws ValidationError if any exist;
otherwise returns `{ message, affectedSets }` (sets whose `folderId` gets
`SetNull`ed by cascade).

### sets — `backend/src/modules/sets/`
`sets.routes.ts` · `sets.controller.ts` · `sets.service.ts` · `sets.dto.ts`
- `GET  /api/v1/sets/public` (auth) — paginated PUBLIC sets, optional `search` (case-insensitive title contains).
- `GET  /api/v1/sets/friends` (auth) — paginated FRIENDS sets owned by the user's friends.
- `POST /api/v1/sets` (auth) — create; verifies `folderId` (if given) belongs to user; defaults visibility PRIVATE.
- `GET  /api/v1/sets` (auth) — list user's own sets (optional `folderId`), w/ card counts.
- `GET  /api/v1/sets/:id` (auth) — one set + cards (ordered) — **visibility gate below**.
- `PUT  /api/v1/sets/:id` (auth) — owner-only update.
- `DELETE /api/v1/sets/:id` (auth) — owner-only delete (cascades cards).
- `POST /api/v1/sets/:id/clone` (auth) — clone accessible set into caller's library.

Service functions:
- `createSet` — logs `CREATED_SET` activity.
- `listSets` — own sets only; validates folder ownership if filtered.
- `getSetById` — fetches set + ordered cards + folder; **owner OR `memberHasGroupPlanAccess`**, else 404. (Note: does **not** honor PUBLIC/FRIENDS here — only owner + group-plan members can hit the full-set endpoint; other users read via `listCardsBySet`.)
- `updateSet` / `deleteSet` — strict `{id, userId}` ownership; 404 on mismatch.
- `getPublicSets` / `getFriendsSets` — paginated, include author `{id,name,profileImage}` + card counts; friends returns empty page if no friendships.
- `cloneSet` — access check (own | PUBLIC | FRIENDS-with-friendship; PRIVATE → 404), deep-copies all cards, forces visibility PRIVATE, keeps `folderId` only if cloning own set, title `"… (Copy)"`, logs `CREATED_SET`.

### cards — `backend/src/modules/cards/`
`cards.routes.ts` · `cards.controller.ts` · `cards.service.ts` · `cards.dto.ts`
- `POST  /api/v1/cards` (auth) — create; verifies set ownership; `order` defaults to current count.
- `POST  /api/v1/cards/bulk` (auth) — up to 100 cards in one `$transaction`.
- `POST  /api/v1/cards/reorder` (auth) — full-set reorder (validates count + membership).
- `GET   /api/v1/cards/due-summary` (auth) — **spaced-repetition** summary (see below).
- `GET   /api/v1/cards/set/:setId` (auth) — cards of a set — **visibility gate below**.
- `GET   /api/v1/cards/:id` (auth) — one card, owner-only.
- `PUT   /api/v1/cards/:id` (auth) — owner-only update.
- `DELETE /api/v1/cards/:id` (auth) — owner-only delete.
- `POST  /api/v1/cards/:id/copy` (auth) — duplicate within same set (order = max+1).
- `PATCH /api/v1/cards/:id/move` (auth) — move to another owned set (order = target max+1).

Service functions & guards:
- `getDueSummary` — `groupBy setId where set.userId = me AND nextReviewAt <= now`; returns `{ dueCount, dueSets, topSet }` where `topSet` is the set with the most due cards (Home deep-links into it).
- `verifySetOwnership` / `verifyCardOwnership` — `{...,userId}` scoped, 404 on miss.
- `listCardsBySet` — **the cross-user read path**: owner always; else PRIVATE requires `memberHasGroupPlanAccess`; FRIENDS requires a friendship **or** group-plan access; PUBLIC open to any authenticated user. Cards returned `order asc`.
- `createCard`/`bulkCreateCards`/`copyCard` — log `CREATED_CARD`.
- `reorderCards` — requires `cardIds` to be **all** cards in the set (count must match) and all belong to user+set; then transactional per-index `order` update.

### DTOs (zod)
- **Folder**: `name` 1–200 (required on create), `parentId` uuid (nullable on update), `color` hex `^#[0-9A-Fa-f]{6}$`.
- **Set**: `title` 1–200, `description` ≤1000, `folderId` uuid, `visibility` enum, `layout` enum, `color` hex. Update = all optional/nullable.
- **Card**: `setId` uuid, `type` enum `QA`|`STORY`, `question` ≤5000 (default `''`), `answer` 1–5000 (required), `note` ≤2000, `imageId` uuid, `order` int≥0, `isBlurred` bool, `difficulty` `EASY`|`MEDIUM`|`HARD`. **`.refine`: question required unless `type === 'STORY'`.**
- **BulkCreate**: 1–100 cards (question required per item here, unlike single-create).
- **Reorder**: `cardIds` 1–500 uuids. **Move**: `targetSetId` uuid.

## Data model
```
Folder  id, name, color?, userId, parentId?, timestamps
        parent Folder? @relation("FolderChildren", onDelete: Cascade)  // deleting parent cascades children
        sets   Set[]                                                    // @@index userId, parentId
        (user onDelete: Cascade)

Set     id, title, description?, color?, folderId?, userId, visibility(PRIVATE), layout(DEFAULT), timestamps
        folder Folder? @relation(onDelete: SetNull)   // folder delete nulls set.folderId
        cards  Card[]                                  // @@index userId, folderId, visibility
        planSteps StudyPlanStep[]  quizAttempts QuizAttempt[]
        (user onDelete: Cascade)

Card    id, setId, type(QA), question, answer, note?, imageId?, order(0),
        isBlurred(false), difficulty(MEDIUM),
        lastStudiedAt?, nextReviewAt?, timestamps
        set  Set  @relation(onDelete: Cascade)         // deleting set deletes cards
        user User? @relation(onDelete: SetNull)        // @@index setId, userId
```
Enums: `Visibility {PRIVATE, PUBLIC, FRIENDS}` · `CardLayout {DEFAULT, MINIMAL,
DETAILED}` · `CardType {QA, STORY}` · `Difficulty {EASY, MEDIUM, HARD}`.

## Edge cases, rules & gotchas
- **Visibility is enforced in two different places with different rules** — a real trap:
  - `GET /sets/:id` (`getSetById`) only allows **owner + group-plan members**. It ignores PUBLIC/FRIENDS. A friend viewing a FRIENDS set (or anyone viewing a PUBLIC set) will 404 on this endpoint.
  - `GET /cards/set/:setId` (`listCardsBySet`) is the endpoint that honors the full matrix (owner | PUBLIC any | FRIENDS w/ friendship | group-plan). So the browse/read flow fetches set metadata from the paginated list responses and cards from `listCardsBySet`, not from `getSetById`.
- **Group-plan access (D2)** — `memberHasGroupPlanAccess(userId, setId)`: true iff a `StudyPlanStep` references the set inside a plan whose `plan.groupId` is set **and** the user is a `GroupMember` of that group. Lets group members study a set without cloning it. Applies to both `getSetById` and `listCardsBySet` (PRIVATE and FRIENDS branches).
- **Clone** always lands as PRIVATE; `folderId` is preserved only when cloning your own set (someone else's folder id would be meaningless). PRIVATE sets can't be cloned by non-owners (404). Cards deep-copied with question/answer/note/imageId/order/difficulty/isBlurred; `nextReviewAt`/`lastStudiedAt` are **not** copied (fresh review state).
- **Spaced repetition is currently read-only / inert.** `nextReviewAt` and `lastStudiedAt` exist on `Card` and are *read* by `getDueSummary`, but **no endpoint ever writes them** (grep confirms the only reference to `nextReviewAt` in the backend is the read in `getDueSummary`). So `dueCount` will effectively stay 0 / whatever seed data sets — flipping a card in `SetDetail` does not schedule a next review. This is the main known limitation / TODO for the study core. `FlashCard.onFlip` is UI-only; there is no review-grading mutation.
- **`difficulty` is metadata only** — stored/editable per card but not consumed by any scheduling algorithm (no SM-2 / interval logic exists).
- **`type: STORY`** relaxes the question requirement (question optional, treated as a reference); single-create defaults question to `''`. **Bulk-create does NOT support STORY** — it still requires a non-empty question per item.
- **Reorder is all-or-nothing**: `reorderCards` rejects unless `cardIds` contains *every* card in the set (count check) and all belong to the user+set; partial reorders error.
- **Folder deletion guardrails**: cannot delete a folder with sub-folders (must move/delete them first); deleting a folder `SetNull`s its sets' `folderId` (sets survive, become unfiled) and returns `affectedSets`. Folder→folder cascade only fires on the DB relation, but the app-level guard blocks it first.
- **Folder cycle protection**: `updateFolder` blocks self-parenting and any move that would create a cycle (chain walk, capped at 50 hops).
- **`isOwner: false`** propagated from public/friends browse hides all card mutation controls, blur toggles, and the "Add Cards" CTA in `SetDetail`; owner-only header items are gated.
- **Empty states** everywhere: no sets / no folders (Library), no sets in folder (FolderDetail), no cards / no search match (SetDetail — CTA only for owners), empty friends list (FriendsSets returns an empty page immediately when the user has no friendships).
- **Card `move`** targets must be owned by the user (`verifySetOwnership` on target); moving invalidates both source and target `['cards', …]` query keys.
- **Search**: Library set search is client-side; PublicSets search is server-side (`title contains`, case-insensitive); FriendsSets has no search.
- **No standalone Study route** — despite the CLAUDE.md architecture map. Studying = flipping `FlashCard`s in `SetDetail`; quizzing = `QuizModeSheet` → `Quiz` (see [[Quiz]]).

## This session's additions (A–G arc)
No direct changes to the study core in this session. The relevant seam is **D2
(group study plans)**: `memberHasGroupPlanAccess` was added and wired into
`getSetById` + `listCardsBySet` so group members can study a plan's sets without
cloning. Spaced-repetition *writing* remains unimplemented (candidate future
work; `getDueSummary` already reads `nextReviewAt`).

## Related
[[Study Plans]] · [[Quiz]] · [[Auth & Account]] · [[Architecture Overview]] · [[Database Schema]]
