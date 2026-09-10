---
tags: [ops, launch, store, appstore, playstore]
updated: 2026-09-10
---

# Store Launch — App Store + Play Console

> Live status of the two store submissions. Repo source of truth: `STORE_SETUP.md`
> (§A/A1 Apple, §B Play). This note is the curated summary. See [[Identity & Accounts]],
> [[Brand & Assets]], [[Credits & Subscriptions]].

App: **Verdance** · title **Verdance: Bible Study & Memory** · bundle `com.getverdance.app`
· Apple ID `6810234440` · website getverdance.com · API `https://api.getverdance.com`.

> **Branch state (2026-09-10):** `feat/revenuecat` **merged → master** (`f54c164`, no-ff, both ends
> type-check clean). Master is now the current source of truth (identity migration + RevenueCat
> scaffolding + all launch prep). **Next work stream = landing page** — branch fresh off master
> (`feat/landing-page`); static site in `legal/`, served from getverdance.com via Caddy. RevenueCat
> wiring is still dormant/untested and gated on Apple banking (below).

## Reviewer demo account (both stores)
`reviewer@getverdance.com` / `Verdance2026Review` — registered on **prod** API, `emailVerified`
flipped true in prod Postgres (login is gated on it). FREE plan / 3 credits. Seeded with 4 sets,
29 cards, study plan, 8-day streak, quiz attempts, achievements (for populated screenshots + reviewers).
Bump to PRO in DB if reviewers must see premium UI.

## Screenshots
Captured from **emulators/simulators** logged in as the reviewer account, then framed by a Pillow
script (Verdance violet→indigo gradient + caption). All in repo `branding/store-screenshots/`:
- `raw/` + `framed/` — Android (Play), 1290×2796, via `frame-shots.py` (adb-driven capture).
- `raw-ios/` + `framed-ios/` — iOS (App Store), **1284×2778**, via `frame-shots-ios.py` (iPhone 16
  Pro Max sim, `simctl status_bar` 9:41 override + `simctl io screenshot`).
- ⚠️ **Apple 6.5" upload slot rejects 1290×2796** — must be 1242×2688 or **1284×2778**. Android shots
  can't be reused for iOS (Android status bar → Apple 2.3.3 risk).

## Google Play — App content ✅ + Store listing ✅ (2026-09-10)
Privacy policy + delete-account URLs, sign-in details, Ads=No, content rating **Everyone**
(AI-content=Yes, all categories No), target audience **13+** (avoids Families/COPPA), data safety
(**Collected, NOT Shared**; encrypted-in-transit), advertising-ID=**No** (no ad SDK), category
**Education**. Screenshots uploaded. **Long pole = 12-tester / 14-day CLOSED TEST** (new Personal-account
rule) before Production. BillDesk PA-CB KYC submitted (App ID 2609094782), awaiting review.

## Apple App Store — listing ✅ (2026-09-10), submission gated on banking
- **App Privacy**: 10 data types, each Linked=Yes / Tracking=No / Purpose=App Functionality
  (Name, Email, User ID, Device ID, Photos, Other User Content, Purchases, Product Interaction,
  Crash, Performance). Payment/Financial NOT collected (Apple+RevenueCat handle it).
- **App Info**: subtitle `AI Flashcards & Bible Quizzes`; category Education/Reference; Content
  Rights = No third-party content.
- **Age Rating = 4+** (all features No incl. UGC/Messaging/Ads; all content None; NOT "Made for Kids").
- **Pricing**: Free, all 175 regions. **App Review Info**: demo account + notes.
- Listing text (promo/description/keywords) pasted on the 1.0 version page.
- **Native**: iPhone-only (`TARGETED_DEVICE_FAMILY=1`) so no iPad screenshots required;
  `ITSAppUsesNonExemptEncryption=false` in Info.plist (export-compliance exempt).
- **STILL TODO**: attach a build (Xcode/TestFlight); **4 IAP products + Submit** gated on Paid Apps
  agreement + W-8BEN + **banking** → then RevenueCat iOS creds auto-clear.
- **Banking (in progress 2026-09-10):** Free Apps Agreement = Active; Paid Apps = Pending User Info;
  **W-8BEN** being submitted (foreign/India, no US tax residency, no US business activities,
  Individual/Sole-proprietor, title "Owner" — irreversible once submitted, no PAN/treaty fields);
  ICICI bank = Processing; DSA compliance = In Review. When banking flips Active → create 4 products.

## Order of remaining subscription wiring (once banking clears)
`.env` is baked at build time (`react-native-config`), so **wire first, build once**:
1. Apple: subscription group + 4 products → app-specific shared secret + ASC API key (.p8).
2. Play: create 4 products → service-account JSON (Google verify is a stub until then).
3. RevenueCat: import via Apple key + Play JSON → entitlements `starter`/`pro` → offering `default`
   → **SDK keys (iOS+Android, currently EMPTY in `frontend/.env`)** + webhook secret.
4. Wire `frontend/.env` (RC keys) + backend `.env` (`RC_WEBHOOK_AUTH`, `APPLE_IAP_SHARED_SECRET`,
   identity vars) + `prisma migrate deploy` on prod.
5. **Then** build + upload TestFlight → sandbox purchase → verify webhook grants credits.
Product IDs (unchanged): `com.biblestudypro.{starter,pro}.{monthly,annual}` — $4.99/$39.99/$9.99/$79.99.

## Known launch bug fixed this session
Android `react-native-config` returned undefined for all `Config.*` because applicationId
(`com.getverdance.app`) ≠ Kotlin namespace (`com.biblestudypro.app`) → fix = `build_config_package`
string in `strings.xml` (commit 8c18f89). iOS unaffected. Needs a native rebuild. See [[Identity & Accounts]].

## Related
repo `STORE_SETUP.md`, `IAP_SETUP.md`, `REVENUECAT_MIGRATION.md` · [[Credits & Subscriptions]]
· [[Module - Subscriptions]] · [[Push Notifications]]
