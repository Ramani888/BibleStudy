---
title: Credits & Subscriptions
tags: [feature, credits, subscriptions]
updated: 2026-08-10
---

# Credits & Subscriptions

> The monetization spine of BibleStudyPro: a credit economy (earn free / spend on AI) plus StoreKit/Play IAP subscription tiers (Starter/Pro) that grant credits, storage, and higher AI rate limits.

## Screens

| Screen | Route | Nav stack | Purpose |
|--------|-------|-----------|---------|
| CreditsScreen | `Credits` | ProfileStack | Balance card + 🔥 streak, weekly earn/spend chart, paginated transaction history |
| PaywallScreen | `Paywall` | ProfileStack | Tier comparison (Starter/Pro), monthly↔annual toggle, Subscribe / Restore / Manage |

Paywall is reachable from three places: Profile → "Upgrade to Premium" / "Manage Plan" button, Profile media-quota row when `overQuota` (`navigate(overQuota ? 'Paywall' : 'Media')`), and the AI chat's out-of-credits action sheet (`navigate('ProfileTab', { screen: 'Paywall' })`).

## Features & functionality

### CreditsScreen
- **Balance card** — shows `data.balance` (from `useCreditBalance`) with a "🔥 {streak}" badge when the current streak > 0 (from `useStreak`).
- **WeeklyChart** (`./components/WeeklyChart`) — earn-vs-spend bars driven by `useCreditStats`.
- **Transaction history** — infinite list (`useCreditTransactions`), pull-to-refresh (also invalidates `['credits','stats']`), infinite scroll via `fetchNextPage`, `EmptyState` "No transactions yet". Each row: description + relative date + signed amount colored by `amountColor[type]`.

### PaywallScreen
- **Billing period toggle** — Monthly / Annual; the Annual pill shows "· save ~33%".
- **Tier cards** — Starter and Pro from `TIERS`; each shows name, `priceLabel` for the selected period, and a benefit list.
- **Subscribe button** — label `Current Plan` (disabled) when the tier equals the user's current plan, else `Subscribe {priceLabel}`; calls `buy(opt.productId)`; shows a spinner while `processing`.
- **Restore Purchases** link → `restore()` (re-runs verify-on-open sync).
- **Manage Subscription** link (only when `isSubscribed`) → `openManageSubscriptions()` (deep-links to the store's subscription settings).
- **Error line** — renders `error` from the IAP hook in red.
- `isSubscribed = currentPlan !== 'FREE'`; `currentPlan` comes from the Zustand `user`.

## Data flow

**Credits read:**
`CreditsScreen → useCreditBalance (['credits','balance']) → creditsApi.getBalance → GET /credits/balance → getBalance → prisma.user.creditBalance`
`→ useStreak (['credits','streak']) → GET /credits/streak → getStreak`
`→ useCreditTransactions (['credits','transactions']) → GET /credits/transactions → getTransactions`
`→ useCreditStats (['credits','stats',period,…]) → GET /credits/stats → getStats`

**Daily login:** `useClaimDailyLogin → creditsApi.claimDailyLogin → POST /credits/daily-login → claimDailyLogin` (invalidates `['credits']`).

**Subscription purchase (RevenueCat — hardened 2026-09-16, commit `f32e5f5`):**
`PaywallScreen.buy → useIapSubscriptions.purchaseByProductId (react-native-purchases / RevenueCat SDK) → Purchases.purchasePackage → refreshUser (authApi.me + invalidate ['credits'],['subscription'])`.
The CLIENT does NOT tell the backend about the purchase — **RevenueCat's server-to-server webhook is the sole entitlement source**. The backend grants credits/plan/storage from `POST /subscriptions/rc-webhook`. The legacy `POST /subscriptions/verify` (Apple receipt verification) was **removed** — the app never called it and IAP was never live.

**Status / verify-on-open:** `AppNavigator → useSubscriptionSync (on auth mount) → identifyUser + refreshCustomerInfo (RC) → subscriptionsApi.status → GET /subscriptions/status (server RECONCILES the entitlement) → authApi.me`. Calling `/status` first means a naturally-lapsed sub downgrades to FREE even before an EXPIRATION webhook lands, so `me()` returns the reconciled plan the Paywall reads.

## Backend

### Module `backend/src/modules/credits/`
- `credits.routes.ts` · `credits.controller.ts` · `credits.service.ts` (owns Prisma) · (no dto file — validation is inline in the controller).
- **Endpoints** (all `authMiddleware`, mounted at `/api/v1/credits`):
  - `GET /balance` — `{ balance }` from `user.creditBalance`.
  - `GET /streak` — `{ streak, longestStreak }`.
  - `GET /transactions?page&limit` — paginated (limit capped at 100, default 20).
  - `GET /stats?period&from&to&interval` — earn/used time-series buckets.
  - `POST /daily-login` — claim the +1 daily reward.
- **Service functions:**
  - `getBalance(userId)` — reads `creditBalance`; `NotFoundError` if user missing.
  - `getTransactions(userId, page, limit)` — desc by `createdAt` + total/pages pagination.
  - `getStats(userId, period, fromDate?, toDate?, interval?)` — pulls `REWARD`+`USAGE` rows in range, buckets by hour/day/week/month/quarter (`resolveInterval` picks the default granularity per period). `agg()` sums `REWARD` into `earned` and `abs(USAGE)` into `used`.
  - `getStreak(userId)` — builds a `Set` of local-date strings from all `REWARD` rows; current streak = consecutive days back from today; also computes `longestStreak` across history. Returns `{0,0}` if no rewards.
  - `claimDailyLogin(userId)` — wrapped in a **Serializable** `$transaction` to prevent concurrent claims both passing the "does a REWARD exist today?" check. Also filters out `ACHIEVEMENT_REWARD` description rows when checking for today's reward (so achievement credit grants don't block the daily login). On success: atomically `increment: 1` balance + creates a `REWARD` tx; fires `triggerAchievementCheck` (streak milestones).
