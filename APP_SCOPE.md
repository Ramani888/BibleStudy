# BibleStudyPro — Finalized App Scope (AI + Subscription + Media)

> Draft for review. Nothing here is built yet. Decisions marked **[DECIDE]** need your call.

## 0. What already exists (don't rebuild)

| Piece | State | Location |
|---|---|---|
| AI chat (Q&A, follow-ups, flashcard generation) | ✅ live on Claude Haiku | `ai.service.ts` |
| Sessions, history, rename, tags, bookmarks | ✅ live | `ai` module |
| Credit economy (spend 1/question, block at 0) | ✅ live | `ai` + `credits` |
| Credit earning (daily login +1, streaks) | ✅ live | `credits.service.ts` |
| `Plan` enum: FREE / STARTER / PRO | ✅ defined, **unused** | `schema.prisma` |
| Per-user storage quota (default 250 MB) | ✅ live | `User.storageLimit` |
| Media upload (images + PDF, S3, 20 MB) | ✅ live | `media` module |
| Per-user AI rate limit (30/hr) | ✅ live | `aiRateLimit` |

**Conclusion:** monetization is ~40% plumbed already. This is an *activation* project, not a greenfield build.

### Current social scope vs. gap (important for church-plan revenue)

| Feature | State | Scope today |
|---|---|---|
| **Friends** | ✅ ~90% done | Connection graph (search, request/accept/reject/cancel, block/unblock, remove) **+ shared study sets** (view/clone friends' FRIENDS-visibility sets, `/sets/friends`) **+ friends activity feed** (`/activities/friends`). Only gamification compare (leaderboard) left. |
| **Groups** | ⚠️ ~40% done | **Membership only:** create/join (invite code), roles (OWNER/ADMIN/MEMBER), members, public discovery. **No shared study content** — members can't *do* anything together. |
| **Gatherings** | ⛔ parked | Backend built; `map/` UI screens exist but `MapNavigator` is **mounted nowhere → unreachable**. Not needed for revenue; leave dormant, wire later only if in-person community becomes core. |

**The Groups gap:** a group today = a **roster**. No shared sets, no group study plan, no group
progress, no group leaderboard, no discussion.

**Why it blocks money:** nobody pays for a roster. The "Church/group plan = the real money" idea
(§5.5) only works once a group *does something together* — studies the same material, tracks
progress, competes/encourages. **Group shared-content is a prerequisite for church revenue, not a
polish item.** This is exactly Phase D2's job (group study plans + progress).

**Decision (2026-08-08):** keep & invest in **Groups** (core to revenue); **park Gatherings**
(don't delete — dormant backend is free to keep).

---

## 1. AI Provider Strategy

Two providers, capability-routed. Claude stays wired permanently.

```
askQuestion()
   ├─ media attached?  → Claude Haiku (vision + PDF native)
   └─ text only        → AI_PROVIDER env (free OpenRouter model default)
```

- **Text chat** → free OpenRouter model (dev/beta) → cheap paid model (production).
- **Media chat** → Claude. ✅ **LOCKED (Decision 2):** route media to Claude natively, do **not**
  extract PDF text for the free model — quality + PDF/image handling is the whole reason Claude stays.
- Model IDs live in `.env` (`AI_PROVIDER`, `AI_MODEL`, `OPENROUTER_API_KEY`) — free models get delisted, never hard-wire.
- Seam = one `generateAnswer({ system, messages, media })` function. All downstream logic (parsing, credits, sessions) is provider-agnostic and untouched.

**Reality check:** OpenRouter free tier = 20 RPM + 1,000 req/day **app-wide** (not per user). Fine for beta, not for scale. Production text = cheap paid model (DeepSeek-class), not free.

---

## 2. AI Feature Scope (what the AI can do for users)

### Live today
1. Bible/theology/faith Q&A with verse citations
2. 3 follow-up suggestions per answer
3. Flashcard generation (3–8 cards) on explicit request → feeds flashcard core
4. Multi-turn sessions with history/tags/bookmarks

### Proposed additions
5. **Media Q&A** — attach an uploaded doc, ask about it (Claude path). ✅ **LOCKED (Decision 1):**
   **PDF-only first** (Phase F.1 — highest value for Bible study: commentaries, study guides).
   **Images later** (Phase F.2).
6. **Generate cards directly from a media doc** — "make 10 cards from this study guide PDF"
7. *(later, optional)* verse-of-the-day explainer, set-summary, quiz-question generation from a set

**Scope guardrails per question:** max 1 PDF **or** ≤3 images; PDF page/size cap enforced; question ≤2000 chars; history ≤20 msgs (all already partly enforced).

---

## 3. Credit Model (the metering layer)

Keep credits as the universal meter. Different actions cost different credits:

| Action | Credits | Rationale |
|---|---|---|
| Text question | 1 | current |
| Flashcard batch generation | 2 | longer output |
| Media (PDF) question | 5 | large context (Claude) |
| Media (image) question | 3 | vision tokens (defined now, ships with images in Phase F.2) |

✅ **LOCKED (Decision 3):** costs above. Variable cost already fits `CreditTransaction.creditsUsed`
— no schema change. Tune numbers after real usage data.

---

## 4. Subscription Plans (activate the `Plan` enum)

✅ **LOCKED (Decision 4 — numbers):**

| | FREE | STARTER | PRO |
|---|---|---|---|
| Price | $0 | **$4.99/mo · $39.99/yr** | **$9.99/mo · $79.99/yr** |
| Monthly credits | earn-only (daily login/streak) | **100/mo** | **500/mo** |
| Text AI chat | ✅ (free model) | ✅ | ✅ |
| Media in chat | ❌ | ✅ | ✅ |
| Storage | 250 MB | **2 GB** | **10 GB** |
| Rate limit | 30/hr | **60/hr** | **120/hr** |
| Social (friends + leaderboard) | ✅ free | ✅ | ✅ |

Notes: annual ≈ 2 months free (retention lever). Same Claude model for all tiers — differentiate on
*volume* (credits/storage/rate), not model quality; simpler and avoids "why is my paid answer worse."

✅ **LOCKED (Decision 5 — social gating):** **Never gate the social layer.** Friends, groups, and
gatherings stay free on all tiers. Monetize AI usage + storage + (later) group study plans, not
basic connection. Gating social kills the network effect that grows the app.

> **Church/group plan** (B2B, per-seat) pricing is **deferred** — it depends on Phase D2 (group
> study plans) existing. Placeholder: ~$2/seat/mo or a flat per-group tier. Decide when D2 lands.

### Billing — the critical constraint
This is a **mobile app**. Apple & Google **require** digital subscriptions to use **In-App Purchase / Play Billing** — Stripe/web checkout is **not allowed** for in-app digital goods and will get you rejected.

- iOS → StoreKit / **Apple IAP** (Apple takes 15–30%)
- Android → **Google Play Billing**
- Library: `react-native-iap` (single API for both)
- Backend: verify receipts server-side, then set `User.plan` + grant monthly credits via a `CreditTransaction`

✅ **LOCKED (Decision 6 — billing cadence):** offer **both monthly + annual** per tier from launch.
Annual (~2 months free) lifts LTV and retention; Apple/Google support introductory discounts.

---

## 5. Storage & Media

- Storage quota already enforced per user (`storageUsed`/`storageLimit`).
- Subscription bumps `storageLimit`.

✅ **LOCKED (Decision 7 — downgrade over quota):** **block new uploads, never delete** existing
files. User keeps everything they have; can't add more until they're under the new limit or upgrade
again. Simplest, safest, no data loss.

---

## 5.5 Monetization Strategy & Moat

### The core truth
ChatGPT free is a **loss leader** — OpenAI lost **$13.5B** in H1 2025, **95%** of users pay
nothing, even the **$200/mo** Pro plan loses money. They subsidize it with investor billions to
win market dominance. **We cannot compete on "free/cheap AI" — we have no war chest.** So we
never sell AI. We sell **Bible study outcomes**; AI is one feature inside the product.

### The moat (what ChatGPT structurally cannot do)
ChatGPT is a blank text box. Our app is a purpose-built study system. These LIVE features are
the moat — none are replicable in ChatGPT:

| Feature (live) | ChatGPT |
|---|---|
| Flashcards + study sets | ❌ |
| Quiz (7 modes) | ❌ |
| Friends, groups, in-person gatherings on a map | ❌ |
| Activity feed + notifications (accountability) | ❌ |
| Personal media library (their PDFs/notes) | ❌ |
| Notes | ❌ |
| Daily verse + streaks | ❌ |
| Progress tracking | ❌ |

Users pay not for AI answers (ChatGPT gives those away), but for **a structured way to learn and
remember scripture, with their group, tracked over time.**

### Market proof (faith-app vertical is lucrative)
- **Hallow** (Catholic) — subscription + community + content, raised $100M+.
- **YouVersion Bible** — 600M+ installs (proves audience scale).
- **Glorify / Pray.com** — profitable subscription faith apps.
None win on cheap AI. All win on **content + community + habit**.

### Revenue paths (priority order)
1. **Church / small-group plans (B2B2C)** — 🎯 *the real money.* Sell seats to a group leader or
   church. Groups/gatherings are deferred post-launch — group study plans (D2) are the prerequisite. One church = 30–200 seats at once.
2. **Consumer Premium subscription** — freemium; Premium unlocks advanced AI, more storage,
   premium study plans, group features. (Hallow's model.)
3. **Premium content** — curated reading/study plans, devotionals (AI-assisted to produce cheaply).
- **Avoid ads** — cheapens a faith app, pays poorly. Subscription + church plans instead.

### Gamification = the retention → revenue engine (Duolingo model)
Foundation already exists: **streaks are live** (`credits.service.ts`, current + longest streak).
People pay to protect a habit/identity, not to buy tokens. Build:
- **Streaks** (have it) → "don't break your study streak"
- **Milestones / achievements** → "Memorized 100 verses", "Completed Romans", "30-day reader"
- **Group leaderboards** → friendly competition on the existing social layer
- **Reading/study plans with progress** → completion = achievement, reason to open daily

### Mindset shift on AI cost
AI cost is **our internal cost to manage** (free OpenRouter for text, Claude for media — §1),
invisible to the user. Cheap AI on our side = **higher margin**, not a selling point.

### Recommended focus order
1. **Gamification layer** (milestones/achievements/group leaderboards) — deepens the moat, drives
   daily habit. Do early.
2. **Reading/study plans** with progress tracking.
3. **Subscriptions** (Premium + Church plans) once the habit loop is sticky.
4. AI provider routing runs quietly as cost control throughout.

---

## 6. Unified Roadmap (phased, each shippable)

Two goals reconciled into one order: **de-risk AI cost first** (small quick win), then
**build the moat that makes people pay** (gamification + content), then **monetize**, then
**deepen AI**. Money follows retention; retention follows the habit loop — so gamification
comes before media and subscriptions, not after.

| Phase | What | Why here | Size |
|---|---|---|---|
| **A. Provider swap** ✅ DONE | Text chat → free OpenRouter via `generateAnswer` seam; Claude stays. Model `google/gemma-4-26b-a4b-it:free` (non-reasoning, fast). Verified answers/follow-ups/flashcards. | Stops the Claude bill immediately; tiny; unblocks everything else. | S |
| **B. Variable credits** ✅ DONE | Per-action credit cost (text 1 / flashcards 2). `CREDIT_COST` constant in `ai.service.ts`; charge floored at balance (never negative); labeled transactions. Media costs slot in at F. | Trivial follow-on to A; sets the metering that plans will sell. | S |
| **C. Gamification** ✅ C1+C2+C3 DONE | C1 achievements (17 defs, `UserAchievement` table, +5 credits + notification on unlock, real-time triggers, Profile screen). C2 streak surfaced (Home + Profile). C3 friends leaderboard (`GET /friends/leaderboard`, ranked by current streak + longest/achievements, LeaderboardScreen via Friends trophy button). | **The moat + retention engine.** Drives daily habit → willingness to pay. Do before monetizing. | M |
| **D. Study plans (personal → group → church)** — ✅ D1+D2 DONE | *One feature at three levels, in order:* **(D1) Personal plans** — ordered daily content (reuses sets/cards/quiz) + per-user progress; **(D2) Group plans** ✅ — a group does one plan together + group progress/leaderboard (fills the group shared-content gap from §0); **(D3)** groups are now sellable → church plans become real. | Reason to open daily; feeds achievements; **and it's the prerequisite that makes church revenue possible** — a group must *do something together* before anyone pays for it. | M–L |
| **E. Subscriptions** | `react-native-iap`, receipt verification, plan→benefit mapping, monthly credit grants, Premium + **Church/group plans**, paywall UX. | The money. Only converts once C+D make the app sticky. | L |
| **F. Media in chat** | **F.1 PDF first** then **F.2 images**: `mediaIds` on `/ai/chat`, Claude PDF/vision path, media picker in `AIChatScreen`. | Premium AI upsell — lands better as a paid perk once subscriptions exist. | M |
| **G. Enforcement & polish** ✅ G1–G3 DONE | Per-tier rate limits + storage bumps landed in E-a. G1 media full-cost-upfront (reject before Claude, no floor), G2 over-quota banner→Paywall on Profile, G3 out-of-credits Upgrade CTA in AI chat. G4 S2S renewal webhooks deferred. | Hardens the paid tiers after they exist. | M |

**Sequencing logic:** A→B are same-week cost wins. C→D build the habit loop ChatGPT can't
copy. E monetizes that stickiness — but note **E's church plans depend on D2 (group plans)**:
consumer Premium can ship after D1, church plans only after D2 gives groups shared content.
F is a premium AI perk that sells better *inside* a paid tier than as a free feature. G hardens
everything.

### Progress log (2026-08-08)
- **Phase A shipped** — `generateAnswer()` provider seam (Claude ↔ OpenRouter) in `ai.service.ts`,
  env-switched (`AI_PROVIDER`/`AI_MODEL`/`OPENROUTER_API_KEY`), raw `fetch` (no new dep). Model
  `google/gemma-4-26b-a4b-it:free`. AI-chat request timeout raised to 60s (frontend). Added a
  transient-failure retry (429/5xx, 3 attempts, backoff) to the OpenRouter path — self-heals the
  free-tier cold-start / shared-pool flakiness that caused first-hit "Ask AI" failures.
- **Phase B shipped** — variable credits: text 1, flashcard generation 2, via `CREDIT_COST` in
  `ai.service.ts`; charge floored at balance (never negative); transaction labeled by action; the
  sent message shows the real charge.
- **Phase C shipped (C1+C2)** — Achievements: `UserAchievement` table + 17 code-defined defs
  (`achievements` module), `GET /achievements`, unlock → +5 credits + notification, real-time
  triggers (via `logActivity` + AI/quiz/daily-login hooks, fire-and-forget dynamic import),
  Profile → Achievements screen. Streak surfaced on Home (existing) + Profile stats row.
- **Phase C3 shipped** — friends leaderboard. Backend `GET /friends/leaderboard` (`friends.service.getLeaderboard`
  reuses `listFriends` + `getStreak`; you + friends ranked by current streak, tiebreak longest then name;
  achievements unlocked via one grouped `UserAchievement` query). Frontend: `useLeaderboard` hook,
  `LeaderboardScreen` (rank/medals, 🔥 streak, longest + achievements as secondary, your row highlighted),
  trophy entry on the Friends screen header. No external deps; verified against DB.
- **Phase D1 shipped** — personal study plans: `plans` backend module (`StudyPlan`/`StudyPlanStep`/
  `StudyPlanProgress` tables, per-user progress so D2 needs no migration; CRUD + step
  complete/uncomplete; nullable `groupId` for D2). Frontend: StudyPlans/PlanDetail/CreatePlan screens
  under Library (📖 header entry). "Plan Finisher" achievement (metric `plans_completed`) added,
  unlocks via the existing step-complete trigger.
- **Phase D2 shipped** — group study plans. Backend (D2a): `groupId` on `createPlan` (OWNER/ADMIN
  only via `assertGroupAdmin`); `GET /plans/group/:groupId` (member's own progress per plan);
  `GET /plans/:id/members-progress` (leaderboard, sorted desc); `getPlan`/`completeStep` allow
  group members; members can read PRIVATE/FRIENDS sets used by a group plan via
  `memberHasGroupPlanAccess` (`utils/planAccess.ts`, wired into sets/cards fetch — no cloning).
  Frontend (D2b): GroupDetail → **Study Plans** section (list + your progress bar, admin **New**
  button); new `GroupPlanDetailScreen` (steps + check-off + your progress + members leaderboard;
  step tap cross-navigates to LibraryTab→SetDetail so members study non-owned sets); `CreatePlanScreen`
  reused for both stacks via optional `groupId` route param; `useGroupPlans`/`useMembersProgress`
  hooks; registered `GroupPlanDetail` + `CreateGroupPlan` in `ProfileNavigator`.
  **This unblocks E's church/group plans** (groups now do something together → sellable). Next: E
  (subscriptions/IAP) or C3 (leaderboards) / F (media in chat).
- **AI chat UX fixes** (side quest, not a roadmap phase):
  - Empty-answer parser fallback (cards-with-no-intro no longer blank).
  - Inline "Create new set" in save-cards sheet — shown only when the user has zero sets.
  - Save-to-Set now works on messages loaded from history.
  - **Follow-ups persisted** — added `AIChat.followUps` (migration); restored from history.
  - **Persistent "✓ Saved" state** — added `AIChat.cardsSaved` (migration) + `PATCH
    /ai/chats/:chatId/cards-saved`; prevents duplicate saves, survives history reopen.
  - **Chat session moved to a Zustand store** (`store/aiChat.store.ts`) — the active
    conversation now survives navigation consistently; trash/New-Conversation is the only clear.
    Continue-from-history loads into the store; dropped the push-new-instance hack.

---

## Phase C — Gamification (detailed scope, finalized 2026-08-08)

**Goal:** retention/moat engine — milestones + achievements that make the app a daily habit,
built on the streak foundation that already exists.

### Data foundation (all already recorded)
- `Activity` events (via `logActivity`): CREATED_CARD, CREATED_SET, JOINED_GROUP, ADDED_FRIEND
  *(note: STUDIED_CARDS & CREATED_NOTE enum values exist but are never logged — not used in v1)*
- `QuizAttempt`: count, scores, perfect scores, modes
- Streak (current + longest) from daily-login `REWARD` txns
- `AIChat` rows (AI questions countable) · `notifications` module (unlock alerts) · credits

### Sub-phases
- **C1 — Achievements (core).** Definitions in **code** (static list ~15). New table
  **`UserAchievement`** (`userId`, `key`, `unlockedAt`) — persist *unlocks only*. Progress computed
  from existing data. Central `checkAchievements(userId)` after key write events **+** on opening
  the achievements screen; on unlock → write row, fire Notification, **award bonus credits**.
  Endpoint `GET /achievements` (all, unlocked + progress). Frontend: Achievements screen in Profile
  + summary badge.
- **C2 — Streak surfacing + milestones.** Streak achievements (3/7/30/100-day); make streak
  prominent. Folds into C1's list.
- **C3 — Group + friend leaderboards.** Deferred — needs a scoring metric decision (see locked #11).

### Starter achievement list (~15, all from existing data)
Study: First Card · 10 Cards · 50 Cards · First Set · 5 Sets ·
Quiz: First Quiz · 10 Quizzes · Perfect Score · Quiz Master (all modes) ·
Streak: 3-day · 7-day · 30-day · 100-day ·
Social: First Friend · Joined a Group ·
AI: Curious Mind (first AI question) · 50 AI Questions
*(Dropped "Joined a Gathering" — gatherings parked/unreachable.)*

### Locked Phase C decisions
| # | Decision | Value |
|---|---|---|
| C-1 | Achievement storage | Code-defined defs + persisted `UserAchievement` unlocks |
| C-2 | Bonus credits on unlock | **Yes, +5 credits** (REWARD txn) — ties into the credit economy |
| C-3 | When to check unlocks | After key write events **+** on achievements-screen open (safety net) |
| C-4 | Leaderboards | **Defer to C3** — ship C1+C2 first |
| C-5 | STUDIED_CARDS/notes logging | **Skip for v1** (quiz already proves engagement) |
| C-6 | Gathering achievement | **Dropped** (feature parked) |

**Build order:** C1 (achievements + unlock + bonus credits + screen) → C2 (streak milestones) →
[later] C3 (leaderboards). Start with C1.

---

## Phase D1 — Personal study plans (scope, finalized 2026-08-08)

A study plan = a named, ordered checklist of existing Sets + a per-user progress bar.
Reuses sets/cards/quiz; it's an ordering + progress tracker, not new content.

**Data model:** `StudyPlan`(id, userId, title, description?, groupId?(null → D2-ready), createdAt) ·
`StudyPlanStep`(id, planId, order, setId, title?) · `StudyPlanProgress`(userId, stepId, completedAt;
unique userId+stepId → per-user so D2 group plans need no migration).

**Endpoints:** CRUD `/plans`, `GET /plans/:id` (steps + my progress), step add/reorder/remove,
`POST /plans/steps/:id/complete` (+ undo).

**Frontend:** Plans list + Plan detail (steps w/ checkmarks + progress) + Create (title + ordered
sets). Entry point: **Library tab**.

**Locked D1 decisions:** (1) steps reference existing Sets, one set/step; (2) progress = separate
per-user table (D2-ready); (3) completion = manual "Mark done" v1 (auto later); (4) ordered/pace-free
(no calendar) v1; (5) nullable `groupId` added now; (6) entry point Library; (7) finishing a plan →
"Finished a Plan" achievement + bonus credits.

**Build order:** D1a backend (models + CRUD + progress) → D1b frontend (list/detail/create) →
D1c achievement hook.

---

## Phase D2 — Group study plans ✅ SHIPPED 2026-08-08 (scope, finalized 2026-08-08)

Group OWNER/ADMIN creates a plan attached to the group (`StudyPlan.groupId`); all members do the
same steps, each with own progress; group sees a per-member leaderboard. No new tables (reuses
`groupId` + per-user `StudyPlanProgress`).

**Locked decisions:** (1) **Set access** — group members get read/study access to any set referenced
by a group plan they belong to (targeted rule in set/cards fetch; no cloning); (2) manage = OWNER+ADMIN
create/edit/delete, members do steps; (3) per-member completion % leaderboard on group-plan detail
(folds in C3's group piece); (4) entry = GroupDetail "Study Plans" section; (5) all members can see
everyone's %.

**Backend:** createPlan accepts `groupId` (OWNER/ADMIN only); getPlan/completeStep allow owner OR
group member; set/cards fetch allows members of a group plan using that set; `GET /plans/:id/members-progress`;
list group plans. **Frontend:** GroupDetail Study Plans section + create (admins) + group plan detail
w/ leaderboard. Build: D2a backend → D2b frontend. **Unlocks church/group revenue (Phase E).**

---

## Phase F — Media in AI chat (scope, finalized 2026-08-08)

Attach a file from "My Media" into an AI chat; Claude reads it. Premium AI perk that
gives a concrete reason to subscribe. **F.1 = PDF first** (locked #1), **F.2 = images** later.

**Ground truth:** MediaFile is stored `public-read` on Hetzner S3 with a public `url` →
Claude ingests **by URL** (no server download/base64). `generateAnswer` seam already exists;
media **forces the Claude path** regardless of `AI_PROVIDER`. Model `claude-haiku-4-5` supports
PDF documents + vision. Costs locked #3: PDF 5, image 3. Routing locked #2: Claude native.

**Locked F decisions:**
1. Delivery = **URL source** (files are public-read; pass `url` to Claude, no base64).
2. **One PDF per message** for F.1 (multi-file later).
3. Cost = **media dominates → PDF chat = 5 flat** (even if cards are also returned).
4. Gating = **credit-metered only** now; subscription-gating deferred to Phase G.
5. **Don't persist mediaIds** on AIChat for v1 (no migration; history keeps the answer text).

**F.1a backend:** `AskQuestionDto.mediaIds?: string[]`; `askQuestion` loads user-owned PDF
MediaFiles, forces Claude, builds latest user turn as `[{document,url}, {text}]` blocks; charge 5;
clear error + no charge if Claude unfunded/unconfigured. **F.1b frontend:** 📎 attach → PDF picker
(reuse useMediaFiles) → chips above composer → send mediaIds → doc chip in bubble; shows real 5-credit charge.

**⚠️ Dependency:** media = paid Claude; the Anthropic account is currently out of funds, so a real
PDF chat only works once Claude is funded (by design — media is the paid perk). F.1 builds/wires fully regardless.

**Build order:** F.1a backend → F.1b frontend → fund Claude + test → F.2 images.

> **Status:** F scope locked 2026-08-08. **F.1a backend DONE & verified** (mediaIds on
> AskQuestionDto, media-forces-Claude in generateAnswer w/ URL document blocks, PDF cost 5,
> INVALID_MEDIA guard charges nothing, Claude errors throw before charge; @anthropic-ai/sdk 0.20→0.116).
> **F.1b frontend DONE** (📎 attach button + PDF picker via ActionSheet from My Media, attachment chip in
> composer + user bubble, sends mediaIds, optimistic 5-credit charge) — type-checks clean.
> **F.2 images DONE** (same path generalized: fetch media by id w/o type filter, PDF→document /
> IMAGE→image URL blocks; cost PDF 5 > image 3 > cards 2 > text 1; picker lists PDFs + images,
> icon by type; optimistic 5/3 charge) — both ends type-check clean.
> **Phase F fully built. Pending a funded Claude account to test real PDF/image answers** (media =
> paid perk, by design). Remaining roadmap: C3 leaderboards, G enforcement.

---

## Phase E — Subscriptions (scope, finalized 2026-08-08)

Turn the unused `Plan` enum (FREE/STARTER/PRO) into real IAP subscriptions mapped to benefits.
Consumer Premium first; church/group per-seat pricing still deferred (needs its own B2B flow).

**Tiers (locked #4):** STARTER $4.99/mo·$39.99/yr → 100 credits / 2 GB / 60 AI-req/hr ·
PRO $9.99/mo·$79.99/yr → 500 credits / 10 GB / 120 AI-req/hr. Same AI model all tiers.
Monthly + annual from launch (#6). Over-quota after downgrade → block new uploads, never delete (#7).

**Reuses:** `Plan` enum + `user.plan`, `user.creditBalance`, `user.storageLimit/storageUsed`,
`TransactionType.PURCHASE`, credit-grant pattern (`claimDailyLogin`). `aiRateLimit` becomes per-tier.

**Locked E decisions:**
1. **Entitlement sync = verify-on-open + restore** (client re-verifies its receipt each launch;
   server trusts verified receipt). S2S App Store/Play notifications **deferred to Phase G**.
2. **Annual credit grant = 12× monthly upfront**, single grant at purchase (no scheduler; rolls over).
3. Store: IAP only (`react-native-iap`), Apple + Google. Apple implemented first (device = iPhone);
   Google verifier is a guarded stub until Play credentials exist.

**Backend (E-a):** `src/config/plans.ts` single-source tier config (credits/storage/rate/prices/productIds);
`Subscription` table (userId 1:1, store, productId, expiresAt, originalTransactionId, lastTransactionId);
`POST /subscriptions/verify` (validate receipt → set plan+expiry+storageLimit, grant credits idempotent
by transaction id, annual 12×); `GET /subscriptions/status` (recheck expiry, lapse → FREE); per-tier
`aiRateLimit` (async `limit` reads caller's plan). Testable against Apple/Google **sandbox** without live store.

**Frontend (E-b):** install/config `react-native-iap`; Paywall screen (tiers, monthly/annual toggle,
prices, benefits); purchase → `/verify` → refresh user+credits; Restore purchases; verify-on-open at launch;
Profile shows current plan + Manage-subscription deep link.

**Prerequisite (E-store, user-owned, config not code):** create products in App Store Connect + Play Console,
sandbox testers, real device / TestFlight. Purchases stay inert until this exists; backend/paywall buildable now.

**Build order:** E-a backend (build now) → E-b paywall UI → E-store setup (parallel, user) → go live.

> **Status:** E scope locked 2026-08-08. **E-a backend DONE & verified** (config/plans, Subscription
> table + migration, verify/status endpoints, per-tier aiRateLimit). **E-b frontend BUILT** (react-native-iap
> v16, `utils/iap.ts` wrapper, `useSubscription` hooks, PaywallScreen, Profile upgrade entry, verify-on-open in
> AppNavigator) — type-checks clean; **pending device + App Store Connect products to test purchases.**
> Remaining: **E-store** (user creates store products + sandbox tester + device build).

---

## Locked decisions ✅

| # | Decision | Locked value |
|---|---|---|
| 1 | Media scope | **PDF-only first** (F.1); images later (F.2) |
| 2 | Media routing | **Claude native** (no PDF-text extraction for free model) |
| 3 | Credit costs | text 1 · card-batch 2 · image 3 · PDF 5 |
| 4 | Plan numbers | STARTER $4.99/mo·$39.99/yr / 100cr / 2GB / 60/hr · PRO $9.99/mo·$79.99/yr / 500cr / 10GB / 120/hr |
| 5 | Social gating | **Never** — friends/groups/gatherings free on all tiers |
| 6 | Billing cadence | **Monthly + annual** from launch (IAP only) |
| 7 | Downgrade over quota | **Block new uploads, never delete** |

Deferred (not one of the 7): **church/group plan pricing** — decide when Phase D2 lands.
All numbers are launch defaults; tune with real usage data.
