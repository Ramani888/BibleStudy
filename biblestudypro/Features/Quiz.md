---
title: Quiz
tags: [feature, quiz]
updated: 2026-08-14
---

# Quiz

> Self-testing over one or many card sets in 7 generated question modes, with
> scored attempts, per-set best scores, item-by-item review, and achievement
> unlocks.

## Screens

One row per screen. Route = the navigation route name.

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| QuizHubScreen | `QuizHub` | QuizStack (QuizTab) | Landing tab: list of recent attempts + "Start New Quiz". |
| QuizSetupScreen | `QuizSetup` | QuizStack (QuizTab) | Pick set(s) to quiz, then open the mode picker; also the retake entry point. |
| QuizDetailScreen | `QuizDetail` | QuizStack (QuizTab) | View a past attempt (score, per-item responses); retake or delete it. |
| QuizScreen | `Quiz` | **RootStack** (full-screen overlay) + also declared in QuizStack | The actual quiz player — one item at a time, timer, progress bar. |
| QuizSummaryScreen | `QuizSummary` | **RootStack** (full-screen overlay) | Post-quiz review: score header, filter All/Correct/Wrong, per-item breakdown. |
| QuizModeSheet | (bottom sheet, not a route) | domain component | Mode picker sheet opened from Library / Setup. |

> `QuizScreen` and `QuizSummaryScreen` are mounted on the **RootStack** (above
> the tabs) so the quiz takes over the whole screen with no tab bar. `Quiz` is
> *also* declared in `QuizStackParamList` so it can be navigated from within the
> Quiz tab, but the running instance overlays App via the root stack.

## Features & functionality

### QuizHubScreen (`QuizHub`)
- Lists recent attempts (`useRecentQuizAttempts`, default limit 20, backend caps at 50).
- Each row: set title(s), mode label, score %, tap → `QuizDetail`.
- Per-row "more options" (`MoreVerticalIcon`) menu → delete attempt (`useDeleteQuizAttempt`).
- Footer button "+ Start New Quiz" → `QuizSetup`.
- Loading / error / empty states.

### QuizSetupScreen (`QuizSetup`)
- Select one or **multiple** sets to combine into a single quiz (multi-set quizzing).
- May be pre-seeded via `preSelectedSetIds` / `preSelectedSetTitles`.
- Carries `retakeAttemptId` when retaking (routes the save to PUT instead of POST).
- Confirming selection opens the mode picker → navigates to `Quiz` with `{ setIds, setTitles, mode, retakeAttemptId, quizName }`.

### QuizModeSheet (bottom sheet)
- Reached from Library (`SetDetailScreen`, `LibraryScreen`, `FolderDetailScreen`) and from Setup.
- Shows a **Mix** option (rotate all supported modes) at top, then every mode the
  set's cards actually support (`supportedModes(cards)`).
- Non-scored modes (Read) are tagged "Practice · not scored".
- Empty states: "Multiple choice needs 4+ cards of the same type." (cards exist but no mode);
  "Add cards to this set to start quizzing." (no cards).
- `onStart(mode, setIds, setTitles)` → navigate to `Quiz`.

### QuizScreen (`Quiz`) — the player
- Loads cards from all selected sets in parallel (`useCardsForSets`).
- Builds items via `useQuizSession(cards, mode)`; renders one `QuizItemView` per item.
- Header: elapsed timer (mm:ss, counts only once cards are ready), title (set title,
  or `quizName`, or "N Sets"), and `index+1 / total` counter. Progress bar fills by position.
- **Forward-only** — no Prev button (matches Duolingo/Quizlet; going back would corrupt SM-2 first-attempt data).
- **Status bar** hidden imperatively via `useFocusEffect` + `StatusBar.setHidden(true, 'fade')`; restores on leave.
- **Per-item flow (non-MC scored):** answer → full-width **CHECK ANSWER** → feedback panel (green ✓ Correct / red ✗ Incorrect + correct answer on wrong) → full-width **CONTINUE** / **FINISH**.
- **MC / story_mc:** tap option → auto-submits + shows color-coded result instantly → CONTINUE.
- **Blanks mode:** word bank tiles (tap to fill next blank, tap filled slot to remove) — no typing.
- **Read mode:** Tap-to-Reveal (verse dimmed → tap reveals one phrase at a time; CONTINUE locked until all shown).
- Responses stored in `Record<index, response>`; `useQuizSession.submit(response)` grades and increments `correctCount`.
- Hardware back during active quiz prompts "Quit quiz? Your progress will be lost."
- On completion → `QuizResultScreen` records attempt, shows score-aware motivational quote card (≥90% celebratory / ≥70% encouraging / ≥50% effort / <50% resilience), offers Retake / Exit → `QuizSummary`.
- States: loading, error ("Failed to load cards"), unavailable ("Nothing to quiz here"), complete.

