# Store Setup — Verdance launch checklist

## ▶ RESUME (2026-09-09 EOD) — both stores blocked on payment/identity verification
**Apple:** app `Verdance: Bible Study & Memory` created (`com.getverdance.app`). Paid Apps agreement
accepted but **Pending User Info** — waiting on **banking (processing ~24h)**; the **US W-8BEN tax
form** can't be added until banking clears. Then: Paid Apps → Active → create the 4 products →
add App Store Connect API key to RevenueCat.
**Google:** app created (`com.getverdance.app`, Draft). Merchant payments profile created (Ramani
Divyesh, INR, India; 15% fee auto). **PA-CB KYC in progress via BillDesk** — business type
**Individual**, submit **PAN** (name must EXACTLY match). After Google review (~few days): merchant
active → create 4 subscriptions → Setup→API access → service-account JSON to RevenueCat.
**RevenueCat:** iOS + Android apps created (`com.getverdance.app`); still need products/entitlements/
offering, SDK keys, webhook secret (all gated on store products existing).
**Tomorrow first check:** is Apple banking done? did BillDesk KYC email get completed? Then proceed.



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
