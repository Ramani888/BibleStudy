# RevenueCat Migration — Scope

Migrate IAP from the custom **react-native-iap + backend receipt-verify** stack to
**RevenueCat**. Goal: correct cross-platform verification (fixes the Google stub),
robust subscription lifecycle, less money-critical code to own.

## Current architecture (custom)

**Frontend**
- `utils/iap.ts` — react-native-iap: `initConnection`, `getActiveSubscriptions`, `getReceiptDataIOS`, `deepLinkToSubscriptions`; `syncEntitlementOnOpen()` (verify-on-open).
- `hooks/useSubscription.ts` — `useSubscriptionStatus` (GET backend status), `useSubscriptionSync` (verify-on-open on mount), `useIapSubscriptions` (`useIAP`: fetchProducts / requestPurchase / finishTransaction / restore).
- `api/subscriptions.api.ts` — `status()`, `verify()`.
- `screens/profile/PaywallScreen.tsx` (16 KB) — consumes `useIapSubscriptions` (`buy/restore/loadProducts/processing/error`) at line 187.
- `types/subscription.types.ts` — `TIERS`, product IDs, payloads.
- deps: `react-native-iap@16`, `react-native-nitro-modules` (only used by react-native-iap).

**Backend**
- `modules/subscriptions/` — routes (`POST /verify`, `GET /status`), controller, service:
  `verifyApple` (legacy verifyReceipt), `verifyGoogle` (**STUB — throws**), `applyEntitlement` (idempotent credit grant), `getStatus`, `getEffectivePlan`.
- `config/plans.ts` — `PLAN_BENEFITS`, `PRODUCTS`, `creditsForPurchase`.
- `middlewares/rateLimit.middleware.ts` — calls `getEffectivePlan`.
- Prisma `Subscription` (userId unique, plan, store, productId, expiresAt, originalTransactionId **@unique**, lastTransactionId).
- deps `google-auth-library` (used by **auth**/Google Sign-In — KEEP) + `jsonwebtoken` (used by **jwt** — KEEP). Neither is IAP-only.

## Target architecture (RevenueCat)

- **Client** uses `react-native-purchases`: configure with RC public SDK key, `Purchases.logIn(userId)`, show `getOfferings()`, buy via `purchasePackage()`, read entitlements via `getCustomerInfo()`. RC handles the store transaction, finishing, receipt validation, restore.
- **Server truth via webhook**: RC → `POST /subscriptions/rc-webhook` (auth header secret). On `INITIAL_PURCHASE`/`RENEWAL`/`PRODUCT_CHANGE` grant credits + set plan/expiry; on `CANCELLATION`/`EXPIRATION`/`BILLING_ISSUE` update expiry. Idempotent on RC `event.id`.
- Backend `Subscription` table stays the source for `getStatus`/`getEffectivePlan` — now populated by the webhook, not client verify.

## Reuse / Replace / Delete

**REUSE (unchanged or trigger-rewired)**
- `config/plans.ts` — 100%. Webhook gives `product_id` → `getProduct()` → plan + `creditsForPurchase()`.
- `applyEntitlement()` grant logic — reused verbatim; only its *trigger* changes (webhook event, idempotency key = `event.id`).
- `getStatus` / `getEffectivePlan` + rate limiter — unchanged (read Subscription table).
- `Subscription` + `CreditTransaction` models — kept (idempotency column change, below).
- `PaywallScreen.tsx` UI + `TIERS` + i18n — kept; only the hook wiring swaps.

**REPLACE**
- `utils/iap.ts` → rewrite (smaller) on `react-native-purchases`.
- `useIapSubscriptions` + `syncEntitlementOnOpen` → RC offerings/purchase + `getCustomerInfo`.
- Backend `verifyApple` + `POST /verify` receipt flow → `POST /rc-webhook` (+ optional RC REST `GET /subscribers/{app_user_id}` for on-demand sync).
- `VerifyPurchaseDto` (receipt payload) → webhook DTO.

**DELETE**
- `verifyGoogle` stub (RC does Google).
- deps: `react-native-iap`, `react-native-nitro-modules` (nitro is only react-native-iap's — safe to drop).
- Backend: **remove nothing** — `google-auth-library`/`jsonwebtoken` are auth, not IAP.

## Prisma migration
- Add `rcAppUserId String?` to `Subscription` (link RC app user).
- Idempotency: RC retries webhooks → add a `ProcessedWebhookEvent { id (rc event.id) @id, createdAt }` table (or `lastEventId` col). Grant only if `event.id` unseen.
- **Relax `originalTransactionId @unique`** → make nullable/optional (RC events don't map 1:1 to it). Keep `expiresAt`, `plan`, `productId`.

## Ordered steps
0. **RC dashboard (you):** create project → add iOS+Android apps → upload App Store Connect API key (.p8) + Play service-account JSON → define entitlements `starter`,`pro` → one Offering with the 4 packages (same product IDs) → copy iOS/Android SDK public keys + webhook auth secret. Still create the products in App Store Connect + Play Console first (unchanged).
1. **Backend webhook:** `rc-webhook` route+controller+service; reuse `applyEntitlement`; `event.id` idempotency; env `RC_WEBHOOK_AUTH` (+ optional `RC_API_KEY`). Prisma migration. Keep `/status`.
2. **Frontend SDK swap:** add `react-native-purchases`; configure + `logIn(userId)` on auth; rewrite Paywall buy/restore/products via offerings; refresh backend user after purchase. Remove react-native-iap + nitro.
3. **Verify-on-open:** replace `syncEntitlementOnOpen` with `getCustomerInfo()` + refresh backend user; backend `/status` still read for credits/plan.
4. **Cleanup + test:** drop dead code/deps/env (`APPLE_IAP_SHARED_SECRET` moves into the RC dashboard); sandbox-test purchase/renew/restore on BOTH platforms; pod install (iOS).

## Effort
~2 dev-days: backend ~0.5d (1 endpoint + migration, grant logic reused), frontend ~0.5–1d (swap SDK + 2 files + Paywall wiring), sandbox testing ~0.5d. Your RC dashboard + store keys ~1–2h.

## Risks / notes
- **Money path** — keep idempotency airtight (dedupe on `event.id`; webhooks retry).
- `subscriptions/` is on the "don't touch without full review" list — do it on a branch, verify with a runnable check (per project rules) before merge.
- `react-native-purchases` needs `pod install` + a config-plugin-free native setup (bare RN 0.84 — fine).
- RC free until ~$2.5k/mo tracked revenue, then ~1%.
- Verify-on-open gets simpler: RC SDK caches + refreshes `customerInfo`; no manual receipt extraction.
