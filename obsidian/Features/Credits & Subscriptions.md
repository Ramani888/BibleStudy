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

**Subscription purchase:**
`PaywallScreen.buy → useIapSubscriptions.requestPurchase (react-native-iap useIAP) → onPurchaseSuccess(handleSuccess) → getPlatformReceipt → subscriptionsApi.verify → POST /subscriptions/verify → verifyPurchase → verifyApple → applyEntitlement → finishTransaction → refreshUser (authApi.me + invalidate ['credits'],['subscription'])`.

**Status / verify-on-open:** `AppNavigator → useSubscriptionSync (on auth mount) → syncEntitlementOnOpen → getActiveSubscriptions → (if active) subscriptionsApi.verify else subscriptionsApi.status → GET /subscriptions/status → getStatus`.

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

### Module `backend/src/modules/subscriptions/`
- `subscriptions.routes.ts` · `subscriptions.controller.ts` · `subscriptions.service.ts` · `subscriptions.dto.ts`.
- **Endpoints** (all `authMiddleware`, mounted at `/api/v1/subscriptions`):
  - `POST /verify` (`validate(VerifyPurchaseDto)`) — verify a store receipt and apply entitlement.
  - `GET /status` — `{ plan, active, expiresAt }`; recomputes expiry and downgrades a lapsed record to FREE as a side effect.
- **Service functions:**
  - `verifyApple(receipt, productId)` — POSTs to Apple `verifyReceipt`, **prod first**, retries **sandbox on status 21007**; non-zero status → `RECEIPT_INVALID` (400); picks the highest `expires_date_ms` for the product; `RECEIPT_NO_MATCH` if none. Requires `APPLE_IAP_SHARED_SECRET` else `IAP_NOT_CONFIGURED` (503).
  - `verifyGoogle(...)` — **guarded stub**, always throws `IAP_NOT_CONFIGURED` (503). (`ponytail:` comment — implement with Play Developer API once `GOOGLE_PLAY_SA_JSON` + Play products exist.)
  - `applyEntitlement(userId, store, def, v)` — upserts the `Subscription`, sets `user.plan` + `storageLimit` from `PLAN_BENEFITS`, and **only when `lastTransactionId` differs** (new purchase or renewal) grants credits (`creditsForPurchase`) + writes a `PURCHASE` tx. All in one `$transaction`. Returns `isNewTransaction`.
  - `verifyPurchase(userId, dto)` — resolves product (`UNKNOWN_PRODUCT` if not in `PRODUCTS`), verifies per platform, applies entitlement; returns `{ plan, active, expiresAt, granted }`.
  - `getStatus(userId)` — no sub → FREE; expired sub → downgrade user to FREE + FREE storage, return inactive; else active.
  - `getEffectivePlan(userId)` — cheap `{plan,expiresAt}` lookup for the rate limiter; treats missing/expired as FREE.
- **DTO `VerifyPurchaseDto`:** `platform: enum(['APPLE','GOOGLE'])`, `productId: string().min(1)`, `receipt: string().min(1)` (Apple base64 app receipt / Google purchaseToken).

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
- **Apple prod→sandbox fallback:** always hit prod `verifyReceipt` first; status `21007` = sandbox receipt → retry sandbox. Errors: `IAP_NOT_CONFIGURED` (503, missing shared secret), `RECEIPT_INVALID` (400), `RECEIPT_NO_MATCH` (400), `UNKNOWN_PRODUCT` (400).
- **Lapse → FREE downgrade:** `getStatus` and `getEffectivePlan` compare `expiresAt` to now; an expired sub downgrades `user.plan` to FREE and resets `storageLimit` to the FREE limit. **Never deletes files** — blocks new uploads over the FREE quota only.
- **Verify-on-open (E decision #1):** `useSubscriptionSync` runs once on authed mount; `syncEntitlementOnOpen` never throws (offline/unconfigured store must not break launch) — it re-verifies an active store receipt (catches renewals) or falls back to the cheap `status` call.
- **Per-tier AI rate limit** is separate from credit cost — a user can be rate-limited (429) even with credits, and can run out of credits (402) while under the rate limit.
- **Google Play is a stub** — the paywall already passes the Android `purchaseToken` but `verifyGoogle` throws 503; Android IAP is deferred.
- **react-native-iap v16 + Nitro:** built on `react-native-nitro-modules`, which must be a **direct dependency** (`^0.36.5` in package.json) or pod install fails (`NitroModules … depended upon by NitroIap`). StoreKit purchases **don't work in the Simulator** — real iPhone required.
- **tsconfig paths workaround:** `tsconfig.json` maps `"react-native-iap": ["node_modules/react-native-iap/lib/typescript/src/index.d.ts"]` so TS resolves the v16 types.
- **Unknown SKUs are silently omitted** by `fetchProducts` — a product-ID typo just makes the tier not appear.
- **Product IDs are duplicated** in `backend/src/config/plans.ts` and `frontend/src/types/subscription.types.ts` (`TIERS`/`ALL_PRODUCT_IDS`) — change both, and they must match App Store Connect exactly.
- **Stats gotchas:** custom range ≤ 90 days; hour intervals only today/custom; quarter only year/custom; `getStreak` uses local-date strings (timezone of the server).
- **BONUS** transaction type exists in the enum but no code path writes it yet.

## This session's additions (A–G arc)

This is **Phase E** (subscriptions). The whole area is **code-complete**: backend verify/entitlement/rate-limit, the Paywall, verify-on-open, and restore all exist. It is **pending real-world config only** — App Store Connect products (4 SKUs in one subscription group), an active Paid Apps Agreement, and `APPLE_IAP_SHARED_SECRET` in `backend/.env`. See repo-root `IAP_SETUP.md` for the ordered checklist. Earlier arc phases seeded this area: variable credit costs and free-tier AI (A–C), and the achievement/streak surfacing that `claimDailyLogin` triggers.

## Related

[[AI Assistant]] · [[Profile & Settings]] · [[Media]] · [[Achievements]] · [[Architecture Overview]] · [[Database Schema]]