- **Stats validation (controller):** period ∈ `today|week|month|year|custom`; interval ∈ `1h|2h|6h|day|week|month|quarter`; custom requires valid ISO `from`/`to`, `to ≥ from`, and ≤ `MAX_CUSTOM_DAYS` (90); hour intervals only for today/custom; quarter only for year/custom.

### Module `backend/src/modules/subscriptions/` — RevenueCat-only (hardened 2026-09-16, task #20)
- `subscriptions.routes.ts` · `subscriptions.controller.ts` · `subscriptions.service.ts` (no dto — the legacy `subscriptions.dto.ts` was deleted with `/verify`).
- **Endpoints** (mounted at `/api/v1/subscriptions`):
  - `POST /rc-webhook` — **public** (before `authMiddleware`), authed by the `RC_WEBHOOK_AUTH` header. The sole entitlement grant path.
  - `GET /status` (`authMiddleware`) — `{ plan, active, expiresAt }`; reconciles the effective entitlement (lapsed → FREE) under the per-user lock as a side effect.
- **Entitlement model (dual per-environment snapshot, production precedence):** `Subscription` holds the PRODUCTION entitlement (`plan/store/productId/expiresAt`, all nullable) AND a SANDBOX snapshot (`sandboxPlan/sandboxExpiresAt`), each with its own monotonic watermark (`lastProdEventAt` / `lastSandboxEventAt`). Effective plan = active-production → else active-sandbox → else FREE.
- **Service functions:**
  - `handleRcWebhook(event)` — the whole handler runs in one txn: `ProcessedWebhookEvent(event.id)` insert dedups REPLAYS (P2002 → whole txn rolls back → `duplicate`); then a per-user `pg_advisory_xact_lock` + `User FOR UPDATE` (canonical User→MediaFile order) serializes concurrent events + getStatus. Validates `environment`∈{PRODUCTION,SANDBOX} + finite `event_timestamp_ms` (malformed → ignored). **Credits** are gated by a durable `ProcessedTransaction(store,transactionId)` ledger via `INSERT … ON CONFLICT DO NOTHING RETURNING` (idempotent per store-transaction, decoupled from event order); granted only for PRODUCTION money events in prod. **Entitlement** is applied per-environment, newest-watermark-wins; SANDBOX applies entitlement (App Review shows PRO) but grants no credits in prod. `EXPIRATION` upserts a cleared snapshot (safe before any purchase); `SUBSCRIPTION_PAUSED` does NOT revoke. `TRANSFER` downgrades prior owners (`transferred_from`).
  - `getStatus(userId)` / `reconcileEntitlement(tx, userId)` — reconcile `User.plan` + `storageLimit` mirror and media retention to the effective entitlement under the user lock.
  - `getEffectivePlan(userId)` — expiry-aware effective plan; used by the rate limiter, **media quota/retention, and credits streak-freeze** (SUB-5, no stale-paid window).
  - `withUserLock(userId, fn)` — shared advisory-lock + `User FOR UPDATE` helper (also used by `media.uploadFile`).
