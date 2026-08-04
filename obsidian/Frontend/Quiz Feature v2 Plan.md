---
tags: [frontend, feature, quiz, plan]
---

# Quiz Feature v2 — Plan (card types + 7 quiz modes)

Approved decisions: sets can **mix** Q&A + Story cards; Story = optional
`reference` + `text`; Story-MC needs ≥4 story cards; quiz shows only modes the
set supports; **Mix** rotates all supported modes; old cards default to Q&A;
manual bulk-add UI removed (AI bulkCreate kept). Related: [[Quiz Feature]].

## Card types (2)
Add `Card.type` enum `QA | STORY` (default QA). Reuse existing columns:
- **QA:** `question` + `answer` (unchanged).
- **STORY:** `question` = reference (may be empty), `answer` = passage text.
Only new column is `type` → one additive migration; existing cards → QA.

## Add-card UX
`CreateCard`/`EditCard`: a **Q&A | Story** toggle at top.
- Q&A → Question + Answer fields (current).
- Story → Reference (optional) + Text fields.
Remove the **manual bulk-add** UI from CreateCard. Keep `bulkCreate` API +
`useBulkCreateCards` (AIChat suggested-cards uses it).

## Quiz modes (7) — support by card type + gate
| Mode | Card type | Needs | Scored |
|------|-----------|-------|--------|
| MC (question→answer) | QA | ≥4 cards | ✓ |
| Type answer | QA | 1 | ✓ (lenient) |
| Fill blanks | STORY | 1 | ✓ (per blank) |
| Type verbatim | STORY | 1 | ✓ (lenient) |
| MC story (reference↔text) | STORY | ≥4 story cards | ✓ |
| Chunks (assemble order) | STORY | 1 | ✓ (order) |
| Read (memorize) | STORY | 1 | ✗ unscored |

Set's available modes = union of its cards' supported modes (respecting gates).

## Flow
```
Quiz tab → QuizHub (sets + best)                    per-set button (SetDetail)
   → tap a set ─────────────┐                              │
                            ▼                               ▼
              QuizModePicker (only supported modes + "Mix (all)")
                            │
                            ▼
                      QuizScreen  (renders the mode-specific view per question)
                            │  Mix → each card picks a random supported mode
                            ▼
                      QuizResult (score = correct ÷ scored-total; Read excluded)
```

## Engine (useQuizSession)
Given cards + chosenMode: build a question list.
- per card → supported modes (by type + gates);
- fixed mode → filter cards that support it, one Q each;
- Mix → per card pick a random supported (scored) mode;
Grading per mode (index / normalized text / per-blank / order). `normalize()`
= lowercase + strip punctuation (from BibleMemory).

## Files
**Backend:** schema `Card.type` + migration; `cards.dto` accept `type` (+ allow
empty question for story); remove `/cards/bulk` route? **NO** — keep (AI). Add
optional `QuizAttempt.mode`.
**Frontend:**
- types: `Card.type`, `CardType`, `QuizMode` union.
- CreateCard/EditCard: type toggle + conditional fields; drop manual bulk UI.
- Quiz views: keep `QuizQuestionView` (MC) → add `TypeAnswerView`,
  `BlanksView`, `ChunksView`, `ReadView` (StoryMC reuses MC view).
- `useQuizSession`: multi-mode + Mix + per-card support.
- Screens: new `QuizModePickerScreen`; hub + SetDetail route into it.
- nav: add `QuizModePicker` to QuizStack + Library Quiz param.

## Build phases
1. BE: Card.type + migration + dto.
2. FE data/types + CreateCard/EditCard type toggle (+ remove manual bulk UI).
3. Engine: mode support + Mix + grading.
4. Mode views (type/blanks/chunks/read) + StoryMC.
5. QuizModePicker + hub/SetDetail wiring.
6. Verify (tsc/lint, device) + docs + graphify.

## Open flags
- Story-MC "reference↔text": show reference, pick text (and/or reverse). Default:
  reference→text only for v1.
- Chunks granularity: 3-4 word groups (BibleMemory used 4).
