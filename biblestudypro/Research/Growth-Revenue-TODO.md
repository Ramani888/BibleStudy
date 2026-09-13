# Verdance — Growth & Revenue To-Do

> Actionable checklist derived from [[Growth-and-Revenue]] (deep research, 2026-09-12).
> **Scope: growth + revenue only** — launch blockers (IAP products, Claude funding, Hetzner,
> device testing) are tracked elsewhere, not here.
>
> **Priority:** P1 = do first / highest leverage · P2 = important · P3 = later/contingent
> **Effort:** 🟢 no code (copy/config/messaging) · 🟡 config or small change · 🔴 needs new work

---

## Before launch

- [ ] **Waitlist on getverdance.com** — email + country/city; invite in launch-day waves to concentrate installs. `P1` `🔴`
- [x] **"Tell a pastor" referral** — DONE 2026-09-13 (`72ebe4b`): Profile "Invite" sheet has a dedicated "Tell your pastor / group leader" ask with tailored copy. See [[Social]]. `P1` `🟢`
- [ ] **Recruit 3–5 small-group leaders** as pre-launch pilot users (activates group invite codes + friends graph so day-one isn't empty). `P1` `🟢`
- [ ] **Lock wedge messaging** — "Cancel anytime, no surprise charges" (vs Hallow) + "modern Bible flashcards" (vs Anki's dated/paid app). `P1` `🟢`
- [ ] **Localize store listing + screenshots** in **pt-BR and es** (Brazil = YouVersion's #2 country; you already ship the locales). `P1` `🔴`
- [ ] **Set regional price tiers** ~60–80% off US defaults for LatAm / SE Asia / E. Europe (App Store Connect + Play Console). Treat 60–80% as a starting point to A/B. `P2` `🟡`
- [x] **Offline audit** — DONE 2026-09-13 (`28b4c1d`): persisted RQ cache (sets/cards/folders) + NetInfo onlineManager + offline banner; reads degrade gracefully, writes still need connection. See [[Study Core]]. `P2` `🟡`

## At launch

- [x] **Coordinated share event** — DONE 2026-09-13 (`a9b7691`): Sunday 16:00 UTC cron push + Sunday-gated Home CTA card → share sheet w/ getverdance link. See [[Push Notifications]] · [[Home Dashboard]]. `P1` `🔴`
- [x] **WhatsApp deep-link sharing** — DONE 2026-09-13 (`7d8f006`+`72ebe4b`): per-set `getverdance.com/s` links backed by a public set endpoint + landing page, 1-tap wa.me WhatsApp share. (Group invites N/A — no in-app Groups feature; native universal-links to open the app deferred as low-ROI.) See [[Social]]. `P1` `🔴`
- [ ] **ASO long-tail keywords** — target "Bible study flashcards / Bible quiz / memorize scripture / Bible study group" (underserved vs read/pray/devotional). Fill localized keyword fields per store. Don't self-censor off head terms. `P1` `🔴`
- [ ] **Screenshots that show the system** — streak, Home "due" count, group leaderboard (not just a logo). `P2` `🔴`
- [ ] **Rating prompts after wins** — trigger on completed quiz / unlocked achievement / streak milestone. `P2` `🟡`

## After launch

- [ ] **Make annual the highlighted Paywall option** ($39.99/yr Starter) — cheap annual retains 53.7% Y1 vs 6.7% pricey monthly. `P1` `🟢`
- [ ] **In-context upgrade prompts** at credit-empty and over-quota moments (surface existing Phase G banners/CTAs). Freemium only converts if conversion is *earned*. `P1` `🟡`
- [ ] **Seed 10 Christian micro-creators** with a branded set to share; measure installs; double down on what converts. `P2` `🔴`
- [ ] **Church B2B pilot** — give 3–5 small-group leaders free group access, watch if seats fill + renew, *then* design per-seat pricing from real behavior (⚠️ no verified church-sales playbook exists — validate before building B2B billing). `P2` `🔴`
- [ ] **(Contingent) Long free trial** — ONLY if you ever add a trial to the locked plan: make it 17–32 days and surface it install-day (82% of trials start day one). Not in current plan. `P3` `🔴`

---

**Highest-leverage first 5 (do now, mostly zero code):** waitlist · "tell a pastor" referral ·
annual as default Paywall option · wedge messaging · rating prompts after wins.

See [[Growth-and-Revenue]] for evidence, sources, caveats, and the 6 refuted claims (don't act on those).