### QuizSummaryScreen (`QuizSummary`)
- Score header + filter tabs: All / Correct / Wrong.
- Per-item list: mode label, prompt, your answer vs correct answer, correct/incorrect icon.
- `exitToHub` param controls whether Exit returns to the Quiz hub.

### QuizDetailScreen (`QuizDetail`)
- Renders a stored attempt (score, mode, time, set titles).
- Fetches stored per-item responses on demand (`useQuizAttemptResponses`).
- Retake (→ `QuizSetup`/`Quiz` with `retakeAttemptId`) and delete actions.

## The 7 quiz modes

Defined in `frontend/src/types/quiz.types.ts` (`QuizMode`) and
`frontend/src/hooks/useQuizSession.ts` (`MODE_META`, builders, graders).
`mix` is a meta-mode (`QuizSelectableMode = QuizMode | 'mix'`) that rotates a
random scored mode per card.

| Mode | Card type | Label | Scored | What it does |
|------|-----------|-------|--------|--------------|
| `mc` | QA | Multiple choice | ✅ | Shows the question; pick the answer from 4 options. Needs ≥4 QA cards for distractors. |
| `type_answer` | QA | Type the answer | ✅ | Shows the question; type the answer (normalized comparison). |
| `blanks` | STORY | Fill in the blanks | ✅ | ~40% of eligible words (core length ≥3) blanked; **word bank tiles** shown below verse — tap to fill, tap filled slot to remove. No typing. |
| `type_verbatim` | STORY | Type it out | ✅ | Type the whole passage verbatim (normalized comparison). |
| `story_mc` | STORY | Match the verse | ✅ | Shows the reference; pick the matching passage text from 4 options. Needs ≥4 STORY cards. |
| `chunks` | STORY | Order the chunks | ✅ | Passage split into 4-word chunks, shuffled; reorder them. Needs ≥2 chunks. |
| `read` | STORY | Tap to Reveal | ❌ | **Tap-to-Reveal**: verse starts dimmed, tap reveals one phrase at a time. CONTINUE locked until all revealed. **Unscored** (excluded from score denominator). |

### 2 card types
`CardType` enum = `QA` | `STORY` (Prisma). A card's type decides which modes it can produce:
- **QA** cards → `type_answer` (any count), `mc` (≥4 QA cards).
- **STORY** cards → `blanks`, `type_verbatim`, `chunks`, `read` (any count), `story_mc` (≥4 STORY cards).

`supportedModes(cards)` unions the modes available across the set's cards and
drives the mode picker. `buildItems` guarantees every card yields at least one
question: it tries the preferred/selected mode first, then falls back through
the card's other supported modes so no card is silently dropped (unless a builder
returns null, e.g. `chunks` with <2 chunks, `blanks` with no eligible words,
`mc`/`story_mc` without enough distractors).

## Scoring

- `MIN_MC_CARDS = 4`, `BLANK_RATIO = 0.4`, `CHUNK_SIZE = 4`, `OPTIONS = 4`.
- Grading (`gradeItem`): MC/story_mc → index match; type modes → `normalize()`
  equality (lowercase, strip non-alphanumerics, collapse whitespace); blanks →
  each blank normalized-equal to the core word; chunks → exact ordered JSON match;
  read → always true.
- **Score denominator excludes unscored `read` items**: `scoredTotal = items where
  MODE_META[mode].scored`, `scorePct = round(correctCount / scoredTotal * 100)`.
- Backend recomputes `scorePct = round(correct/total*100)` from the posted
  `correct`/`total` (client sends scored counts).

## Data flow

