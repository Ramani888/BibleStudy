# RevenueCat End-to-End Setup — Verdance

Single source of truth for wiring subscriptions across **RevenueCat + App Store + Play Store + backend**.
The app code and backend webhook are already built (#20). This is **config, not code**. Do it in order.

## Fixed facts (do not change)
- RC project: **Verdance** — both apps already created, bundle `com.getverdance.app`
- RC apps: **Verdance (iOS)** `appb38d4bbf4e` · **Verdance (Play Store)** `app29304c8191`
- Backend webhook URL: `https://api.getverdance.com/api/v1/subscriptions/rc-webhook`
- Product IDs (must match EVERYWHERE — code, both stores, RC):
  | Product ID | Tier | Period | Price |
  |---|---|---|---|
  | `com.biblestudypro.starter.monthly` | STARTER | monthly | $4.99 |
  | `com.biblestudypro.starter.annual`  | STARTER | annual  | $39.99 |
  | `com.biblestudypro.pro.monthly`     | PRO     | monthly | $9.99 |
  | `com.biblestudypro.pro.annual`      | PRO     | annual  | $79.99 |

> Product IDs use the `com.biblestudypro.*` prefix even though the bundle is `com.getverdance.app`. That's fine — product IDs are arbitrary strings. Do NOT "fix" them.

---

## PHASE 1 — Android service account (the current blocker) 🔴
RevenueCat cannot validate any Play purchase without this. All in the **Google Cloud project linked to your Play account**.

### 1a. Enable APIs (Google Cloud Console)
1. Go to https://console.cloud.google.com — top project picker → select the project tied to Play (or create one).
2. Enable **Google Play Android Developer API**: https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com → **Enable**.
3. Enable **Google Play Developer Reporting API**: https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com → **Enable**.

### 1b. Create the service account
1. Go to **IAM & Admin → Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts (confirm same project in top picker).
2. **Create Service Account** → name it e.g. `revenuecat` → **Create and continue**.
3. On "Grant access", add **two roles**:
   - **Pub/Sub Editor** (enables Google Real-Time Developer Notifications)
   - **Monitoring Viewer**
4. Skip the optional step → **Done**.

### 1c. Download the JSON key
1. Click the new service account → **Keys** tab → **Add key → Create new key → JSON → Create**.
2. A `.json` file downloads. Keep it safe — this is what you upload to RevenueCat.

### 1d. Grant it access in Play Console
1. Go to **Play Console → Users and permissions → Invite new users**:
   https://play.google.com/console/u/0/developers/users-and-permissions/invite
2. Email = the **`client_email`** value inside the JSON file (looks like `revenuecat@<project>.iam.gserviceaccount.com`). NOT your own email.
3. Add your app (Verdance) + grant these **account permissions** (grant all RC lists on that screen):
   - View app information and download bulk reports (read-only)
   - View financial data, orders, and cancellation survey responses
   - Manage orders and subscriptions
4. **Invite user / Apply.**

### 1e. Upload to RevenueCat
1. RC → **Apps → Verdance (Play Store)** → **Service Account Credentials JSON** → upload the `.json` → **Save**.
2. The ⚠️ under "Google developer notifications" should clear (RTDN connects automatically via the Pub/Sub role).

> ⏱️ Google permissions can take minutes to ~24–36h to propagate. If RC shows "invalid credentials" right after, wait and re-save.

---

## PHASE 2 — Create products in App Store Connect (iOS)
Requires **Paid Apps Agreement = Active** (was Processing 09-15; verify it's Active under Business).

1. App Store Connect → your app → **Monetization → Subscriptions**.
2. Create **one Subscription Group** (e.g. "Verdance Premium") — all 4 go in it so users can up/down-grade.
3. Add **4 auto-renewable subscriptions**, Product IDs EXACTLY as the table above.
4. For each: set **price**, **localized display name + description**, and a **review screenshot** (required or Apple rejects).
5. Status should reach "Ready to Submit" (they submit with the first app build).

---

## PHASE 3 — Create products in Play Console (Android)
Requires your app to have an uploaded build first (the closed-test AAB).

⚠️ **CRITICAL NAMING RULE** (verified against your code):
Create **4 SEPARATE subscriptions**, each **Subscription ID = the full product ID**, each with **ONE base plan**:
- Subscription `com.biblestudypro.starter.monthly` → base plan (monthly, auto-renew)
- Subscription `com.biblestudypro.starter.annual`  → base plan (annual, auto-renew)
- Subscription `com.biblestudypro.pro.monthly`     → base plan (monthly, auto-renew)
- Subscription `com.biblestudypro.pro.annual`      → base plan (annual, auto-renew)

Do NOT make one `com.biblestudypro.starter` with monthly/annual base plans. Your code strips the `:basePlanId`
suffix and looks up the full ID — it only matches when the Subscription ID equals the full product ID.

Steps: Play Console → **Monetize → Products → Subscriptions → Create subscription** (×4). Set base plan +
price + activate each base plan.

---

## PHASE 4 — RevenueCat product catalog + entitlement + offering
RC → **Product catalog**.
1. **Products** → import/create all 4 (iOS + Android). If iOS App Store Connect API key is set (Phase 8), they import automatically; otherwise add manually.
2. **Entitlements** → create one: `premium`. Attach all 4 paid products to it.
3. **Offerings** → create/confirm `default` offering with 4 **packages**, each pointing at one product ID
   (monthly/annual × starter/pro). The app reads `offerings.current.availablePackages`.

---

## PHASE 5 — Webhook → backend
1. RC → **Integrations → Webhooks → Add**.
2. URL: `https://api.getverdance.com/api/v1/subscriptions/rc-webhook`
3. **Authorization header**: invent a strong secret (e.g. `openssl rand -hex 32`), paste as the header value.
4. Environment: send both Production + Sandbox.
5. On the **prod** backend `.env`: set `RC_WEBHOOK_AUTH=<same secret>` → restart backend (pm2).
   Without this the webhook returns 503 and NO credits/plan are granted after purchase.

---

## PHASE 6 — App env keys
In `frontend/.env` (and the env the release build uses):
- `REVENUECAT_IOS_API_KEY=` → RC → Apps → Verdance (iOS) → Public API Key (`appl_…`). Already set; verify it matches this project.
- `REVENUECAT_ANDROID_API_KEY=` → RC → Apps → Verdance (Play Store) → Public API Key (`goog_…`). **Currently empty — fill this.**

Rebuild the app after changing `.env` (react-native-config bakes it in at build time).

---

## Building the tester AAB (prod env, not LAN IP)
`frontend/.env.production` holds prod values (API `https://api.getverdance.com/api/v1` + both RC keys). Dev `.env` keeps the LAN IP. Build with:
```bash
cd frontend/android && ENVFILE=.env.production ./gradlew bundleRelease
```
Output: `frontend/android/app/build/outputs/bundle/release/app-release.aab`. (Android Studio: set `ENVFILE=.env.production` or it falls back to `.env`.) `.env.production` is gitignored.

## PHASE 7 — Test on the tracks (the only place purchases work)
- **Android**: Play Console → add **license testers** (Setup → License testing). Install the closed-test build via the opt-in link. Buy each tier → confirm webhook fires (RC dashboard → Customer → events) → credits + plan land in-app within seconds.
- **iOS**: App Store Connect → **Sandbox testers**. Sign into Sandbox on the device. Buy each tier → same check.
- Verify: purchase → RC shows entitlement `premium` active → backend `/status` shows plan → credits granted → Paywall shows "Current Plan".
- Test **Restore Purchases** and **cancellation** (plan lapses to FREE on expiry).

---

## PHASE 8 — iOS polish (recommended, not blocking)
1. **App Store Connect API key** (RC → Apps → Verdance iOS → "App Store Connect API"): upload a `.p8` from
   ASC → Users and Access → Integrations → App Store Connect API. Lets RC auto-import products + price changes.
2. **Apple Server-to-Server notifications**: copy RC's URL `https://api.revenuecat.com/v1/incoming-webhooks/...`
   into ASC → your app → **App Information → App Store Server Notifications** (set Production + Sandbox URLs).
   Gives real-time renewal/refund tracking.

---

## Status tracker
- [x] RC apps created (iOS + Android)
- [x] iOS In-App Purchase Key uploaded (Valid credentials)
- [x] App code Android-safe (`:basePlanId` handled, both ends) + type-checks clean
- [ ] Phase 1 — Android service account JSON 🔴
- [x] Phase 2 — App Store Connect: group "Verdance Premium" + 4 auto-renew subs all "Ready for Review" (2026-09-17). Reorder Pro>Starter + group display name = last touches.
- [x] Phase 3 — Play Console products (4 subs, IDs=full productId, 1 active base plan each; DONE 2026-09-17)
- [x] Phase 4 — RC catalog: 4 Play products imported (Published), entitlement `premium` (4 products), offering `default` Current w/ 4 packages (DONE 2026-09-17; iOS products pending Phase 2)
- [x] Phase 5 — RC webhook "Verdance backend" created + PROD DEPLOYED 2026-09-17: `b9fc870` shipped to `/home/deploy/app/backend`, `RC_WEBHOOK_AUTH` set in prod .env, pm2 restarted, health 200, unauth webhook→401 (was 503). Both platforms now grant credits.
- [x] Phase 6 — `frontend/.env` `REVENUECAT_ANDROID_API_KEY` set (goog_…) 2026-09-17; iOS key present. Takes effect next build.
- [ ] Phase 7 — Test on tracks
- [x] Phase 8 — iOS ASC API key ("Valid credentials") + Apple S2S notifications (Prod+Sandbox URLs → RC) DONE 2026-09-17
