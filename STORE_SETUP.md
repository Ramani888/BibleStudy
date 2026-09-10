# Store Setup — Verdance launch checklist

## ▶ RESUME (2026-09-10) — Play "App content" DONE; website live; both stores still gated on verification
**Website (getverdance.com):** LIVE on the Hetzner box via Caddy (static files in `/var/www/getverdance/`,
Cloudflare `@`+`www` A-records → 94.130.176.8 grey-cloud). Pages: `/privacy.html` (updated w/ Google Play
Billing + Firebase + children + legal-entity fixes), `/terms.html`, `/delete-account.html`, `/` landing.
Use `https://getverdance.com/privacy.html` + `/delete-account.html` in BOTH stores.
**Reviewer test account (prod):** `reviewer@getverdance.com` / `Verdance2026Review` — created via prod API,
`emailVerified` flipped true in DB, login verified. Used for Play "Sign in details". (FREE plan; bump to
PRO in DB if reviewers must see premium UI.)
**Google Play — App content ✅ ALL DONE:** privacy policy, sign-in details, ads=No, content rating
(Everyone; AI-content=Yes but all content categories No; educational=Yes; digital-goods=Yes/no-lootbox),
target audience=13+ (avoids Families policy), data safety (Collected-not-Shared, encrypted-in-transit=Yes,
delete URL set; types: Name/Email/UserIDs/PurchaseHistory/Photos/Files/UGC/AppInteractions/CrashLogs/
Diagnostics/DeviceIDs), government=No, financial=none, **advertising ID=No** (verified: no ad/analytics SDK,
no AD_ID permission — only FCM/Google-SignIn/RevenueCat), health=none. Store settings: category=**Education**,
tags=Education/Study guide/Test preparation, contact email+website set.
**Google Play — still TODO:** store-listing graphics (feature graphic 1024×500 + ≥2 phone screenshots 1080×1920
via AppDrift; icon 512×512 ready), upload a build (internal testing), then **12-tester / 14-day CLOSED TEST**
(new-personal-account rule — the real long pole) before Production. BillDesk PA-CB KYC fully submitted
(App ID **2609094782**) — awaiting review.
**Apple:** app `Verdance: Bible Study & Memory` (`com.getverdance.app`). DSA trader declaration + ID upload
DONE. **Address-change request submitted** (Membership Info Update → Address → Rajkot/Lilapur 360050, to match
Google/PAN). **W-8BEN tax form still BANKING-LOCKED** (US checkbox greyed until banking finishes ~24h). Then:
Paid Apps → Active → 4 products → ASC API key to RevenueCat.
**RevenueCat:** iOS + Android apps created; products/entitlements/offering, SDK keys, webhook secret still
gated on store products existing.
**Next first checks:** Apple banking done? → add W-8BEN. Google KYC approved? → make 4 subs. Also: build
screenshots + recruit 12 Android testers to start the 14-day closed-test clock.

**Store-listing copy (paste-ready):** name=`Verdance: Bible Study & Memory` (30/30) · short=`AI Bible study
with flashcards, spaced-repetition review, and quizzes.` (70) · full description drafted (in chat / brain).



Everything needed in App Store Connect + Play Console + RevenueCat to ship.
Identity is already migrated (bundle/applicationId = `com.getverdance.app`, Firebase
`verdance-bb5c2`). This file tracks the store/console work that remains.

## Reference data
| Thing | Value |
|---|---|
| iOS bundle / Android package | `com.getverdance.app` |
| Apple Team ID | `CG433GC6BU` |
| App name | Verdance |
| API base | `https://api.getverdance.com/api/v1` |
| RC webhook URL | `https://api.getverdance.com/api/v1/subscriptions/rc-webhook` |

