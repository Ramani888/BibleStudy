-- Subscriptions entitlement hardening (#20). Idempotent (safe against db-push drift).

-- SUB-R9: production-snapshot columns become nullable (sandbox-only / not-yet-purchased rows).
ALTER TABLE "Subscription" ALTER COLUMN "plan" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "store" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "expiresAt" DROP NOT NULL;

-- SUB-4 / SUB-R7 / SUB-R8: per-environment watermarks + sandbox entitlement snapshot.
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastProdEventAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sandboxPlan" "Plan";
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sandboxExpiresAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "lastSandboxEventAt" TIMESTAMP(3);

-- SUB-REVIEW-01: drop the vestigial unique on originalTransactionId (transfers move it between users;
-- dedup is via ProcessedWebhookEvent.id + ProcessedTransaction). Idempotent.
DROP INDEX IF EXISTS "Subscription_originalTransactionId_key";

-- SUB-3: durable per-transaction credit ledger.
CREATE TABLE IF NOT EXISTS "ProcessedTransaction" (
    "id" TEXT NOT NULL,
    "store" "Store" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedTransaction_store_transactionId_key" ON "ProcessedTransaction"("store", "transactionId");
CREATE INDEX IF NOT EXISTS "ProcessedTransaction_userId_idx" ON "ProcessedTransaction"("userId");
