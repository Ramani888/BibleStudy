---
tags: [backend, module, subscriptions]
updated: 2026-08-08
---

# Module — Subscriptions

Path: `backend/src/modules/subscriptions/` (+ `backend/src/config/plans.ts`,
per-tier limits in `middlewares/rateLimit.middleware.ts`).
Mounted at `/api/v1/subscriptions`. Feature note: [[Credits & Subscriptions]].

In-app-purchase subscriptions (IAP, **not Stripe** — locked decision) that grant a
tier's benefits. Apple receipt verification is implemented; Google Play is a guarded stub.

## Tier config — single source of truth (`config/plans.ts`)
`PLAN_BENEFITS: Record<Plan, PlanBenefits>` — everything downstream reads from here:
| Plan | credits/mo | storage | AI /hr |
|------|-----------|---------|--------|
| FREE | 0 | 250 MB | 30 |
| STARTER | 100 | 2 GB | 60 |
| PRO | 500 | 10 GB | 120 |

`PRODUCTS` maps store `productId` → `{ plan, period, priceUsd }` for
starter/pro × monthly/annual (`com.biblestudypro.*`). Helpers: `getProduct(id)`,
`creditsForPurchase(def)` — **annual grants 12× credits upfront** (E decision #2).

## Endpoints (behind `authMiddleware`)
- `POST /verify` — `{ platform: APPLE|GOOGLE, productId, receipt }`; verifies the receipt,
  applies the entitlement, returns `{ plan, active, expiresAt, granted }`.
- `GET /status` — current plan; **rechecks expiry** and downgrades a lapsed sub to FREE.

## Apple verify (`subscriptions.service.ts`)
`verifyApple` uses the legacy **`/verifyReceipt`** endpoint (no extra dep). Requires
`APPLE_IAP_SHARED_SECRET` (else 503 `IAP_NOT_CONFIGURED`). Calls **prod first**, retries
**sandbox on status 21007**, rejects non-zero status. Picks the latest renewal for the
product by `expires_date_ms`, returning `{ expiresAt, originalTransactionId, latestTransactionId }`.
`verifyGoogle` is a `ponytail:` guarded stub (503) until Play credentials exist — iPhone is the launch device.

## Entitlement application (idempotent)
`applyEntitlement` upserts the **Subscription** row and updates `user.plan` +
`user.storageLimit`. Credits are granted **only on a new/renewed transaction**
(`lastTransactionId` changed) inside a `$transaction`, writing a `PURCHASE`
`CreditTransaction`. Re-verifying the same receipt won't double-grant.

## Per-tier rate limiting (`rateLimit.middleware.ts`)
- `generalRateLimit` — 100 req / 15 min (global, in `app.ts`).
- `authRateLimit` — 10 / 15 min on auth routes.
- `aiRateLimit` — **per-user, per-tier**: keyed by `req.user.id`, ceiling from
  `PLAN_BENEFITS[plan].aiPerHour` via `getEffectivePlan(userId)` (one indexed sub lookup;
  lapsed subs treated as FREE). Runs after `authMiddleware` on AI routes.

`getEffectivePlan(userId)` is the cheap plan lookup shared by the limiter — returns FREE
if there's no active (unexpired) subscription.

## Models
**Subscription** — unique `userId`, `plan`, `store`, `productId`, `expiresAt`,
`originalTransactionId`, `lastTransactionId`. `User.plan` + `User.storageLimit` hold the
applied benefits. See [[Database Schema]].

## Client
Hooks: `useSubscription`; paywall + Credits screen. See [[Hooks & API Layer]].

## See also
[[Credits & Subscriptions]] · [[Module - AI & Credits]] · [[Module - Media & Notes]] · [[Database Schema]]
