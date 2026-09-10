import type { Plan, Store } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { PLAN_BENEFITS, getProduct, creditsForPurchase, type ProductDef } from '../../config/plans';
import type { VerifyPurchaseDtoType } from './subscriptions.dto';

interface Verification {
  expiresAt: Date;
  originalTransactionId: string;
  latestTransactionId: string;
}

const APPLE_PROD = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

// ── Apple receipt verification (legacy verifyReceipt; simplest, no dep) ─────────
async function verifyApple(receipt: string, productId: string): Promise<Verification> {
  if (!env.APPLE_IAP_SHARED_SECRET) throw new AppError('Apple IAP not configured', 503, 'IAP_NOT_CONFIGURED');

  const call = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        password: env.APPLE_IAP_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    });
    return res.json() as Promise<any>;
  };

  // Prod first; 21007 means the receipt is from the sandbox → retry there.
  let body = await call(APPLE_PROD);
  if (body.status === 21007) body = await call(APPLE_SANDBOX);
  if (body.status !== 0) throw new AppError(`Apple receipt invalid (status ${body.status})`, 400, 'RECEIPT_INVALID');

  const infos: any[] = body.latest_receipt_info ?? [];
  // Latest renewal for this product = highest expires_date_ms.
  const latest = infos
    .filter(i => i.product_id === productId)
    .sort((a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms))[0];
  if (!latest) throw new AppError('No matching purchase in receipt', 400, 'RECEIPT_NO_MATCH');

  return {
    expiresAt: new Date(Number(latest.expires_date_ms)),
    originalTransactionId: latest.original_transaction_id,
    latestTransactionId: latest.transaction_id,
  };
}

// ponytail: guarded stub — implement with google-auth + Play Developer API once Play
// credentials (GOOGLE_PLAY_SA_JSON) and store products exist. iPhone is the launch device.
async function verifyGoogle(_receipt: string, _productId: string): Promise<Verification> {
  throw new AppError('Google Play verification not configured yet', 503, 'IAP_NOT_CONFIGURED');
}

// ── Entitlement application (idempotent credit grant) ───────────────────────────
async function applyEntitlement(userId: string, store: Store, def: ProductDef, v: Verification) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  // Grant credits only when this is a transaction we haven't processed (new purchase or renewal).
  const isNewTransaction = !existing || existing.lastTransactionId !== v.latestTransactionId;
  const benefits = PLAN_BENEFITS[def.plan];

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { userId },
      create: {
        userId, plan: def.plan, store, productId: def.productId,
        expiresAt: v.expiresAt, originalTransactionId: v.originalTransactionId, lastTransactionId: v.latestTransactionId,
      },
      update: { plan: def.plan, productId: def.productId, expiresAt: v.expiresAt, lastTransactionId: v.latestTransactionId },
    });
    await tx.user.update({
      where: { id: userId },
      data: { plan: def.plan, storageLimit: BigInt(benefits.storageBytes) },
    });
    // Clear expiry on all files — paid users keep their media indefinitely.
    await tx.mediaFile.updateMany({
      where: { userId },
      data:  { expiresAt: null },
    });
    if (isNewTransaction) {
      const credits = creditsForPurchase(def);
      await tx.user.update({ where: { id: userId }, data: { creditBalance: { increment: credits } } });
      await tx.creditTransaction.create({
        data: { userId, type: 'PURCHASE', amount: credits, description: `${def.plan} ${def.period} subscription` },
      });
    }
  });

  return isNewTransaction;
}

export async function verifyPurchase(userId: string, dto: VerifyPurchaseDtoType) {
  const def = getProduct(dto.productId);
  if (!def) throw new AppError('Unknown product', 400, 'UNKNOWN_PRODUCT');

  const v = dto.platform === 'APPLE'
    ? await verifyApple(dto.receipt, dto.productId)
    : await verifyGoogle(dto.receipt, dto.productId);

  const granted = await applyEntitlement(userId, dto.platform, def, v);
  const active = v.expiresAt.getTime() > Date.now();
  return { plan: def.plan, active, expiresAt: v.expiresAt, granted };
}

