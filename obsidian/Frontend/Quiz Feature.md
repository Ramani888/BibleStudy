---
tags: [frontend, feature, quiz]
---

# Quiz Feature

A **Quiz mode** built automatically from a set's existing cards (multiple-choice,
auto-scored, persisted). Reachable two ways: a **Quiz tab** (browse & pick) and a
**Quiz button** inside each [[Module - Library (Folders, Sets, Cards)|set]]. Ported
from the BibleMemory app's `QuizMethod` (see below), adapted from
`Verse{reference,text}` → `Card{question,answer}`.

Added 2026-08. Related: [[Navigation]], [[Screen Map]], [[Hooks & API Layer]],
[[Database Schema]].

## Concept
Reuses the cards already added to a set — no new content type. Each card →
one MC question: `card.question` is the prompt, `card.answer` is the correct
option, and **3 distractors come from other cards' answers in the same set**.
Requires **≥ 4 cards** (1 correct + 3 distractors).

## Navigation
`AppNavigator` grows from 4 → **5 tabs**: Home · Library · **Quiz** · AI · Profile.
- **Quiz tab** → `QuizNavigator` (stack): `QuizHub → Quiz`.
- **Per-set** → `SetDetail` gets a **Quiz** button next to "Study Set"; the `Quiz`
  screen is also registered in `LibraryNavigator`. Same screen, two entry points.

```
QuizTab → QuizHub (lists sets + best scores + "Mixed (all sets)") → Quiz → QuizResult
SetDetail → [Quiz] ─────────────────────────────────────────────▶ Quiz → QuizResult
```

## Engine — `useQuizSession(cards, setId)`
Modeled on [[Screen Map|useStudySession]]. Guard: `< 4 cards` → unavailable.
Per card: `prompt=card.question`, `correct=card.answer`,
`distractors = shuffle(otherCards.answers).slice(0,3)`,
`options = shuffle([correct, ...distractors])` (Fisher-Yates). Grade by exact
index. Tracks `currentIndex / progress / correctCount / isComplete`; on finish
`scorePct = round(correct/total*100)` and persists a QuizAttempt. **Mixed mode**
= same engine with cards flattened across all the user's sets.

Option visual states (from BibleMemory): `idle → correct(green) / wrong(red) /
faded(others 60%)`. Feedback banner + "Next Question".

## Backend — `quiz` module (16th)
`backend/src/modules/quiz/` (routes/controller/service/dto):
- `POST /api/v1/quiz/attempts` `{ setId, total, correct }` → `{ attempt, best }`
- `GET  /api/v1/quiz/sets/:setId/best` → best % for a set
- `GET  /api/v1/quiz/best` → best per set (feeds hub badges)

### Data model — `QuizAttempt` (additive migration)
`id · userId(FK User, cascade) · setId(FK Set, cascade) · total · correct ·
scorePct · createdAt`. Indexes: `(userId)`, `(setId)`, `(userId,setId)`.
Does not mutate cards, so (unlike Study) it is **not** owner-gated — any
authenticated user's attempt on a visible set is recorded. See [[Database Schema]].

## Files
- FE screens: `screens/quiz/{QuizHubScreen,QuizScreen}.tsx` +
  `components/{QuizQuestionView,QuizResultScreen}.tsx`
- FE nav: `navigation/QuizNavigator.tsx`; edits to `AppNavigator`,
  `LibraryNavigator`, `types.ts`; `SetDetailScreen` Quiz button
- FE logic/data: `hooks/{useQuizSession,useQuiz}.ts`, `api/quiz.api.ts`,
  `types/quiz.types.ts`
- BE: `modules/quiz/*`, `schema.prisma`, migration, `app.ts`

## Deferred (v2)
Reverse direction (answer→question) coin-flip · Type-the-answer & Blanks modes
(BibleMemory has these) · AI-generated distractors (Claude+credits) · quiz history
list / streaks / leaderboards · `COMPLETED_QUIZ` activity (needs enum migration).
