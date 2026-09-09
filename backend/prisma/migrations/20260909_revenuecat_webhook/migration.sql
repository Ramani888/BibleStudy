-- RevenueCat migration: relax legacy transaction columns, add RC app-user link + webhook idempotency ledger.

ALTER TABLE "Subscription" ALTER COLUMN "originalTransactionId" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "lastTransactionId" DROP NOT NULL;
ALTER TABLE "Subscription" ADD COLUMN "rcAppUserId" TEXT;

CREATE TABLE "ProcessedWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "appUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedWebhookEvent_pkey" PRIMARY KEY ("id")
);
