import { randomUUID } from 'crypto';
import type { Plan, Store, Prisma as PrismaNS } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { PLAN_BENEFITS, getProduct, creditsForPurchase } from '../../config/plans';

// RevenueCat is the sole entitlement source (the legacy Apple-receipt /verify path was removed — the
// app purchases via the RC SDK and grants come from the webhook). See PLAN.md #20.

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ── Effective entitlement (dual per-environment snapshot, production precedence) ──
type SubSnapshot = {
  plan: Plan | null; expiresAt: Date | null;
  sandboxPlan: Plan | null; sandboxExpiresAt: Date | null;
} | null;

/** Active production wins; else active sandbox; else FREE (SUB-R7/R8). */
function effectiveFromSub(sub: SubSnapshot, now = Date.now()): { plan: Plan; expiresAt: Date | null } {
  if (sub?.plan && sub.expiresAt && sub.expiresAt.getTime() > now) return { plan: sub.plan, expiresAt: sub.expiresAt };
  if (sub?.sandboxPlan && sub.sandboxExpiresAt && sub.sandboxExpiresAt.getTime() > now) {
    return { plan: sub.sandboxPlan, expiresAt: sub.sandboxExpiresAt };
  }
  return { plan: 'FREE', expiresAt: null };
}

const SNAPSHOT_SELECT = { plan: true, expiresAt: true, sandboxPlan: true, sandboxExpiresAt: true } as const;

/**
 * Reconcile the User mirror (plan + storageLimit) and media retention to the effective entitlement.
 * MUST be called with the per-user advisory lock + User row already held by the caller's `tx`
 * (canonical User → MediaFile order). Returns the effective plan/expiry.
 */
export async function reconcileEntitlement(tx: PrismaNS.TransactionClient, userId: string, sub?: SubSnapshot) {
  const snap = sub !== undefined ? sub : await tx.subscription.findUnique({ where: { userId }, select: SNAPSHOT_SELECT });
  const eff = effectiveFromSub(snap);
  const benefits = PLAN_BENEFITS[eff.plan];
  await tx.user.update({ where: { id: userId }, data: { plan: eff.plan, storageLimit: BigInt(benefits.storageBytes) } });
  if (eff.plan !== 'FREE') {
    await tx.mediaFile.updateMany({ where: { userId }, data: { expiresAt: null } });
  } else {
    await tx.mediaFile.updateMany({ where: { userId, expiresAt: null }, data: { expiresAt: new Date(Date.now() + THIRTY_DAYS_MS) } });
  }
  return eff;
}

/** Take the per-user advisory lock + User row FOR UPDATE, then run `fn` (User → MediaFile order). */
export async function withUserLock<T>(userId: string, fn: (tx: PrismaNS.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    return fn(tx);
  });
}

// Recheck expiry — a lapsed sub reconciles to FREE (blocks new uploads over quota, never deletes).
export async function getStatus(userId: string) {
  const eff = await withUserLock(userId, (tx) => reconcileEntitlement(tx, userId));
  return { plan: eff.plan, active: eff.plan !== 'FREE', expiresAt: eff.expiresAt };
}

// Expiry-aware effective plan (SUB-5). Used by the rate limiter, media quota, and streak freezes.
export async function getEffectivePlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: SNAPSHOT_SELECT });
  return effectiveFromSub(sub).plan;
}

// ── RevenueCat webhook (sole entitlement source) ─────────────────────────────────
export interface RcWebhookEvent {
  id: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
  environment?: string; // 'PRODUCTION' | 'SANDBOX'
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  transferred_from?: string[]; // RC TRANSFER: prior owner app_user_ids losing the entitlement
  store?: string;
}

export type RcResult = { status: 'duplicate' | 'ignored' | 'applied'; detail?: string };

