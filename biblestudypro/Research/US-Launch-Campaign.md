---
tags: [growth, marketing, launch]
---

# US Launch Campaign (Oct 2026)

> ✅ **STATUS 2026-10-13:** app LIVE on App Store + Google Play. Website switched from
> "Coming soon" to live store links. First market = **United States**.
> First milestone: **20 relevant users completing a first practice** (PostHog `quiz_completed`).

## Website changes (all deployed to getverdance.com)
- Live store badges: App Store `id6810234440`, Play `com.getverdance.app`. Waitlist form removed.
- Removed every **group / group plan / group leaderboard** claim (groups aren't built) → friends + friends leaderboard.
- Annual saves **~4 months** (~33%); paid CTAs "Get the app" + "Choose your plan inside the app".
- New FAQ "What can I do with AI credits?" (question 1 · cards 2 · image 3 · PDF 5).
- **"See how Verdance works"** 4-step walkthrough (`#how`) under the hero.
- **Campaign pass-through:** `getverdance.com/?c=<code>` tags store buttons (App Store `ct=`, Play UTM).
  Codes + where to read results: repo `marketing/campaign-links.md`.
  ⚠️ App Store **provider token (`pt`) still empty** → Apple won't split installs by campaign until set.

## Promo video pipeline (`marketing/video/`)
Real app on the iOS simulator, driven by Maestro, edited with ffmpeg into 1080×1920.
- `flows/` — Maestro scripts (login, take A AI flashcards, take B quiz, take C Home).
- `render/frame.html` — caption frames + end card in brand style (violet→indigo, Inter).
- `build.sh` — `RAW=<takes dir> ./build.sh` → `out/video1.mp4`.
- Uses the **reviewer account** (has due cards for the "it reminds you" ending).
- Video 1 draft (quiz + Home + end card, 16s) approved. **Opening take A pending** — needs 2 AI credits.

## 7-day plan
Day 1 phone check + analytics · Days 2–3 three short videos · Days 3–5 15 creators, message 5 ·
Days 4–7 adult Bible-learner communities (with moderator permission) · Day 7 review installs,
first practice, return visits.

Video ideas: (1) read a passage, then test yourself · (2) notes → flashcards · (3) a 5-minute review.

## Known issue found while recording
AI chat label always says **"Costs 5 credits"** — the `ai:composer.costsInfo` English text is missing;
real charge is 1 (question) / 2 (flashcards). Fix in next app update.

## See also
- [[Landing Page]] · [[Growth-and-Revenue]] · [[Credits & Subscriptions]] · [[Store Launch (App Store + Play)]]