- **No `originalTransactionId @unique`** — transfers move it between users; dedup is via `ProcessedWebhookEvent.id` + the transaction ledger.
- Verified via the claudex-loop (plan APPROVED 5 rounds, 3 Codex inspections, ~40 runnable DB assertions). Full transcript: repo `PLAN.md` + `PLAN-REVIEW-LOG.md`.

### Config `backend/src/config/plans.ts` (single source of truth)
- `PLAN_BENEFITS`: FREE `{credits 0, 250 MB (262_144_000), aiPerHour 30}` · STARTER `{100, 2 GB (2_147_483_648), 60}` · PRO `{500, 10 GB (10_737_418_240), 120}`.
- `PRODUCTS`: four SKUs → `{plan, period, priceUsd}` — `com.biblestudypro.{starter,pro}.{monthly,annual}` at $4.99/$39.99/$9.99/$79.99.
- `creditsForPurchase(def)` — **annual = base × 12 upfront**, monthly = base.
- `getProduct(id)` — SKU lookup.

### Rate limiting `backend/src/middlewares/rateLimit.middleware.ts`
- `aiRateLimit` — per-user 1h window; `limit` is async, resolves `getEffectivePlan` → `PLAN_BENEFITS[plan].aiPerHour` (FREE 30 / STARTER 60 / PRO 120). Mounted on `ai.routes.ts`. Keyed by `req.user.id` (falls back to IP/anon). One indexed sub lookup per request.
- Also exports `generalRateLimit` (100/15min) and `authRateLimit` (10/15min). All emit `RATE_LIMIT_EXCEEDED`.

