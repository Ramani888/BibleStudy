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
- [ ] **Paid Applications Agreement** signed + Tax + Banking (App Store Connect → Business). ← gates everything
- [ ] **Create app**: Apps → ＋ → iOS, name `Verdance`, bundle `com.getverdance.app`, SKU `verdance-ios-001`, primary language English (U.S.).
- [ ] **Subscription group** `Verdance Membership` + the **4 products** above (price + localization + review info each).
- [ ] App Privacy (nutrition label), age rating, category — can do alongside listing.
- [ ] RevenueCat iOS "Credentials need attention" clears automatically once the above exist → click refresh.

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
