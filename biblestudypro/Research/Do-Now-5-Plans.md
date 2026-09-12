# Do-Now 5 — Step-by-step plans

> Expanded from [[Growth-Revenue-TODO]]. Grounded in the real codebase (file/line refs verified 2026-09-12).
> These are PLANS, not applied changes. 2 are copy-only, 3 are small builds.

---

## 1. Waitlist on getverdance.com  `P1`

**Goal:** capture emails (+ country) pre-launch, invite in launch-day waves.

**Lazy path (recommended v1 — zero backend, zero deploy risk):** embed a hosted form.
- Landing page = single static file `legal/index.html` (880 lines, inline CSS, deployed by
  `scp legal/index.html root@94.130.176.8:/var/www/getverdance/index.html`). No form today;
  CTAs are "Coming soon" badges. No `/waitlist` backend endpoint exists.
- **Steps:**
  1. Create a **Tally** (or Formspree) form: fields = email + country (dropdown). Free tier,
     stores submissions + CSV export, sends you notifications.
  2. Add a `<section class="sec waitlist-band">` **before the footer** (or replace the CTA
     band's "Coming soon" badges). Reuse existing `.sec` / `.wrap` / `.reveal` / `.btn-primary`
     + CSS vars (`--indigo`, `--muted`) so it matches. Embed the Tally form (or a styled
     `<form action="https://formspree.io/f/xxx" method="POST">`).
  3. Slot the wedge copy here too (see plan #4): "Cancel anytime. No surprise charges."
  4. Deploy: `scp legal/index.html root@94.130.176.8:/var/www/getverdance/index.html`
  5. Verify: `curl -s https://getverdance.com/ | grep waitlist-band`
- **Effort:** 🟡 ~30 min, no app code, no native build.
- **Upgrade path (only if you need in-house data + welcome email):** add `POST /api/v1/waitlist`
  + a one-column Prisma table; reuse the existing nodemailer in `backend/src/utils/email.ts`
  for a "you're on the list" auto-reply. Skip until the hosted form proves demand.
- **Edge cases:** collect **country** now (the research's staggered-by-city invite loop needs
  it). Add a honeypot field if using Formspree (spam). GDPR: one line "we'll email you at
  launch, nothing else."
- **Done check:** submit a test email → appears in Tally/Formspree dashboard.

## 2. "Tell a pastor" referral  `P1` — copy only, no code

**Goal:** make pastor/small-group-leader referral the #1 pre-launch ask (Faithly: "worth more
than money").

- **Steps:**
  1. On the waitlist section, add a second line under the form: *"Know a pastor or group
     leader? Forward this — it's the biggest way to help us launch."* + a `mailto:`/WhatsApp
     share link with prefilled text.
  2. Personally DM/email **3–5 small-group leaders** you know; offer them first access + a
     branded starter set for their group.
  3. Track who you asked in a simple sheet (name, church, status).
- **Effort:** 🟢 copy + outreach. No build.
- **Edge case:** don't spam cold churches — warm intros only; one ask, then follow up once.
- **Done check:** 5 leaders contacted, ≥2 agree to try it with their group.

## 3. Annual as highlighted Paywall option  `P1`

**Goal:** push $39.99/yr Starter / $79.99/yr Pro over monthly (annual retains 53.7% Y1 vs 6.7%).

**File:** `frontend/src/screens/profile/PaywallScreen.tsx` (UI only — safe; do NOT touch
`plans.ts` or `subscription.types.ts`, they're in the review-locked zone and already correct).

**Already done:** period defaults to `'annual'` (line 185); PRO+annual shows a "Best Value"
badge (line 110); savings % (33%) is computed (line 196).

**Remaining steps:**
  1. **Pre-select a paid tier on open** — line 186 currently `useState(FREE_TIER)`. Change to
     the tier you want to nudge (e.g. `TIERS[0]` Starter, or `TIERS[1]` Pro). *Decision needed
     — see question below.*
  2. **Show savings on both plan cards** (not just PRO) — in `PlanCard`, when `period==='annual'`
     render a "Save 33%" pill (new `styles.savingsBadge`, `colors.accentSoft`/`colors.accent`).
  3. **Highlight the annual toggle** — add an accent border when `period==='annual'`
     (lines 216–236), or a small "Recommended" label above it.
  4. Add i18n keys `profile:subscription.save` (+ `recommendedBilling` if used).
  5. Type-check: `cd frontend && npx tsc --noEmit`.
- **Effort:** 🟢 small, ~1 hr, no native rebuild.
- **Edge cases:** keep the FREE card visible (don't hide the free path — network effect
  depends on it). Verify dark + light mode badge contrast. Don't reorder product IDs.
- **Open decision:** pre-select **Starter** (gentler, higher convert) or **Pro** (bigger ARPU,
  but a bigger ask)? Default recommendation: **Starter annual**.
- **Done check:** open Paywall → Starter annual pre-selected, "Save 33%" on both cards, annual
  toggle visually dominant.

## 4. Wedge messaging  `P1` — copy only, no code

**Goal:** bake the two verified wedges into store + landing + onboarding copy.
- **Two lines:**
  - *"Cancel anytime — right from your phone. No surprise charges."* (vs Hallow's billing
    complaints; true because you bill only via Apple/Google IAP).
  - *"Modern Bible flashcards + spaced repetition — no clunky setup."* (vs Anki's dated/paid app).
- **Where to place:**
  1. **Landing page** (`legal/index.html`) — hero lede + the new waitlist section.
  2. **App Store / Play descriptions** (first 2 lines — the visible part before "more").
  3. **Onboarding** — one slide/subtitle.
- **Effort:** 🟢 copy only.
- **Edge case:** "cancel anytime" must stay literally true — it is, via IAP self-service.
  Don't name competitors directly in App Store copy (review risk); imply the contrast.
- **Done check:** both lines live on landing + in store listing draft.

## 5. Rating prompts after wins  `P2` (do-now because high-leverage for ASO)

**Goal:** fire the native rate dialog after positive moments to lift store rating → ranking.

**Dependency:** none installed. Add `react-native-in-app-review` (wraps iOS StoreReview +
Android ReviewManager; OS-rate-limited ~3x/yr; silent no-op if OS declines).
`npm i react-native-in-app-review && cd ios && pod install` → **needs a native rebuild.**

**Steps:**
  1. Add a tiny helper `utils/requestReview.ts`: check an "already prompted for this milestone"
     flag → call `InAppReview.RequestInAppReview()` → set flag. Never block UI, never await.
  2. Store flags via the existing **AsyncStorage** (`frontend/src/utils/storage.ts`) — add keys
     for quiz / achievement / streak-3/7/30/100. (A Zustand `ratingFlags.store` is optional
     overkill for v1 — AsyncStorage is enough.)
  3. **Trigger points** (verified):
     - Quiz high score — `screens/quiz/components/QuizResultScreen.tsx` ~line 60, in the
       `save().then()` callback when `scorePct >= 80`.
     - Achievement unlock — `components/feedback/AchievementUnlockModal.tsx` ~line 71, on
       `onDismiss` (after the celebration, not during).
     - Streak milestone — `screens/home/HomeScreen.tsx` ~line 289–300, when
       `streak === 3|7|30|100`.
  4. Type-check + rebuild native.
- **Effort:** 🔴 ~2 hr + native rebuild (heaviest of the 5).
- **Edge cases:** Apple caps ~3 prompts/yr and may show nothing — that's expected, do NOT add
  a custom "rate us" fallback alert. Fire once per milestone only. Never during an animation.
- **Done check:** hit a 7-day streak (or 80%+ quiz) on a device → OS rate sheet appears once,
  never again for that milestone.

---

## Suggested order to actually do them
1. Wedge messaging (#4) — copy, unblocks #1
2. Waitlist + Tell-a-pastor (#1, #2) — one landing deploy, starts collecting emails today
3. Annual Paywall (#3) — small UI change, no rebuild
4. Rating prompts (#5) — bundle with your next native rebuild

**One open decision for me:** Paywall pre-select **Starter** or **Pro**? (I recommend Starter.)