### Credit spend (variable) — `backend/src/modules/ai/ai.service.ts`
- `CREDIT_COST = { text: 1, cards: 2, image: 3, pdf: 5 }`.
- Media pre-check: if `mediaCost > balance` → `PaymentRequiredError` (402) **before** the paid Claude call.
- Actual charge = `Math.min(cost, creditBalance)` (can't go negative); on success, `$transaction` decrements balance + writes a `USAGE` tx with `amount: -charge`. Empty AI response → `AI_EMPTY_RESPONSE` (502), no charge.

## Data model

- **User** (relevant fields): `creditBalance Int @default(3)`, `storageLimit BigInt @default(262144000)`, `plan Plan @default(FREE)`, `subscription Subscription?`.
- **Subscription**: `userId @unique`, `plan`, `store`, `productId`, `expiresAt`, `originalTransactionId @unique`, `lastTransactionId`, timestamps. `onDelete: Cascade`. One-per-user.
- **CreditTransaction**: `type TransactionType`, `amount Int` (negative for USAGE), `description`, `createdAt`. Indexed `[userId]` and `[userId, type, createdAt]`. `onDelete: Cascade`.
- **Enums**: `Plan {FREE,STARTER,PRO}` · `Store {APPLE,GOOGLE}` · `TransactionType {USAGE,REWARD,PURCHASE,BONUS}` (BONUS defined but currently unused).

## Edge cases, rules & gotchas

- **Credit economy:** earn +1/day (`REWARD`, one claim per calendar day, `ConflictError` otherwise); spend variable per AI action (`USAGE`); purchases add credits (`PURCHASE`). New users start at **3 credits** (`@default(3)`).
- **Concurrent daily-login protection:** `claimDailyLogin` runs inside a Serializable transaction — two simultaneous requests can't both pass the "no REWARD today" check. Achievement reward transactions (description contains "ACHIEVEMENT_REWARD") are excluded from the daily-login duplicate check so they don't accidentally block the daily reward.
- **Atomic credit spend (AI):** `ai.service` uses a single SQL `UPDATE … WHERE creditBalance >= cost RETURNING id` — eliminates the old TOCTOU race where a stale read could allow overdraft.
- **Idempotent grants:** credits are granted **only on a new `lastTransactionId`**. Verify-on-open / restore / repeated verify calls re-set plan/expiry/storage but do **not** re-grant credits. Sandbox renewals (monthly ≈5 min, annual ≈1 hr) are the way to confirm this.
- **Annual pays 12× upfront** (E decision #2): annual grants base×12 credits on purchase, not monthly drips.
- **Idempotent credits (hardened):** credits are gated by the durable `ProcessedTransaction(store,transactionId)` ledger, not by a `lastTransactionId` cursor — reordered/duplicate webhook events for the same store transaction grant exactly once, and money processing is decoupled from entitlement ordering (an older-but-unseen paid transaction still grants).
- **Sandbox split (SUB-R6, owner-approved):** in prod, SANDBOX events apply entitlement (so App-Review purchases show PRO and self-expire) but grant **0 credits** (credits are the only permanent, farmable benefit). Production events grant credits. Production entitlement always takes precedence over sandbox; the sandbox snapshot is preserved so it's used if production later lapses.
- **Lapse → FREE downgrade (expiry-aware everywhere):** `getEffectivePlan` compares `expiresAt` to now; media quota+retention and credits streak-freeze read it (not the cached `User.plan`), so there's no stale-paid window. `mediaCleanup` also reconciles a lapsed user's null-expiry media so retention doesn't depend on a webhook/upload. **Never deletes files** on downgrade — blocks new uploads over the FREE quota only.
- **Verify-on-open:** `useSubscriptionSync` runs once on authed mount; it calls `/status` (server reconciles) before `authApi.me()`, and never throws (offline/unconfigured must not break launch).
- **Per-tier AI rate limit** is separate from credit cost — a user can be rate-limited (429) even with credits, and can run out of credits (402) while under the rate limit.
- **RevenueCat is the client SDK for BOTH stores** (`react-native-purchases ^10.9.0` in `frontend/`; `react-native-iap` is NOT installed anymore — the old v16/Nitro notes are obsolete). Client purchases/restores via RC (`frontend/src/lib/purchases.ts`); backend grants from the RC webhook. Purchases **don't work in the Simulator / on debug builds** — a Play-signed track build + license testers (Android) or a Sandbox tester (iOS) is required.
- **Google Play product-identifier gotcha (RC SDK v6+):** RC reports a Google subscription as `subscriptionId:basePlanId`, not the bare id. So on Play each of the 4 subscriptions must have its **Subscription ID = the full product ID** (`com.biblestudypro.pro.annual`) with one base plan. Code handles the suffix on both ends (2026-09-17): `purchases.ts` prefix-matches `productId + ':'`; `plans.ts getProduct` strips after `:`. iOS sends the exact id (no colon).
- **RC config is fail-safe:** `configureRevenueCat()` no-ops when the API key is missing; `getPackages()` returns `[]`; `buy()` surfaces "Store not available" as inline text. Paywall UI is driven by static `TIERS`, so it renders (and never crashes) even with RC unconfigured or products not yet active — safe to ship in a closed test before store products exist.
- **Product IDs are duplicated** in `backend/src/config/plans.ts` and `frontend/src/types/subscription.types.ts` (`TIERS`/`ALL_PRODUCT_IDS`) — change both, and they must match App Store Connect AND Play Console exactly.
- **Stats gotchas:** custom range ≤ 90 days; hour intervals only today/custom; quarter only year/custom; `getStreak` uses local-date strings (timezone of the server).
- **BONUS** transaction type exists in the enum but no code path writes it yet.

## This session's additions (A–G arc)

This is **Phase E** (subscriptions). The whole area is **code-complete and hardened** (2026-09-16, task #20, commit `f32e5f5`): RevenueCat is the sole entitlement path (legacy `/verify` removed), the RC webhook grants credits/plan/storage, and entitlement is fully expiry-aware. It is **pending real-world config only** — RevenueCat project + App Store Connect products (4 SKUs in one subscription group), an active Paid Apps Agreement, and `RC_WEBHOOK_AUTH` in `backend/.env`. See repo-root `IAP_SETUP.md` for the ordered checklist. Earlier arc phases seeded this area: variable credit costs and free-tier AI (A–C), and the achievement/streak surfacing that `claimDailyLogin` triggers.

## RevenueCat store integration — LIVE setup (started 2026-09-17)

Turning the code-complete Phase E into working purchases. **Full ordered guide + status tracker: repo-root `REVENUECAT_SETUP.md`** (authoritative; `IAP_SETUP.md` is the stale Apple-receipt-era doc — ignore it). RC project **Verdance** (`a5826484`); both apps exist, bundle `com.getverdance.app`: iOS `appb38d4bbf4e`, Play `app29304c8191`.

Progress:
- ✅ **RC apps created** (iOS + Play).
- ✅ **iOS In-App Purchase Key** uploaded — "Valid credentials".
- ✅ **App code Android-safe** — `:basePlanId` handled both ends (`frontend/src/lib/purchases.ts`, `backend/src/config/plans.ts`); both `tsc --noEmit` clean; runnable check confirmed iOS-exact + Android-suffix both resolve to the right tier/credits.
- ✅ **Phase 1 — Android service account DONE.** GCP project **`bible-study-504809`** ("Bible Study"): enabled Android Publisher + Play Developer Reporting APIs; service account `revenuecat@bible-study-504809.iam.gserviceaccount.com` with roles **Pub/Sub Editor** + **Monitoring Viewer**; JSON key `~/Downloads/bible-study-504809-939afd7d66ee.json` (⚠️ secret, never commit); invited into Play Console with **Admin (all apps)** incl. financial + manage-orders; uploaded to RC → **"Valid credentials"**. (RTDN "Google developer notifications" warning is optional — real-time only, not required for correctness.)
- ✅ **Phase 3 — Play Console subscriptions DONE** (2026-09-17): 4 subs created, Subscription ID = full product ID, 1 auto-renewing base plan each (monthly/annual), prices $4.99/$39.99/$9.99/$79.99, all **Active** across 174 regions, "Backwards compatible".
- ✅ **Phase 2 — App Store Connect DONE** (2026-09-17): group "Verdance Premium" + 4 auto-renew subs (same product IDs, $4.99/$39.99/$9.99/$79.99) all "Ready for Review"; review screenshot = `branding/store-screenshots/raw-ios/07-paywall.png` reused ×4 (internal-only, one shot fine). Order Pro>Starter for correct upgrade/downgrade. Subs submit with the next app build.
- ✅ **Phase 4 — RC catalog DONE (both platforms, 2026-09-17)**: entitlement `premium` = 8 products (4 Android `:basePlanId` + 4 iOS clean IDs); offering `default` (Current) = 4 packages ($rc_monthly/$rc_annual + custom pro_monthly/pro_annual), each holding BOTH an iOS + Android product. RC auto-serves the right store per device — one paywall, both plans, both platforms fully settled.
- ⬜ **Phase 5 — Webhook** — RC → `https://api.getverdance.com/api/v1/subscriptions/rc-webhook` + Authorization secret → same value in prod `backend/.env` `RC_WEBHOOK_AUTH` (empty now; without it webhook 503s, no grant).
- ⬜ **Phase 6 — `.env` keys** — `frontend/.env` `REVENUECAT_ANDROID_API_KEY` empty (paste `goog_` Public API Key); verify `appl_` iOS key. Rebuild after (react-native-config bakes at build time).
- ⬜ **Phase 7 — test on tracks** — license/sandbox testers, buy each tier, confirm webhook → credits+plan land.
- ✅ **Phase 8 DONE** (2026-09-17): iOS App Store Connect API key uploaded to RC ("Valid credentials") + Apple S2S notifications set (Prod+Sandbox Server URLs → RC incoming-webhook, Version 2). iOS store side fully wired (IAP key + ASC API key + S2S + 4 products Ready for Review).

Bigger picture: this all serves getting the app **live on Play Production** so **BillDesk PA-CB KYC** (rejected "app not live/not accessible", App ID 2609094782) can pass — that needs the mandatory 12-tester/14-day closed test then Production. India-only launch could sidestep BillDesk (it only gates *international* sales).

## Related

[[AI Assistant]] · [[Profile & Settings]] · [[Media]] · [[Achievements]] · [[Architecture Overview]] · [[Database Schema]]
