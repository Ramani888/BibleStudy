---
tags: [frontend, feature, quiz]
---

# Quiz Feature

> **v2 shipped 2026-08.** This note is the historical overview. For the full
> v2 design (2 card types, 7 modes, Mix) see [[Quiz Feature v2 Plan]].

A **Quiz** module built from a set's existing cards — auto-scored, persisted as
`QuizAttempt`, reachable from the Quiz tab or per-set from SetDetail.
Replaced the old Study feature entirely (Study removed front + back).

Related: [[Navigation]], [[Screen Map]], [[Hooks & API Layer]], [[Database Schema]].

## v2 Architecture (current — 2026-08)

### Card types (2)
- **Q&A** — `question` + `answer` (original card format).
- **Story** — `reference` (optional) + `text` (passage). `Card.type` enum on schema.

### Quiz modes (7)
| Mode | Card type | Scored |
|------|-----------|--------|
| MC (question→answer) | QA | ✓ |
| Type answer | QA | ✓ lenient |
| Fill blanks | STORY | ✓ per-blank |
| Type verbatim | STORY | ✓ lenient |
| MC story (reference↔text) | STORY | ✓ |
| Chunks (assemble order) | STORY | ✓ order |
| Read (memorize) | STORY | ✗ unscored |

**Mix** = per card picks a random supported scored mode.

### Flow
```
QuizTab → QuizHubScreen (recent attempts history)
             → QuizSetupScreen (set picker + mode chips + Start)
                → QuizScreen (full-screen, timer, progress bar)
                   → QuizSummaryScreen (per-question review)
                   → QuizDetailScreen (score hero + attempt info)
SetDetail → QuizModeSheet (bottom sheet, tap mode → QuizScreen)
```

### Screens & components
- `QuizHubScreen` — history list (`useRecentQuizAttempts`), "Start New Quiz" footer.
- `QuizSetupScreen` — set picker (search + sort), mode chips, Start CTA.
- `QuizScreen` — raw View + `useSafeAreaInsets`, full-width progress bar, timer.
- `QuizSummaryScreen` — per-question correct/wrong review.
- `QuizDetailScreen` — score hero, mode/date chips, info card for a past attempt.
- `components/QuizItemView` — renders one question for any mode.
- `components/QuizResultScreen` — score + review icon + pills, saves attempt.

### Engine — `useQuizSession`
Given cards + chosenMode: builds question list, grades responses per mode,
tracks timer + progress. Mix = per card picks a random supported scored mode.
`normalize()` = lowercase + strip punctuation for lenient grading.

### Backend — `quiz` module (16th)
`backend/src/modules/quiz/` — routes/controller/service/dto:
- `POST /api/v1/quiz/attempts` `{ setId, total, correct, mode?, timeSec? }` → `{ attempt, best }`
- `GET  /api/v1/quiz/attempts/recent?limit=N` → recent attempts with set title
- `GET  /api/v1/quiz/sets/:setId/best` → best % for a set
- `GET  /api/v1/quiz/best` → best per set (hub badges)

### Data model — `QuizAttempt`
`id · userId · setId · total · correct · scorePct · mode? · timeSec? · createdAt`.

## v1 (historical reference — MC only)

Original v1 was MC-only (≥4 cards, auto-distractors from other cards' answers,
Fisher-Yates shuffled options). Single `QuizHub → QuizScreen` flow. Superseded
by v2 which added card types, 7 modes, the Setup screen, and attempt history.

## Deferred
- AI-generated distractors (Claude + credits).
- Reverse-direction Story-MC (text → reference).
- `COMPLETED_QUIZ` activity feed event.
- Quiz streaks / leaderboards.
