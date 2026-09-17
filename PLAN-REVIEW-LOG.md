# Claudex-loop log — Subscriptions entitlement hardening (#20)

- Host=Claude (planner/coordinator, default builder). Reviewer=Codex. Final inspector=fresh Codex session.
- Models: host=Opus (preserved); Codex reviewer/inspector = its own CLI default (reported as observed).
- Plan=PLAN.md · Log=PLAN-REVIEW-LOG.md · rounds<=5 · inspect=on · MAX_FIX_ROUNDS=2 · MAX_INSPECTION_ROUNDS=2.
- Authorization: plan + independent review authorized now. BUILD gated on Codex APPROVED + owner sign-off.
  Migration in scope; prod migrate deploy is a flagged deploy step.

## Recon conclusions
- App is RevenueCat-only (react-native-purchases); RC webhook is the sole live grant path.
- Legacy POST /subscriptions/verify (verifyApple/applyEntitlement) is DEAD — no frontend call site,
  IAP never live -> safe to remove (resolves SUB-1/2/6/7 by deletion).
- getEffectivePlan (expiry-aware) exists; only the rate limiter uses it. media/credits read User.plan directly (SUB-5).

## Round log

### Round 1 — Codex REVISE (artifact claudex-lviiyqfx). 6 findings, all accepted:
- SUB-R1 (high): P2002 inside a txn aborts it — ledger must use INSERT ON CONFLICT DO NOTHING RETURNING, branch on inserted.
- SUB-R2 (high): timestamp compare is TOCTOU + getStatus races renewals. Add per-user advisory lock (User-first) around webhook + getStatus, re-read under lock.
- SUB-R3 (high): ignoring a whole stale event loses credits. Decouple entitlement-ordering (newest wins) from money-processing (each unseen (store,txnId) grants once regardless of order).
- SUB-R4 (high): quota still reads User.storageLimit — expired PRO keeps 10GB. Reconcile storageLimit from effective plan under the upload lock.
- SUB-R5 (med): SUBSCRIPTION_PAUSED must NOT revoke; downgrade only on EXPIRATION.
- SUB-R6 (high): ignoring sandbox in prod breaks App Review (Paywall reads backend user.plan). Resolution: apply sandbox ENTITLEMENT in prod (self-expiring) but never grant CREDITS for sandbox (permanent/farmable) — pending owner sign-off.

### Round 2 — BLOCKED (Codex usage limit). Artifact claudex-u1k5x2vv.
Codex read the revised PLAN.md (sha c774dcc0...) + service/media/cleanup code, then turn.failed:
"You've hit your usage limit ... try again at 9:47 PM." NOT an approval, NOT a revise. Round not counted.
Plan revised per round-1's 6 findings (SUB-R1..R6) awaits re-review. Resume: same runner review --resume
<last SUCCESSFUL result> (round-1 artifact claudex-lviiyqfx/result.json) with the round-2 feedback file,
once Codex usage resets. Owner sign-off on SUB-R6 (sandbox entitlement-yes / credits-no split) still pending.

### Round 2 — Codex REVISE (artifact claudex-nm5i8gv5). SUB-R1..R5 addressed at design level. New finding:
- SUB-R7 (high): sandbox + production events write the same Subscription row + single lastEventAt, no
  env partition. A sandbox purchase on an account with an active PRODUCTION sub can overwrite/downgrade
  the real entitlement (newer sandbox ts wins). ACCEPTED. Fix: partition per-env state + watermarks,
  production precedence, sandbox never overrides active production entitlement.

### Round 3 — Codex REVISE (artifact claudex-n558ur72). SUB-R7 resolved. New finding:
- SUB-R8 (med): single entitlement snapshot discards valid sandbox access when prod is active; if prod
  then expires shortly after, sandbox access is lost. ACCEPTED. Fix: dual snapshot — persist each env's
  entitlement (plan+expiry) separately + its watermark; getEffectivePlan = active-prod else active-sandbox
  else FREE. (Affects only accounts with concurrent prod+sandbox = testers; adopting the correct model anyway.)

### Round 4 — Codex REVISE (artifact claudex-d8113s89). SUB-R7/R8 resolved. New finding:
- SUB-R9 (high): existing Subscription.plan/expiresAt/store/productId are NOT NULL; a sandbox-only first
  purchase can't insert a row with only sandbox fields. ACCEPTED. Fix: make the production-snapshot
  columns nullable (Prisma optional + migration ALTER DROP NOT NULL); getEffectivePlan already guards
  null prod fields. (Round 5 next — loop cap.)