const RC_STORE_MAP: Record<string, Store> = { APP_STORE: 'APPLE', MAC_APP_STORE: 'APPLE', PLAY_STORE: 'GOOGLE' };
const RC_ACTIVATE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
const RC_GRANT_CREDITS = new Set(['INITIAL_PURCHASE', 'RENEWAL']); // money events only
const RC_TERMINATE = new Set(['EXPIRATION']); // SUB-R5: PAUSED does NOT revoke (access until real expiry)

/**
 * Idempotent RevenueCat webhook. `ProcessedWebhookEvent(event.id)` dedups event REPLAYS (P2002 rolls
 * the whole txn back → 'duplicate'). Distinct events for the same store transaction are deduped for
 * CREDITS by the `ProcessedTransaction(store, transactionId)` ledger (SUB-3). Per-user advisory lock
 * serializes concurrent events + getStatus (SUB-R2). Entitlement is a dual per-env snapshot with
 * production precedence (SUB-R7/R8); credits granted only for PRODUCTION in prod (SUB-R6).
 */
export async function handleRcWebhook(event: RcWebhookEvent): Promise<RcResult> {
  const userId = event.app_user_id;
  try {
    const result = await prisma.$transaction(async (tx): Promise<RcResult> => {
      await tx.processedWebhookEvent.create({ data: { id: event.id, type: event.type, appUserId: userId ?? null } });

      if (!userId) return { status: 'ignored', detail: 'no app_user_id' };

      // Validate trust-boundary fields BEFORE any entitlement/credit effect (SUB-I4): an unknown/missing
      // environment must NOT be treated as production, and a missing/non-finite timestamp must not
      // become "now" (an undated older EXPIRATION would otherwise erase a newer renewal). The event.id
      // is already recorded above, so a malformed event won't be retried forever by RC.
      const isProd = event.environment === 'PRODUCTION';
      if (!isProd && event.environment !== 'SANDBOX') return { status: 'ignored', detail: 'invalid environment' };
      if (typeof event.event_timestamp_ms !== 'number' || !Number.isFinite(event.event_timestamp_ms)) {
        return { status: 'ignored', detail: 'invalid event_timestamp_ms' };
      }
      const ts = event.event_timestamp_ms;
      const creditsAllowed = isProd || env.NODE_ENV !== 'production';

      // Canonical order: advisory lock → User FOR UPDATE → (Subscription/MediaFile) — matches media audit.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      const userRows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      if (!userRows.length) return { status: 'ignored', detail: 'unknown user' };

      const sub = await tx.subscription.findUnique({ where: { userId } });

      if (RC_TERMINATE.has(event.type)) {
        // Clear ONLY the terminating environment's snapshot, if this event is newer than its watermark.
        // Upsert (not update): an EXPIRATION delivered before any purchase has no row yet — SUB-I2.
        if (isProd) {
          if (ts > (sub?.lastProdEventAt?.getTime() ?? -Infinity)) {
            await tx.subscription.upsert({
              where: { userId },
              create: { userId, lastProdEventAt: new Date(ts) },
              update: { plan: null, store: null, productId: null, expiresAt: null, lastProdEventAt: new Date(ts) },
            });
          }
        } else if (ts > (sub?.lastSandboxEventAt?.getTime() ?? -Infinity)) {
          await tx.subscription.upsert({
            where: { userId },
            create: { userId, lastSandboxEventAt: new Date(ts) },
            update: { sandboxPlan: null, sandboxExpiresAt: null, lastSandboxEventAt: new Date(ts) },
          });
        }
        await reconcileEntitlement(tx, userId);
        return { status: 'applied', detail: `expired (${isProd ? 'prod' : 'sandbox'})` };
      }

      if (RC_ACTIVATE.has(event.type)) {
        const def = event.product_id ? getProduct(event.product_id) : undefined;
        const store = event.store ? RC_STORE_MAP[event.store] : undefined;
        if (!def || !store || !event.expiration_at_ms) return { status: 'ignored', detail: 'unmapped product/store/expiry' };
        const expiresAt = new Date(event.expiration_at_ms);

        // ── Money (decoupled from entitlement ordering, SUB-R3): grant credits iff this store
        //    transaction is newly ledgered, regardless of event order. ──
        let creditNote = 'no credits';
        if (RC_GRANT_CREDITS.has(event.type) && creditsAllowed && event.transaction_id) {
          const inserted = await tx.$queryRaw<{ id: string }[]>`
            INSERT INTO "ProcessedTransaction" ("id", "store", "transactionId", "userId")
            VALUES (${randomUUID()}, ${store}::"Store", ${event.transaction_id}, ${userId})
            ON CONFLICT ("store", "transactionId") DO NOTHING
            RETURNING id`;
          if (inserted.length > 0) {
            const credits = creditsForPurchase(def);
            await tx.user.update({ where: { id: userId }, data: { creditBalance: { increment: credits } } });
            await tx.creditTransaction.create({ data: { userId, type: 'PURCHASE', amount: credits, description: `${def.plan} ${def.period} subscription` } });
            creditNote = `+${credits} credits`;
          } else {
            creditNote = 'credits already granted';
          }
        }

        // ── Entitlement (ordered per environment; production precedence via effectiveFromSub) ──
        let entNote = 'entitlement stale (skipped)';
        if (isProd) {
          if (ts > (sub?.lastProdEventAt?.getTime() ?? -Infinity)) {
            await tx.subscription.upsert({
              where: { userId },
              create: { userId, plan: def.plan, store, productId: def.productId, expiresAt, lastProdEventAt: new Date(ts), rcAppUserId: userId, originalTransactionId: event.original_transaction_id ?? null, lastTransactionId: event.transaction_id ?? null },
              update: { plan: def.plan, store, productId: def.productId, expiresAt, lastProdEventAt: new Date(ts), rcAppUserId: userId, lastTransactionId: event.transaction_id ?? null },
            });
            entNote = 'prod entitlement applied';
          }
        } else if (ts > (sub?.lastSandboxEventAt?.getTime() ?? -Infinity)) {
          await tx.subscription.upsert({
            where: { userId },
            create: { userId, sandboxPlan: def.plan, sandboxExpiresAt: expiresAt, lastSandboxEventAt: new Date(ts), rcAppUserId: userId },
            update: { sandboxPlan: def.plan, sandboxExpiresAt: expiresAt, lastSandboxEventAt: new Date(ts), rcAppUserId: userId },
          });
          entNote = 'sandbox entitlement applied';
        }

        await reconcileEntitlement(tx, userId);
        return { status: 'applied', detail: `${event.type} ${def.plan} [${isProd ? 'prod' : 'sandbox'}] ${entNote}, ${creditNote}` };
      }

      // CANCELLATION (access until expiry), BILLING_ISSUE (grace), SUBSCRIPTION_PAUSED, TEST … — recorded only.
      return { status: 'ignored', detail: event.type };
    });

    // SUB-REVIEW-01: on a TRANSFER (restore into another account), the PRIOR owners lose the
    // entitlement. Runs only after the dedup txn commits (a replay throws P2002 → 'duplicate' above,
    // skipping this). The new owner (app_user_id) keeps their own sub — its events apply normally now
    // that originalTransactionId is no longer unique.
    if (event.type === 'TRANSFER' && Array.isArray(event.transferred_from)) {
      for (const fromId of event.transferred_from) {
        await withUserLock(fromId, async (tx) => {
          await tx.subscription.updateMany({
            where: { userId: fromId },
            data: { plan: null, store: null, productId: null, expiresAt: null, sandboxPlan: null, sandboxExpiresAt: null },
          });
          await reconcileEntitlement(tx, fromId);
        }).catch(() => { /* a missing/racing from-user is non-fatal */ });
      }
    }

    return result;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { status: 'duplicate' };
    throw e;
  }
}