```
QuizScreen → useQuizSession (client-side item build + grading, no query)
           → useCardsForSets → ['cards', setId] (per set, parallel)
Complete → QuizResultScreen → useQuizAttemptSave
           → quizApi.recordAttempt → POST /api/v1/quiz/attempts        (new)
           → quizApi.updateAttempt → PUT  /api/v1/quiz/attempts/:id     (retake)
Hub list  → useRecentQuizAttempts ['quiz','attempts','recent',limit] → GET /quiz/attempts/recent
Best      → useAllQuizBest ['quiz','best'] → GET /quiz/best
          → useQuizBest(setId) ['quiz','best',setId] → GET /quiz/sets/:setId/best
Detail    → useQuizAttemptResponses ['quiz','attempt',id,'responses'] → GET /quiz/attempts/:id/responses
Delete    → useDeleteQuizAttempt → DELETE /quiz/attempts/:id
```
All mutations invalidate the whole `['quiz']` query key on success.

## Backend

- **Module**: `backend/src/modules/quiz/` — `quiz.routes.ts` · `quiz.controller.ts`
  · `quiz.service.ts` (owns Prisma) · `quiz.dto.ts` (zod). Whole router is behind
  `authMiddleware`.

- **Endpoints** (all `authMiddleware`, prefix `/api/v1/quiz`):
  - `POST /attempts` — record a new attempt (`RecordAttemptDto`). Returns `{ attempt, best }`, 201.
  - `PUT /attempts/:id` — overwrite an existing attempt (retake) (`RecordAttemptDto`). Returns `{ best }`.
  - `DELETE /attempts/:id` — delete an attempt (owner-scoped).
  - `GET /attempts/recent?limit=` — recent attempts (limit clamped to ≤50, default 20).
  - `GET /attempts/:id/responses` — stored per-item `responses` JSON for one attempt.
  - `GET /best` — best score + attempt count grouped per set (`getAllBest`).
  - `GET /sets/:setId/best` — best `scorePct` for one set.

- **Service functions** (`quiz.service.ts`):
  - `recordAttempt(userId, dto)` — verifies all `setIds` exist (else `NotFoundError`),
    computes `scorePct`, creates `QuizAttempt` (stores `setIds[]`, primary `setId`,
    optional `mode`/`quizName`/`timeSecs`/`responses`), calls
    `triggerAchievementCheck(userId)`, then **feeds spaced repetition** via
    `applySpacedRepetition` → `cards.service.applyReviews` (each scored response's
    `cardId`+`isCorrect`; skips unscored `read` items). Returns attempt + best.
  - `updateAttempt(userId, id, dto)` — `updateMany` scoped to `{ id, userId }`
    (ownership guard); throws if `count === 0`. Recomputes `scorePct`. **Also feeds
    spaced repetition** (retakes are real reviews). Returns new best.
    Does **not** re-trigger achievements.
  - **SR link**: `SummaryItem` now carries `cardId` (frontend `buildSummaryItems`
    + backend `SummaryItemDto`), so a quiz doubles as a review session — see the
    SR section of [[Study Core]] for the SM-2 algorithm.
  - `deleteAttempt(userId, id)` — `deleteMany` scoped to `{ id, userId }`; throws if none deleted.
  - `getBestForSet(userId, setId)` — `_max scorePct` (null if none).
  - `getRecentAttempts(userId, limit=20)` — recent attempts joined with set titles;
    resolves `setTitles` for all `setIds` (falls back to legacy single `setId`).
  - `getAttemptResponses(userId, id)` — owner-scoped responses JSON.
  - `getAllBest(userId)` — `groupBy setId` → `{ setId, best, attempts }`.

- **DTOs** (`RecordAttemptDto`, zod):
  - `setIds`: string[] min 1 (at least one set required).
  - `total`: positive int; `correct`: int ≥0; refine `correct <= total`.
  - `mode?`: string ≤30; `quizName?`: string ≤100; `timeSecs?`: int ≥0.
  - `responses?`: array of `{ index, mode, prompt, isCorrect, userAnswer, correctAnswer }`.

## Data model

`QuizAttempt` (`backend/prisma/schema.prisma`):
- `id`, `userId`, `setId` (primary set), `setIds String[]` (all sets in a multi-set quiz),
  `total`, `correct`, `scorePct Int`, `mode String?`, `quizName String?`,
  `timeSecs Int?`, `responses Json?`, `createdAt`, `practicedAt @updatedAt`.
