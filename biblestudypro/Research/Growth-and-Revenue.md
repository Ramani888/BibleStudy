# Verdance — Growth & Revenue Research (no-budget, pre-launch, worldwide)

> Deep-research report, 2026-09-12. Fan-out web search → source fetch → 3-vote adversarial
> fact-check → cited synthesis. 25 sources, 116 claims extracted, **19 confirmed / 6 refuted**.
> Every recommendation is tagged **(a) fits current build** or **(b) needs new work**.
> Read the [[#Caveats — read before acting]] and [[#What got REFUTED]] sections — some
> "obvious" tactics did not survive fact-checking.

## TL;DR — the three levers that actually move a faith app with $0

1. **Organic word-of-mouth + church/creator seeding.** This is *the* category playbook.
   YouVersion grew to 64M+ installs in Brazil alone with **no paid ads** — word of mouth,
   Sunday download spikes, 200k shares/24h, and a coordinated share event that drove
   **1M installs in 11 days**. Verdance already ships the viral loops (friend invites,
   shared sets, group invite codes, leaderboards, streaks) — they just need to be
   deliberately *triggered*.
2. **Emerging-market localization, Brazil/LatAm first.** Cheapest place on earth to grow a
   Christian app. WhatsApp is the distribution rail (90%+ penetration). Verdance already
   ships pt/es — the work is outreach + share-links, not translation.
3. **Monetization tuned to benchmarks.** The locked earn-only freemium converts far fewer
   downloads than a paywall (2.18% vs 12.11% at Day-35) — that's the *price you pay* for a
   big free social base. Offset it by hammering the **annual plan** (cheap annual retains
   53.7% Year-1 vs 6.7% for pricey monthly) and clear in-context upgrade prompts.

---

## DO BEFORE LAUNCH

### 1. Stand up an email waitlist + "tell a pastor" referral  — (a) fits build
The clearest pre-launch signal came from **Faithly**, a live pre-launch competitor. Their
own site does two things: a **city-by-city staggered waitlist** ("we'll send your invite
the day we launch in your city") and a referral ask that beats everything else —
> "Tell a pastor about Faithly. That is worth more than money at this stage."

- **Do:** a one-page waitlist on getverdance.com (you already own the domain + landing page).
  Collect email + country/city. Invite in waves at launch to concentrate installs into
  ranking-boosting spikes.
- **Edge case:** a waitlist with no follow-through dies. Wire the invite to your existing
  **group invite code + friends graph** so day-one users land in an already-social app,
  not an empty one.
- Source: faithly.church (primary, competitor marketing copy — stated strategy, not proven).

### 2. Pick your wedge and say it out loud: trust + modern UX  — (a) fits build
Two competitor weaknesses are real and verified:
- **Hallow** has a recurring complaint pattern — **56 BBB complaints in 3 years**:
  unauthorized charges, free trials auto-converting "even though I did not consent",
  and "no option on the website or app to cancel." This is on their **direct web billing**.
  Verdance bills **only via Apple/Google IAP**, so cancellation is inherently
  self-service — you avoid the trap *by design*. Lean into it: "Cancel anytime, right
  from your phone. No surprise charges."
- **Anki** (the free go-to for Bible memorization via spaced repetition) has a "feels
  ancient" UI, steep learning curve, and a **$24.99 clunky iOS app**. Verdance's modern
  RN flashcard + SM-2 experience is a direct upgrade for the exact people already
  hand-rolling Bible decks in Anki.
- Sources: BBB Hallow complaints (primary), flashrecall.app/blog/anki-bible (corroborated).

### 3. Localize store listings for Brazil/LatAm + set regional prices  — (b) needs work
Brazil is YouVersion's **#2 country worldwide**; >1M Brazilians open a Bible app daily.
LatAm growth came from **free content + offline downloads + localization**, lifting
low-connectivity markets hard (Nicaragua +107%, Venezuela +74%).
- **Do:** localized App Store / Play metadata + screenshots in pt-BR and es first (ASO
  localization measurably lifts installs). You already ship these locales in-app.
- **Do:** regional price tiers — RevenueCat guidance is a **60–80% discount off US
  defaults** for price-sensitive markets. Configure in App Store Connect / Play Console.
- **Edge case / confidence:** the exact 60–80% figure rests partly on a single
  practitioner anecdote (**medium confidence**). Treat as a starting point to A/B, not gospel.
- Sources: youversion.com Brazil hub (primary), christiandaily.com, RevenueCat global-pricing.

### 4. Verify the app works offline, especially decks  — (b) needs work (audit)
Offline access is repeatedly cited as *why* the Bible category wins in low-connectivity
emerging markets. Before chasing LatAm installs, confirm flashcards/sets are usable
offline (or degrade gracefully). This is an audit item, not necessarily new code.

---

## DO AT LAUNCH

### 5. Run a coordinated "share event" — don't just hope for word of mouth  — (b) needs work
YouVersion's 1M-in-11-days spike was a *scheduled campaign* ("Global Share the Bible
Day"), not passive virality. You already have the loops; add a **reason to fire them on
one day**: e.g. "Share your first set / your streak with your group" push + in-app prompt,
timed to a Sunday (download spikes are real on Sundays).
- **Do:** a launch-week push (FCM is live) + an in-app share CTA that generates a
  **WhatsApp-native deep link** (see #6).
- Source: youversion.com 2010 review (primary), growthcasestudies.com, Nir Eyal (corroborated).

### 6. Make WhatsApp your primary share surface (not in-app-only invites)  — (b) needs work
WhatsApp is *the* free rail for the Brazil/LatAm/Africa Christian audience — **90%+
penetration** (Brazil ~148M MAU, Kenya 97%, Nigeria 95%, Mexico 93%). Your share-set and
group-invite features should emit WhatsApp share intents / deep links, not just copy-a-code.
- **Edge case (verified):** WhatsApp **Channels do NOT push-notify followers** — don't
  build the loop around Channels. Use **direct share/invite links**.
- Source: gijn.org Global South WhatsApp study (channel opportunity is inferred, not
  install-attributed — treat as directional).

### 7. ASO: go for winnable long-tail terms, and don't assume head terms are locked  — (b) needs work
The claim that "bible" is *impossible* to rank (competitiveness 100) **was refuted** by the
fact-checkers — so don't self-censor off head terms entirely. But the safe play for a new
app is still long-tail:
- Title/subtitle around **outcomes + format**: "Bible study flashcards", "Bible quiz",
  "memorize scripture", "Bible study group" — your quiz/flashcard/group angle is
  *underserved* vs. the crowded "read/pray/devotional" space.
- Localized keywords per store (pt/es carry their own keyword fields — free ranking surface).
- Screenshots that show the *system* (streak, due count, group leaderboard), not a logo.
- Prompt for ratings **after a win** (completed quiz, unlocked achievement, hit a streak
  milestone) — you already have those moments.
- Sources: appfigures bible teardown (head-term "impossible" claim **refuted 1-2**),
  applaunchflow ASO best-practices, appfollow localization.

---

## DO AFTER LAUNCH

### 8. Push the annual plan hard; earn conversion in-context  — (a) fits build
RevenueCat 2025 (75k+ apps, $10B+):
- **Freemium converts 2.18% vs 12.11% for a hard paywall** at Day-35 (~5.5x gap). This is
  the *known cost* of your earn-only model — accepted, because it maximizes the free social
  base your network effects need. But you must **earn** conversion with clear, in-context
  upgrade prompts (you already have Phase G banners/CTAs — surface them at the credit-empty
  and over-quota moments).
- **Cheap annual retains 53.7% Year-1 vs 6.7% for pricey monthly.** Your $39.99/yr Starter
  nudge over $4.99/mo is **well-validated** — make annual the default/highlighted option on
  the Paywall.
- Source: revenuecat.com/state-of-subscription-apps-2025 (primary).

### 9. IF you ever add a free trial (not in current plan), make it LONG  — (b) needs work, contingent
Your locked plan has **no trial**. If that ever changes:
- **17–32 day trials convert best (45.7%)**, ~70% better than 3-day trials.
- **82% of trial starts happen install-day** → surface the offer on day one, not weeks in.
- Source: RevenueCat 2025 + 2026. Contingent only — don't build unless you decide to add trials.

### 10. Seed Christian creators + communities, then measure which convert  — (b) needs work
The research confirmed the *channel classes* (Christian TikTok/Reels/Shorts, Reddit,
Facebook groups, Discord, church partnerships) but **could not name vetted creators that
convert to installs** — that's an open question you resolve empirically. LatAm precedent:
YouVersion partnered with creators/ministries (Banda Más Vida, The Chosen, The Bible
Project, Alpha) via a regional hub — a seeding model a solo dev can imitate at small scale
(DM 10 micro-creators, give them a branded set to share).

### 11. B2B church / small-group per-seat — the "real money," but unproven template  — (b) needs work
Your internal note calls church per-seat (~$2/seat/mo) "the real money," and it fits: one
church = 30–200 seats at once, and your **group study plans + per-member leaderboard are
already built**. BUT — the research **could not verify a concrete solo-dev playbook** for
selling to churches (the "Hallow grew via parish outreach" claim was **refuted 0-3**). So:
- **Do:** run it as a **pilot** — give 3–5 small-group leaders free group access, watch
  whether seats fill and renew, *then* design pricing from real behavior.
- Don't build a B2B billing system on an unproven motion. Validate with free pilots first.

---

## Top 10 highest-leverage actions (solo dev, $0)

1. **Waitlist on getverdance.com now**, staggered by country, invite in launch-day waves. *(a)*
2. **"Tell a pastor" referral** as the #1 pre-launch ask — pilot with real small-group leaders. *(a)*
3. **Localize store listing + screenshots in pt-BR and es**, Brazil first. *(b)*
4. **Set regional price tiers** (~60–80% off US) for LatAm/SE Asia/E-Europe. *(b)*
5. **WhatsApp deep-link sharing** for sets + group invites (not copy-a-code). *(b)*
6. **Launch-day coordinated share event** ("share your set/streak"), timed to a Sunday. *(b)*
7. **Make annual the highlighted Paywall option** ($39.99/yr) — validated retention win. *(a)*
8. **Wedge messaging:** "Cancel anytime, no surprise charges" (vs Hallow) + "modern Bible
   flashcards" (vs Anki). *(a)*
9. **Rating prompts after wins** (quiz/streak/achievement) to fuel ASO. *(a)*
10. **Seed 10 Christian micro-creators** with a branded set; measure installs; double down
    on what converts. *(b)*

Note the split: **5 fit the current build** (do immediately, zero code), **5 need small
work** (mostly config + share-links, not features). No new *features* required to start.

---

## What got REFUTED (do NOT act on these)

The fact-checkers killed 6 claims — recorded so they don't creep back in:
- ❌ "Hard paywalls convert 5x better, so drop freemium" — refuted 0-3 (the *directional*
  gap is real per the 2025 report, but the aggressive framing didn't survive; keep freemium).
- ❌ "'bible' keyword is impossible to rank (score 100)" — refuted 1-2 (don't self-censor off head terms).
- ❌ "Hallow prices $9.99/mo·$69.99/yr + family + student tiers" — refuted 1-2 (unverified; don't benchmark to it).
- ❌ "Hallow grew via parish/diocese/Catholic-school outreach" — refuted 0-3 (**no verified B2B template** — validate your own).
- ❌ "Local pricing doubled LatAm subs in 14 days / 38% SE-Asia lift" — refuted 0-3 (marketing anecdotes, not data).
- ❌ "Competing AI Bible-flashcard apps match Verdance's full feature set" — refuted 1-2 (your combo is *not* obviously replicated).

## Caveats — read before acting
- **No faith-category benchmarks exist.** All RevenueCat conversion/retention figures are
  *all-app* medians — applying them to Verdance is a **directional extrapolation**, not proof.
- **First-party numbers.** YouVersion install/engagement stats are unaudited press releases
  (cumulative-since-2008 ≠ current MAU). Faithly's tactics are its own marketing copy.
- **WhatsApp opportunity is inferred** from news-distribution studies, not app-install
  attribution. Channels also lack push — use direct links.
- **The 60–80% discount** rests partly on one practitioner anecdote (medium confidence — A/B it).
- **Cite the year** on any RevenueCat number (2025 vs 2026 reports differ).

## Open questions (worth a follow-up research pass)
1. Real **faith-category** Day-35 conversion + annual/monthly retention (aggregates hide it).
2. A **verified solo-dev church B2B playbook** (outreach scripts, seat pricing, self-serve
   vs sales) — the Hallow template was refuted, so this is genuinely unresolved.
3. Which **specific long-tail ASO terms** are winnable for a *new* Bible study/quiz app.
4. **Named** Christian creators/communities that actually convert to installs for a study/
   flashcard product, and the content format that seeds them.

## Sources (verified)
YouVersion: growthcasestudies.com/p/youversion · blog.youversion.com · youversion.com Brazil
hub · christiandaily.com LatAm. Competitors: BBB Hallow complaints · flashrecall.app/anki-bible.
Pre-launch: faithly.church. Monetization: revenuecat.com/state-of-subscription-apps-2025 +
2026 benchmarks + global-pricing. Global: gijn.org WhatsApp Global South · appfollow ASO
localization. ASO: appfigures bible teardown · applaunchflow.