### Round 5 — Codex APPROVED (artifact claudex-g9i1dzvh). SUB-R1..R9 resolved at design level.
Approval bound to PLAN.md sha256=e827becb400e9ddd7c40c27602bbfe7fd558d6ba758ba28e1c477089a901b28e. Covers the plan, not implemented/tested code.
Phase 3: builder=Claude (host). Will build + local dev migration + runnable check, then FRESH Codex
inspection of the diff. PAUSE before prod migrate/deploy (outward/irreversible — needs owner go).

## Phase 3 — Build (builder=Claude) + fresh-Codex inspection (base 2e71fdd)
Built: prisma schema (nullable prod fields + sandbox snapshot + ProcessedTransaction) + idempotent migration
(applied to dev via db execute — a pre-existing unrelated failed migration `quizattempt_add_topic` blocks
`migrate deploy` on dev; PROD deploy must resolve that first). Rewrote subscriptions.service (dual-snapshot
webhook, withUserLock, reconcileEntitlement, ON CONFLICT ledger); removed /verify (controller/route/dto);
media.uploadFile + credits.maintainStreakFreezes expiry-aware; frontend api/types/sync cleanup.

### Inspection round 1 (artifact claudex-k87h2zf7) — REVISE:
- SUB-I1 (high): media read effPlan before the lock (TOCTOU vs EXPIRATION). FIXED — read Subscription inside
  the locked upload tx via withUserLock + reconcileEntitlement.
- SUB-I2 (med): EXPIRATION-before-purchase -> update on null row -> P2025 rollback. FIXED — upsert terminal events.
- SUB-I3 (med): upload reconciled only the new file's retention. FIXED — reconcileEntitlement in the locked tx
  sets existing null-expiry files' 30-day deadline too.
Re-verified: 4/4 runnable checks (I2 no-throw + watermark; I3 existing file dated).

### Inspection round 2 (artifact claudex-2q90bi7i) — REVISE (inspection budget = 2, now exhausted):
- SUB-I4 (med): missing/unknown environment treated as PROD; missing ts -> now(). FIXED — validate
  environment in {PRODUCTION,SANDBOX} + finite event_timestamp_ms before any effect; malformed -> ignored
  (event.id still recorded). Verified 5/5.
- SUB-I6 (med, FE): verify-on-open didn't reconcile (me() returns cached plan). FIXED — useSubscriptionSync
  now calls /status (server reconciles) before authApi.me().
- SUB-I7 (low, FE): dead VerifyPurchase* types. FIXED — removed.
- SUB-I5 (med): retention depends on upload/webhook/status; a lapsed user who never opens the app AND whose
  RC EXPIRATION never lands keeps null-expiry media. ACCEPTED-WITH-RATIONALE (host): natural expiry is
  covered by the RC EXPIRATION webhook + verify-on-open (now reconciling); the fix is a NEW periodic
  reconcile cron = scope expansion. Documented follow-up, not built in this pass.

NOTE: I4/I6/I7 fixes + I5 disposition are POST inspection-budget — verified by tsc (both ends) + runnable
checks, but NOT re-inspected by Codex. Reported to owner for decision (one more inspection vs accept).
Nothing deployed. Prod migration + deploy pending owner go.

### Inspection round 3 (FINAL, artifact claudex-rhswurzk) — REVISE, both fixed:
- SUB-REVIEW-01 (high): TRANSFER ignored + originalTransactionId @unique collision swallowed a new
  owner's purchase (P2002). FIXED — dropped the vestigial unique (migration) + TRANSFER downgrades
  prior owners. Verified 5/5 (shared origTxnId both apply; A downgraded, B stays PRO).
- SUB-REVIEW-02 (med): natural-expiry retention. FIXED — mediaCleanup now reconciles lapsed-user
  null-expiry media (durable, webhook/upload-independent).
(These + I4/I6/I7 were past the 2-round inspection budget; self-verified via tsc + runnable checks.)

## DEPLOYED to prod 2026-09-16 (commit f32e5f5)
Prod DB migrated via psql/db execute (idempotent): 4 new Subscription cols + ProcessedTransaction +
prod cols nullable + originalTransactionId unique dropped (verified). Server Prisma client regenerated
from new schema; dist scp'd (subscriptions/*, media, credits, jobs/mediaCleanup); dead
subscriptions.dto.js removed; pm2 restart; health OK; process online, no new errors. NOTE: pre-existing
unrelated failed dev migration quizattempt_add_topic still blocks `migrate deploy` (dev only; prod
applied directly). IAP still not live (no shared secret/products) — safe margin remains.