- Relations: `user` (cascade delete), `set` (cascade delete) — deleting a set or
  user removes its attempts.
- Indexes: `@@index([userId])`, `@@index([setId])`, `@@index([userId, setId])`.

`Card.type` = `CardType` enum (`QA` | `STORY`) — the pivot the whole mode system turns on.

## Edge cases, rules & gotchas

- **Client-side generation**: questions, distractors, blanks and chunks are all
  built and graded on the device (`useQuizSession`); the backend only stores the
  scored result. No credit cost, no AI, no server round-trip during play.
- **Read is unscored**: excluded from `scoredTotal`; `buildSummaryItems` marks it
  `isCorrect: true`; a read-only quiz has `scorePct` computed over 0 scored items → 0.
- **Mode fallback**: selecting a mode that doesn't apply to a card still produces a
  question via the card's other supported modes — the selected mode is a preference,
  not a filter. `mix` prefers scored modes.
- **MC gating**: `mc`/`story_mc` require ≥4 same-type cards for 4 distinct options;
  builders return null (item skipped) when distractors are insufficient, and the
  picker hides the mode when the set can't support it.
- **Multi-set quizzing**: `setIds[]` lets a quiz span several sets; `setId` stores the
  primary (first). `getRecentAttempts` resolves titles for all of them, with a
  legacy fallback for old single-`setId` rows.
- **Retake vs new**: presence of `retakeAttemptId` switches the save from POST to PUT
  (`useQuizAttemptSave`); PUT overwrites the same row so retakes don't inflate counts.
- **Ownership**: update/delete use `{ id, userId }`-scoped `*Many` and throw
  `NotFoundError` when nothing matches — a user cannot touch another user's attempt.
- **Limit clamp**: `/attempts/recent` clamps `limit` to ≤50 regardless of query value.
- **QuizNavigator reset quirk**: on blur that is a *real* tab switch (not a root
  overlay like Quiz/QuizSummary), the Quiz stack is reset to `QuizHub` so returning
  to the tab starts fresh — deliberately distinguishing overlay from tab-switch.
- **Reachability (two paths)**:
  1. **QuizTab hub** → `QuizSetup` → mode sheet → play.
  2. **Per-set from Library** — `SetDetailScreen`/`LibraryScreen`/`FolderDetailScreen`
     open `QuizModeSheet` directly and jump into `Quiz`.
- **Achievements**: `recordAttempt` fires `triggerAchievementCheck` (fire-and-forget
  dynamic import → `achievements.service.checkAchievements`). Quiz-driven metrics:
  - `quizzes_taken` = `count(QuizAttempt where userId)` → `first_quiz` (1), `quiz_10` (10).
  - `perfect_quiz` = `count(where scorePct = 100)` → `perfect_quiz` "Perfect Score" (1).
  - `quiz_modes` = distinct non-null `mode` count → `quiz_explorer` "Quiz Explorer" (4).
  - `updateAttempt` (retake) does **not** re-trigger the check.

## Session additions

**A–G arc:** Quiz predates the monetization arc; the relevant tie-in is the **achievements module** (Phase C): quiz attempts feed four achievement definitions (`first_quiz`, `quiz_10`, `perfect_quiz`, `quiz_explorer`) via `triggerAchievementCheck` in `recordAttempt`. No credit/subscription gating — quiz stays fully free and client-generated.

**2026-08-16 UX overhaul (commit `5d65591`):**
- Fixed critical bug: `useQuizSession.submit()` was never called from `QuizItemView` — score was always 0%, all answers always "wrong". Wired via new `onSubmit` prop.
- CHECK ANSWER full-width bar (non-MC scored modes); MC auto-submits on tap.
- Feedback panel after each answer: green ✓ / red ✗ + correct answer shown on wrong.
- Removed Prev button — forward-only navigation.
- Blanks: word bank tiles replace TextInput fields.
- Read: Tap-to-Reveal replaces plain text display.
- Status bar imperatively hidden via `useFocusEffect` (declarative `<StatusBar hidden />` was overridden by root App.tsx StatusBar).

## Related

[[Library]] · [[Cards & Sets]] · [[Achievements]] · [[Architecture Overview]] · [[Database Schema]]
