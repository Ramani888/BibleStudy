import type { Plan, Store } from '@prisma/client';
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
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'FREE', storageLimit: BigInt(PLAN_BENEFITS.FREE.storageBytes) },
    });
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
