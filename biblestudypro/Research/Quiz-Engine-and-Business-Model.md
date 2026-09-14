---
title: Quiz Engine & Business Model
tags: [research, quiz, ai, monetization, uiux, strategy]
updated: 2026-09-14
---

# Quiz Engine & Business Model

> Competitive research + a strategy for Verdance's quiz module: the **engine** (how questions
> and scheduling work), the **business model** (what's free vs paid), and the **UI/UX** that
> makes it convert. Companion to [[Quiz]], [[AI Quiz Generation]], [[Credits & Subscriptions]],
> and [[Growth-and-Revenue]].

## 1. What the market does

| Platform | Engine | Monetization | Lesson for us |
|----------|--------|--------------|---------------|
| **Quizlet** | Learn/Test auto-build MC / T-F / written from a set; SRS "solid but simpler than Anki" | Free tier **caps Learn/Test daily**; Plus $35.99/yr removes caps; AI tools paywalled | Daily caps on studying are resented → **don't cap core study** |
| **Anki** | **FSRS** (opt-in 2023) beats **SM-2**: ~20–30% fewer reviews, kills "ease hell" | Free/open; iOS app paid | FSRS is a real win — but a **later opt-in**, not launch-critical. No AI = our opening |
| **Knowt** | Unlimited learn/SRS/tests + AI summaries | **Generous free study tier**; monetizes teacher tooling | Free-unlimited-practice is a competitive **wedge** |
| **Gizmo** | Gamified: streaks, leaderboards, limited "lives" | $22M raised, 13M users on gamification alone | **Gamification = retention = conversion** |
| **StudyFetch** | Generate-from-upload + AI tutor chat | Free tier with limited uploads | Media→cards is a known pattern (we have media chat) |
| **StudyX/NoteGPT/Algor** | AI generation | **Credit-limited AI; run out → buy more** | This is *exactly* our credit model already |
| **Duolingo** | Gamified lessons | **8.8% conversion** (vs ~2% typical); Super (friction) + Max (**AI**); Streak Freeze monetizes loss-aversion; **engagement before monetization** | The playbook: free habit → AI + convenience upsell |

## 2. Where Verdance already sits

We already own every primitive: credit meter, IAP tiers ([[Credits & Subscriptions]]), SM-2 ([[Study Core]]), 7 quiz modes ([[Quiz]]), streaks/achievements/leaderboard ([[Gamification]]), and AI generation (topic + card-grounded, [[AI Quiz Generation]]). **The work is framing, not new machinery.**

## 3. Strategy — 3 layers

### A) Engine
- **Keep the free client-side engine** (7 modes, offline, deterministic). Never cap studying your own cards — this is our Knowt/Quizlet wedge.
- **Wire `difficulty` in** (metadata-only today, [[Study Core]]): Easy→recall/type, Hard→MC with close distractors. Cheap; gives adaptive "difficulty tiers".
- **"Weak cards first" mode** using data already stored (`ease`, `nextReviewAt`, `QuizResponse`) — the "mistake bank" every adaptive engine has.
- **AI quiz = the Anki-killer** (Anki has no AI). Default generated quizzes to **Multiple Choice** (cleanest for LLM content).
- **FSRS: later opt-in** (mirror Anki). ~20–30% win but a bigger swap; SM-2 ships fine.

### B) Module shape (keep lean — no new services)
- **Practice engine** (free, tracked, SRS): `useQuizSession` + `recordAttempt` + SM-2. Unlimited.
- **AI generation** (metered, ephemeral): `/quiz/generate` — the *only* metered surface.
- **Progress/mastery**: analytics over `QuizResponse` we already record — a retention feature, not new infra.

### C) Business model
**Monetize generation + convenience + gamification. Never monetize studying your own cards.**

| Tier | What | Mirrors |
|------|------|---------|
| **Free** | Unlimited manual quiz (all modes), SM-2, streaks, history + **daily AI credits** to try generation | Knowt free + Duolingo engagement-first |
| **Credits** | AI generation metered; run out → daily refill or buy | StudyX/NoteGPT / our model |
| **Premium (sub)** | Unlimited AI generation (no credit friction) + weak-card mode + mastery analytics + offline | Duolingo Max / Quizlet Plus |

Two proven levers we already have hooks for:
1. **Engagement before monetization** — don't gate study; let the streak form, then the AI-credit runs dry and the upgrade lands (reuse existing G2/G3 over-quota CTAs).
2. **Loss-aversion** — a **Streak Freeze**-style earned/paid item (Gizmo/Duolingo live on this).

**Do NOT build (yet):** FSRS now, a separate adaptive/IRT service, or "hearts" (credits already are the friction lever — a second currency for nothing).

## 4. UI/UX (equally important)

Design within the existing system: indigo/violet palette, `Typography` presets, `spacing[n]`, meditation parity (dark/light), `SafeAreaView edges={['top']}` on tab screens. No raw `<Text>`, no magic numbers.

### 4.1 One entry, two clear lanes (QuizSetup)
The mental model must be obvious without explaining credits:
- **"Quiz my cards"** (free, tracked) — pick sets → mode → Start.
- **"✨ Generate a quiz"** (AI, metered) — topic *or* selected sets → Generate.
- Sets win when both present. Show a small **credit chip** ("2 credits") on the AI button so cost is honest *before* the tap (mirror AI chat's credit row). New user (0 sets) → the topic field is the hero.

### 4.2 Generation state (the risky 5–15s)
Free LLM models cold-start slowly → the wait is where users bail.
- **Skeleton/animated state** with rotating reassurance ("Writing your questions…", "Grounding in your cards…"), not a bare spinner.
- Button locked while pending; cancelable.
- **Failure is graceful**: "Couldn't build a quiz — try another topic" + *no credit charged* (already true) — say so in the toast to build trust.

### 4.3 In-quiz (already strong — keep)
Forward-only, timer, progress bar, instant MC feedback, tap-to-reveal. Two adds:
- **Difficulty pip** per question (easy/med/hard dot) once `difficulty` is wired — signals adaptivity.
- **Ephemeral badge** on AI quizzes ("Practice · not saved") so users know it won't appear in history — set expectations, avoid "where did my quiz go?".

### 4.4 Results = the conversion moment
Today: score + quote + review. Add, in priority order:
- **Streak surfaced** ("🔥 4-day streak — come back tomorrow") — loss aversion.
- **Weakest concept / cards to review** → one-tap "Practice these" (free, drives the loop).
- **Mastery bar per set** (from `QuizResponse` history) — progress users don't want to lose.
- For AI quizzes: a soft **"Enjoyed this? Generate another"** with the credit cost — the upsell at peak satisfaction.

### 4.5 Paywall moments (contextual, not nagging)
- Trigger only at **natural friction**: out of AI credits mid-generation, or trying a premium mode. Reuse existing Paywall + over-quota CTAs.
- Frame value as **outcomes** ("unlimited AI quizzes, master any topic"), per [[Growth-and-Revenue]] — sell the study outcome, not "AI".

### 4.6 Gamification surfacing
- Streak + due-count on **Home** and **QuizHub** (loss-aversion touchpoints).
- Achievement unlock animation on quiz complete (exists — keep prominent).
- Consider **Streak Freeze** as an earnable/premium item later.

## 5. Prioritized backlog — STATUS

**Phase 1 — polish ✅ DONE**
1. ✅ AI quiz default mode → **Multiple Choice** (mix→mc).
2. ✅ AI button **credit chip** + **generation loading overlay** (rotating copy). *(cancel intentionally omitted — the server charges once the request lands, so a "cancel" that still costs credits would mislead.)*
3. ✅ **Ephemeral badge** on AI quizzes ("Practice · not saved").
4. ✅ Other-locale strings (es/pt/fr/ko/tl) — 150 keys added (machine-translated, matching the existing unreviewed locale approach; native review still pending pre-launch).

**Phase 2 — engine depth ✅ DONE**
5. ✅ **`difficulty` pip** in-quiz (display-only, EASY/MED/HARD colored dot).
6. ✅ **Review due cards** (the grounded "weak cards" version) — real tracked SR session; entries on QuizHub + Home TODAY card.
7. ✅ **Results upgrades**: streak pill (+ freeze count), **"Practice N you missed"** (mistake-bank re-quiz), **mastery bar per set** (SetDetail, % learned via SM-2).

**Phase 3 — monetization tuning (partial)**
8. ⏳ Contextual paywall polish — existing 402→Paywall CTA reused; outcome-framed copy pass deferred.
9. ✅ **Streak Freeze** — auto-applied, earn 1 per 7-day milestone (max 2), premium auto-refill; surfaced on Home + results.
10. ⛔ **Funnel measurement — DEFERRED (Q5).** No analytics SDK in the app; completing this needs a vendor (PostHog/Amplitude), a privacy-policy update, and live users. Not meaningfully completable pre-launch. Revisit post-launch.

**Phase 4 — later / opt-in ✅ DONE (except dashboard)**
11. ✅ **FSRS** as an opt-in scheduler alongside SM-2 (via `ts-fsrs`; Settings → "Smart scheduling"). SM-2 stays default.
12. ⏳ Mastery analytics **dashboard** (weakest concepts across sets) — per-set mastery shipped (#7); a dedicated cross-set dashboard deferred (low pre-launch value).
13. ❌ **Media→quiz** — REMOVED (2026-09-14, per product call). Was: generate a quiz from an uploaded PDF/image. Deleted end-to-end (QuizSetup file lane, `mediaIds` in quiz.dto/service, `generateQuizCards` media branch + `QUIZ_FROM_MEDIA_SYSTEM_PROMPT`). Media chat (feature F) is untouched — `ai.dto` mediaIds + `askQuestion` seam remain.

**Remaining:** only #8 (copy polish), #10 (analytics — externally blocked), #12 (dashboard — optional). Everything engine/feature-level is shipped and verified.

## 6. The one-line strategy
**Free unlimited practice is the retention engine; AI generation is the monetization wedge; streaks are the conversion lever** — Knowt's free tier + StudyX's credits + Duolingo's gamification, all from primitives we already have.

## Sources
- Quizlet pricing/caps: myengineeringbuddy.com/blog/quizlet-reviews-alternatives-pricing-offerings · nibble-app.com/blog/quizlet-cost
- Anki FSRS vs SM-2: help.remnote.com/en/articles/9124137 · kachika.app/en/blog/spaced-repetition-algorithms
- AI flashcard apps: mwm.ai/apps/knowt-ai-flashcards-notes · junia.ai/blog/gizmo-ai-learning-app · myquizgpt.com/blog/best-ai-flashcard-generators-compared
- Duolingo model: foundercoho.substack.com/p/inside-duolingos-6b-playbook-gamification · medium.com/@nicobottaro (3%→8.8% conversion)
- Adaptive/mastery engine: estha.ai/blog/personalized-learning-quiz-builder-for-edtech

## Related
[[Quiz]] · [[AI Quiz Generation]] · [[Credits & Subscriptions]] · [[Gamification]] · [[Study Core]] · [[Growth-and-Revenue]]
