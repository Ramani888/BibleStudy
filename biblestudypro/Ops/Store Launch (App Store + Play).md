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
  agreement + W-8BEN + **banking** (finishing ~24h) → then RevenueCat iOS creds auto-clear.

## Known launch bug fixed this session
Android `react-native-config` returned undefined for all `Config.*` because applicationId
(`com.getverdance.app`) ≠ Kotlin namespace (`com.biblestudypro.app`) → fix = `build_config_package`
string in `strings.xml` (commit 8c18f89). iOS unaffected. Needs a native rebuild. See [[Identity & Accounts]].

## Related
repo `STORE_SETUP.md`, `IAP_SETUP.md`, `REVENUECAT_MIGRATION.md` · [[Credits & Subscriptions]]
· [[Module - Subscriptions]] · [[Push Notifications]]