**Subscription products (exact IDs + prices):**
| Product ID | Tier | Duration | Price |
|---|---|---|---|
| `com.biblestudypro.starter.monthly` | Starter | 1 month | $4.99 |
| `com.biblestudypro.starter.annual` | Starter | 1 year | $39.99 |
| `com.biblestudypro.pro.monthly` | Pro | 1 month | $9.99 |
| `com.biblestudypro.pro.annual` | Pro | 1 year | $79.99 |
> Product IDs keep the `com.biblestudypro.*` prefix (independent of bundle id — don't change).

---

## A. Apple — App Store Connect
- [ ] **Paid Applications Agreement** signed + Tax + Banking (App Store Connect → Business). ← gates *selling* only (not listing metadata)
- [ ] **Create app**: Apps → ＋ → iOS, name `Verdance`, bundle `com.getverdance.app`, SKU `verdance-ios-001`, primary language English (U.S.).
- [ ] **Subscription group** `Verdance Membership` + the **4 products** above (price + localization + review info each).
- [ ] App Privacy (nutrition label), age rating, category — can do alongside listing.
- [ ] RevenueCat iOS "Credentials need attention" clears automatically once the above exist → click refresh.

### A1. App Store listing copy (paste-ready, 2026-09-10) — fillable NOW, no banking needed
App is **iPhone-only** (`TARGETED_DEVICE_FAMILY = 1`) → only 6.7" iPhone screenshots required (no iPad set).
Encryption prompt suppressed via `ITSAppUsesNonExemptEncryption=false` in `Info.plist` (standard HTTPS = exempt).

| Field | Value |
|---|---|
| App Name (30/30) | `Verdance: Bible Study & Memory` |
| Subtitle (29/30) | `AI Flashcards & Bible Quizzes` |
| Keywords (97/100, no spaces) | `scripture,verse,memorization,christian,devotional,gospel,faith,catechism,spaced,repetition,prayer` |
| Support URL | `https://getverdance.com` |
| Marketing URL | `https://getverdance.com` |
| Copyright | `2026 Divyesh Ramani` |
| Category | Primary **Education**, Secondary **Reference** |
| Screenshots (6.7", 1290×2796) | `branding/store-screenshots/framed/*.png` (7 shots — the complete required set) |

**Promotional Text** (~162/170, editable without review):
`Turn Bible study into a daily habit. AI-made flashcards, spaced-repetition review, quizzes, and study plans — track streaks and grow with friends. Start free today.`

**Description** (< 4000):
```
Verdance turns Bible study into a habit that sticks.

Create flashcards in seconds with AI, review them with proven spaced-repetition, and test yourself with quizzes — all in one focused, distraction-free app.

WHY VERDANCE
• AI flashcards — paste a passage or topic and get clean question-and-answer cards instantly.
• Spaced repetition — a smart schedule (SM-2) resurfaces each card right before you forget it, so memory work actually lasts.
• Quizzes — seven quiz modes turn any set into a fast, fun self-test.
• Study plans — follow guided plans like "30 Days in the Gospels," or build your own.
• Streaks & achievements — daily goals, streaks, and unlockable milestones keep you coming back.
• Study with friends — compare streaks on the leaderboard and stay accountable together.
• Notes & media — keep your reflections and reference images alongside your cards.

BUILT FOR EVERY LEARNER
Whether you're memorizing verses, prepping for a class, catching up on catechism, or just building a steadier devotional rhythm — Verdance meets you where you are.

FREE TO START
Study for free. Upgrade any time for more AI generations and higher limits.

Start your first set today and make Scripture stick.
```

**Other sections:** App Privacy = mirror Play data-safety (Linked-to-user: Name, Email, User ID, Purchase history, Photos, User content, Device ID, Usage, Diagnostics; **not** used for tracking). Age Rating = answer content categories None (→4+); AI/UGC question = Yes (friends feed + AI chat + notes; may nudge to 9+/12+). App Review Info = demo `reviewer@getverdance.com` / `Verdance2026Review` + note "AI needs no login; sign in for study data; subs are sandbox-only in review" + contact. Export Compliance = exempt (handled by Info.plist key above).

## B. Google — Play Console
- [ ] Confirm Play Console is on the **work Google account**.
- [ ] **Create app** `Verdance`, package `com.getverdance.app`.
- [ ] Enroll in **Play App Signing** → copy the **App Signing SHA-1** → add it in Firebase (Android app) so Google Sign-In works for Play installs.
- [ ] **Subscriptions**: create the 4 products (same IDs), each with a base plan + price.
- [ ] **Setup → API access** → create/link a **service account** → grant purchase/subscription permissions → download **service-account JSON**.

## C. RevenueCat (mostly done — finish credentials)
- [x] Project `Verdance` created; iOS app (`com.getverdance.app`) + Android app (`com.getverdance.app`) added.
- [x] iOS In-App Purchase key uploaded.
- [ ] Confirm email (dashboard banner).
- [ ] iOS **App Store Connect API key** (`AuthKey_….p8` + Key ID + Issuer ID) → for product import.
- [ ] Android: upload the **Play service-account JSON** (from B).
- [ ] **Entitlements** `starter` + `pro` → attach products (starter→starter, pro→pro).
- [ ] **Offering** `default` (set Current) with 4 packages, one per product.
- [ ] **API keys** → give me the iOS + Android **public SDK keys** → `frontend/.env` (`REVENUECAT_IOS_API_KEY` / `REVENUECAT_ANDROID_API_KEY`).
- [ ] **Integrations → Webhooks** → URL above + an **Authorization secret** → give me for backend `RC_WEBHOOK_AUTH`.

## D. Backend / server (mine — batched, once C keys exist)
- [ ] Prod server `.env`: update `GOOGLE_CLIENT_ID`, `APPLE_BUNDLE_ID`, `FIREBASE_*` (identity migration) + add `RC_WEBHOOK_AUTH` + `APPLE_IAP_SHARED_SECRET` → `pm2 restart`.
- [ ] `prisma migrate deploy` on prod Hetzner DB (RevenueCat webhook migration).

## E. Verify (after D)
- [ ] Rebuild app (new bundle + Firebase) → Google Sign-In + push work on device (both platforms).
- [ ] Sandbox purchase → RC webhook hits backend → credits granted, plan set.
- [ ] Merge `feat/revenuecat` → master.

---
**Hand me when ready:** RC SDK keys (iOS+Android), RC webhook secret, Apple app-specific shared secret, Play service-account JSON. I'll wire them + flip prod in one pass.
