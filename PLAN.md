# Subscriptions entitlement hardening (deferred task #20, pre-IAP)

Host=Claude (planner/coordinator, default builder) · Reviewer=Codex · Final inspector=fresh Codex.
Plan-review ≤5 rounds. Build only after Codex APPROVES + owner sign-off. A Prisma migration is in scope.

## Goal
Make the subscriptions entitlement subsystem safe to enable IAP (RevenueCat). Fix the 7 findings from
the #16 read-only audit (`subscriptions_hardening_todo`). Nothing here is exploitable today (no
`APPLE_IAP_SHARED_SECRET`, no store products), so this is a pre-launch hardening, not an incident.

## Key evidence (drives the approach)
The app is on **RevenueCat only**: `frontend/src/lib/purchases.ts` uses `react-native-purchases`
(`Purchases.purchasePackage`), and `useSubscription.ts` states "Backend grants credits from the RC
webhook." **`subscriptionsApi.verify` (`POST /subscriptions/verify`) has NO call site** in the app,
and IAP never went live, so no released client has ever used the legacy Apple-receipt path.

## Approach & decisions

### D1 — Remove the dead legacy receipt-verification path (resolves SUB-1/2/6/7 by deletion)
Delete `verifyApple`, `verifyGoogle`, `applyEntitlement`, `verifyPurchase`, the `POST /verify` route,
and `VerifyPurchaseDto`. Remove the now-dead `subscriptionsApi.verify` fn + `VerifyPurchase*` types on
the frontend. Keep `getStatus`, `getEffectivePlan`, the RC webhook, and `RC_STORE_MAP`/sets.
- SUB-1 double-grant race on `/verify` → path gone.
- SUB-2 foreign-receipt reuse via the upsert UPDATE branch → path gone.
- SUB-6 sandbox receipt accepted in prod → path gone (RC's `environment` field handles this; see D3).
- SUB-7 cross-path double-grant (`/verify` vs webhook dedup keys) → only one grant path remains.
Safe because: no app code calls it and no production client ever transacted through it (IAP never on).

### D2 — SUB-3: durable per-transaction credit ledger, decoupled from entitlement (migration)
Add `ProcessedTransaction` `@@unique([store, transactionId])`. Credits are granted **iff** this row is
newly inserted for the event's `(store, transactionId)`.
- **[SUB-R1] Do NOT catch P2002 mid-txn** — a constraint violation aborts the whole Postgres txn, so
  the entitlement writes couldn't commit. Insert with `INSERT INTO "ProcessedTransaction" ... ON
  CONFLICT ("store","transactionId") DO NOTHING RETURNING id` via `tx.$queryRaw` and branch on whether
  a row came back (inserted → grant credits; empty → skip credits, no abort).
- **[SUB-R3] Decouple money from entitlement ordering:** a money event (`INITIAL_PURCHASE`/`RENEWAL`)
  runs the ledger-gated credit grant for its transaction **regardless of event order** — so an
  older-but-unseen paid transaction arriving after a newer event still grants its credits exactly once.
  Entitlement (plan/expiry/storage) is applied separately, gated by D3's ordering (newest wins).

### D3 — SUB-4 ordering + SUB-R6 environment handling on the webhook (migration)
- Extend `RcWebhookEvent` with `event_timestamp_ms: number` and `environment: 'PRODUCTION'|'SANDBOX'`
  (both in RC's documented webhook payload; if names differ, adjust mapping — design unchanged).
- **[SUB-R2] Serialize per user.** Wrap the whole webhook handler body (and getStatus's reconcile, see
  D4/D5) in one interactive txn that FIRST takes `pg_advisory_xact_lock(hashtext(userId))` and locks
  the `User` row (`SELECT … FOR UPDATE`) BEFORE reading `Subscription`/`lastEventAt` — preserving the
  media audit's `User → MediaFile` acquisition order. Re-read all state under the lock. This closes the
  read-then-write ordering TOCTOU and the getStatus-vs-renewal race.
- **[SUB-R6] Environment split (OWNER-APPROVED 2026-09-16):** apply ENTITLEMENT for both PRODUCTION and
  SANDBOX events (so an App-Review sandbox purchase shows PRO — Paywall reads backend `user.plan` — and
  it self-expires quickly), but grant CREDITS only when `environment==='PRODUCTION'`. Credits are the
  only permanent, farmable benefit; entitlement is ephemeral (sandbox subs expire fast). In non-prod
  (`NODE_ENV!=='production'`), sandbox credits are allowed for local testing. (Owner chose the split
  over a reviewer-allowlist.)
- **[SUB-4 + SUB-R7 + SUB-R8] Dual per-environment entitlement snapshots with PRODUCTION precedence.**
  Persist each environment's latest entitlement AND its ordering watermark separately, so sandbox can
  neither clobber (R7) nor be lost against (R8) production. The existing `Subscription.plan`/`expiresAt`/
  `store`/`productId` now explicitly hold the **PRODUCTION** entitlement; add `lastProdEventAt DateTime?`,
  and a sandbox snapshot `sandboxPlan Plan?`, `sandboxExpiresAt DateTime?`, `lastSandboxEventAt DateTime?`.
  Under the per-user lock:
  - PRODUCTION event, `event_timestamp_ms > lastProdEventAt`: write `plan/expiresAt/store/productId`,
    advance `lastProdEventAt`. (A stale prod EXPIRATION older than the watermark is skipped.)
  - SANDBOX event, `event_timestamp_ms > lastSandboxEventAt`: write `sandboxPlan/sandboxExpiresAt`,
    advance `lastSandboxEventAt`. Never grants credits in prod (SUB-R6). Never touches the production
    fields.
  - Terminal EXPIRATION clears only its own environment's snapshot (prod → prod fields; sandbox →
    sandbox fields).
  - `getEffectivePlan` (and getStatus reconcile) compute: active production (`plan && expiresAt > now`)
    → prod plan; else active sandbox (`sandboxPlan && sandboxExpiresAt > now`) → sandbox plan; else FREE.
    Production always wins while active; sandbox is independently preserved and used only when no prod is
    active. `User.plan`/`storageLimit` mirror this effective value. (Credits are NOT gated by watermarks
    — see SUB-R3.)
- **[SUB-R5] `SUBSCRIPTION_PAUSED` does not revoke:** move it OUT of the immediate-downgrade set.
  Terminal downgrade applies only on `EXPIRATION`; a scheduled pause is recorded but access stays until
  the real expiry event.

### D4 — SUB-5 + SUB-R4: expiry-aware entitlement AND quota everywhere
Entitlement DECISIONS must read the effective (expiry-aware) plan, never the cached `User.plan`.
- `credits.maintainStreakFreezes`: `user.plan !== 'FREE'` → `(await getEffectivePlan(userId)) !== 'FREE'`.
- `media.uploadFile`: **[SUB-R4]** the quota check must use the effective plan's `storageLimit`, not the
  cached `User.storageLimit` (an expired PRO otherwise keeps 10 GB). Inside the upload txn, after taking
  the User lock (its existing conditional UPDATE already locks the row), first RECONCILE
  `User.storageLimit` (and `User.plan`) to `PLAN_BENEFITS[getEffectivePlan(userId)]` via a plain UPDATE,
  THEN run the existing atomic `storageUsed + size <= storageLimit` conditional UPDATE — now against the
  correct limit. Retention expiry is derived from the same effective plan. Preserves the atomic
  quota design and the `User → MediaFile` lock order.
- No import cycle: media/credits → `subscriptions.getEffectivePlan`; subscriptions imports neither.

### D5 — getStatus reconciliation under the shared lock (SUB-R2)
`getStatus` is NOT preserved unchanged. Its lapse-downgrade must run inside the same per-user
advisory-lock + User-`FOR UPDATE` txn and re-read `Subscription.expiresAt` under the lock before
writing, so a renewal committing concurrently can't be clobbered by a stale "expired" read. Extract a
shared `reconcileEntitlement(tx, userId)` used by getStatus, the webhook, and media's upload reconcile.

## Preserve (do NOT change)
Webhook replay idempotency via `ProcessedWebhookEvent`; `/status` + `getEffectivePlan` behavior;
`/verify` is removed not reworked; the media audit's `User → MediaFile` lock order; RC `Authorization`
-header auth (RC's documented model).

## Migration (idempotent, per the referral-migration lesson)
One migration `YYYYMMDDHHMMSS_subscriptions_hardening`:
- `CREATE TABLE IF NOT EXISTS "ProcessedTransaction"` (id pk, store, "transactionId", "userId",
  "createdAt" default now()) + unique index on `(store, "transactionId")`.
- `ALTER TABLE "Subscription"` ADD (IF NOT EXISTS) `"lastProdEventAt" TIMESTAMP(3)`,
  `"sandboxPlan" "Plan"`, `"sandboxExpiresAt" TIMESTAMP(3)`, `"lastSandboxEventAt" TIMESTAMP(3)`
  (SUB-R7/R8 dual-snapshot: existing plan/expiresAt = production entitlement).
- **[SUB-R9]** `ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP NOT NULL`, and the same for
  `"expiresAt"`, `"store"`, `"productId"` — a sandbox-only (or not-yet-purchased) row must be insertable
  with the production fields null. Prisma schema: `plan Plan?`, `expiresAt DateTime?`, `store Store?`,
  `productId String?`. Code (`getEffectivePlan`, `getStatus`) already guards `plan && expiresAt > now`,
  so null production fields read as "no active production entitlement". No data backfill (no live subs).
Run `prisma migrate dev` locally. **Deploy step:** apply to prod DB with `prisma migrate deploy`
against the prod `DATABASE_URL` BEFORE deploying the new dist (never `migrate reset` on prod). The
`ON CONFLICT` insert requires the unique index to exist first — migration precedes code deploy.

## Non-goals
Google Play verify (RC handles Play; stub removed with D1); changing RC auth; per-tz anything.

## Acceptance criteria (observable)
1. `POST /subscriptions/verify` no longer exists (route removed); app + build unaffected.
2. Two webhook events with different `event.id` but the same `(store, transactionId)` grant credits
   exactly **once**; entitlement still applied on the second (no txn abort — SUB-R1).
3. **Reverse-order money events (SUB-R3):** a newer event processed first, then an older distinct paid
   transaction (e.g. UNCANCELLATION then an older RENEWAL, or two renewals in reverse) — BOTH distinct
   transactions' credits are granted exactly once; only the newest event's entitlement snapshot sticks.
4. A stale `EXPIRATION` (older `event_timestamp_ms`) after a newer `RENEWAL` does **not** downgrade the
   entitlement; the active state stands. `SUBSCRIPTION_PAUSED` does not revoke access (SUB-R5).
5. **Environment (SUB-R6):** a `SANDBOX` money event in `NODE_ENV=production` applies entitlement
   (`user.plan` reflects the tier) but grants **0 credits**; a `PRODUCTION` event grants credits.
5b. **Sandbox↔prod precedence + preservation (SUB-R7/R8):** with an ACTIVE production PRO, a later
   SANDBOX event does not change the effective plan (prod wins) — but the sandbox snapshot is retained,
   so if production then expires while the sandbox entitlement is still active, `getEffectivePlan`
   returns the sandbox plan (not FREE). A production event never reads/writes sandbox fields and vice
   versa.
6. **Expiry-aware quota (SUB-R4):** after natural expiry (`expiresAt` past, `User.plan` mirror still
   `PRO`), `getEffectivePlan → FREE`; a media upload larger than FREE's 250 MB is **rejected** without
   any prior `/status` call, `maintainStreakFreezes` treats the user as FREE, and retention is 30 days.
7. Concurrent webhook events (and getStatus-vs-renewal) don't lose updates — serialized per user
   (SUB-R2); final state is deterministic.
8. Webhook replay (same `event.id`) still returns `duplicate` (unchanged).

## Verification (proof)
- `cd backend && npx tsc --noEmit` (service + all callers) and `cd frontend && npx tsc --noEmit`.
- Throwaway `_subscheck.ts` (deleted after) against dev DB asserting criteria 2–6, plus criterion 1
  by grepping the compiled routes. Runnable proof for every money/DB path before "done".

## Risks / assumptions to confirm in review
- RC webhook payload includes `event.event_timestamp_ms` and `event.environment` (RC docs). If a field
  name differs, adjust the mapping; the design is unchanged.
- Removing `/verify` assumes no out-of-band client/tooling calls it — supported by "IAP never live" +
  no call site. Reviewer should challenge this.
- **SUB-R6: RESOLVED (owner-approved).** Environment split — apply sandbox entitlement, grant no sandbox
  credits in prod. Keeps App-Review purchase flow working while blocking sandbox credit-farming.
- Deadlock surface: webhook, getStatus, media upload, and credits all now take the per-user advisory
  lock + User row before Subscription/MediaFile. Verify a consistent acquisition order (advisory →
  User → {Subscription select, MediaFile}) across all four; stress-test concurrently.
