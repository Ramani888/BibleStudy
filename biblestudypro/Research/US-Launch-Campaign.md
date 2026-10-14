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
- ✅ **Video 1** (`out/video1.mp4`, 28s): passage → AI flashcards → quiz → 80% → "cards to review".
- ✅ **Video 3** (`out/video3.mp4`, 23s): real 20-card daily review in 4m54s, 100%.
- ⏸️ Video 2 (notes → flashcards) paused until v1/v3 results are in.
- Captions: `marketing/video/captions-video1.md`, `captions-video3.md`. Creators: `marketing/creator-outreach.md` (15 + 5 drafts, unsent).
- Build: `cd marketing/video && RAW=raw [SEG_FILE=videoN.segments NAME=videoN] ./build.sh`.

## 7-day plan
Day 1 phone check + analytics · Days 2–3 three short videos · Days 3–5 15 creators, message 5 ·
Days 4–7 adult Bible-learner communities (with moderator permission) · Day 7 review installs,
first practice, return visits.

Video ideas: (1) read a passage, then test yourself · (2) notes → flashcards · (3) a 5-minute review.

## Known issue found while recording
AI chat label always said **"Costs 5 credits"** — cause: `AIChatScreen` passes `attachmentType ?? 'PDF'` with nothing
attached. **Fixed 2026-10-14 (`3b5505b`)** in `ChatInput` (media price only when an attachment is present). Ships with the
next app release; not yet seen in-app (test account had 0 credits).

## Next (2026-10-15)
Post video 1 (Instagram + YouTube first) → send 5 creator messages → post video 3 two or three days later → Day-7 review.

## See also
- [[Landing Page]] · [[Growth-and-Revenue]] · [[Credits & Subscriptions]] · [[Store Launch (App Store + Play)]]