// Recheck expiry — lapsed subs downgrade to FREE (blocks new uploads over quota, never deletes).
export async function getStatus(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return { plan: 'FREE' as Plan, active: false, expiresAt: null };

  const active = sub.expiresAt.getTime() > Date.now();
  if (!active) {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data:  { plan: 'FREE', storageLimit: BigInt(PLAN_BENEFITS.FREE.storageBytes) },
      }),
      // Start 30-day clock on files that don't already have one.
      prisma.mediaFile.updateMany({
        where: { userId, expiresAt: null },
        data:  { expiresAt: thirtyDays },
      }),
    ]);
    return { plan: 'FREE' as Plan, active: false, expiresAt: sub.expiresAt };
  }
  return { plan: sub.plan, active: true, expiresAt: sub.expiresAt };
}

// Cheap plan lookup for the per-tier rate limiter (treats lapsed subs as FREE).
export async function getEffectivePlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, expiresAt: true },
  });
  if (!sub || sub.expiresAt.getTime() <= Date.now()) return 'FREE';
  return sub.plan;
}

// ── RevenueCat webhook (source of truth for entitlements once migrated) ──────────
export interface RcWebhookEvent {
  id: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  store?: string;
}

export type RcResult = { status: 'duplicate' | 'ignored' | 'applied'; detail?: string };

// RC store → our Store enum (we only sell on Apple/Google).
const RC_STORE_MAP: Record<string, Store> = { APP_STORE: 'APPLE', MAC_APP_STORE: 'APPLE', PLAY_STORE: 'GOOGLE' };
const RC_ACTIVATE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
const RC_GRANT_CREDITS = new Set(['INITIAL_PURCHASE', 'RENEWAL']); // money events only
const RC_TERMINATE = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

/**
 * Idempotent RevenueCat webhook handler. Reuses the same grant/downgrade logic as the
 * legacy receipt path, but keyed on RC event.id (RC retries on non-2xx). The ProcessedWebhookEvent
 * insert is the dedupe guard — a replayed event.id hits the @id unique constraint (P2002) and the
 * whole transaction rolls back, so nothing is granted twice.
 */
export async function handleRcWebhook(event: RcWebhookEvent): Promise<RcResult> {
  const userId = event.app_user_id;
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.processedWebhookEvent.create({ data: { id: event.id, type: event.type, appUserId: userId ?? null } });

      if (!userId) return { status: 'ignored', detail: 'no app_user_id' };
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) return { status: 'ignored', detail: 'unknown user' };

      if (RC_TERMINATE.has(event.type)) {
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await tx.user.update({ where: { id: userId }, data: { plan: 'FREE', storageLimit: BigInt(PLAN_BENEFITS.FREE.storageBytes) } });
        await tx.mediaFile.updateMany({ where: { userId, expiresAt: null }, data: { expiresAt: thirtyDays } });
        return { status: 'applied', detail: `downgraded (${event.type})` };
      }

      if (RC_ACTIVATE.has(event.type)) {
        const def = event.product_id ? getProduct(event.product_id) : undefined;
        const store = event.store ? RC_STORE_MAP[event.store] : undefined;
        if (!def || !store || !event.expiration_at_ms) return { status: 'ignored', detail: 'unmapped product/store/expiry' };
        const expiresAt = new Date(event.expiration_at_ms);
        const benefits = PLAN_BENEFITS[def.plan];

        await tx.subscription.upsert({
          where: { userId },
          create: {
            userId, plan: def.plan, store, productId: def.productId, expiresAt, rcAppUserId: userId,
            originalTransactionId: event.original_transaction_id ?? null, lastTransactionId: event.transaction_id ?? null,
          },
          update: { plan: def.plan, store, productId: def.productId, expiresAt, rcAppUserId: userId, lastTransactionId: event.transaction_id ?? null },
        });
        await tx.user.update({ where: { id: userId }, data: { plan: def.plan, storageLimit: BigInt(benefits.storageBytes) } });
        await tx.mediaFile.updateMany({ where: { userId }, data: { expiresAt: null } });

        if (RC_GRANT_CREDITS.has(event.type)) {
          const credits = creditsForPurchase(def);
          await tx.user.update({ where: { id: userId }, data: { creditBalance: { increment: credits } } });
          await tx.creditTransaction.create({ data: { userId, type: 'PURCHASE', amount: credits, description: `${def.plan} ${def.period} subscription` } });
        }
        return { status: 'applied', detail: `${event.type} ${def.plan}` };
      }

      // CANCELLATION (keep access until expiry), BILLING_ISSUE (grace), TEST, TRANSFER … — recorded only.
      return { status: 'ignored', detail: event.type };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { status: 'duplicate' };
    throw e;
  }
}
