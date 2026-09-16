-- Immutable redemption marker. Unlike referredById (SetNull on referrer deletion),
-- this is never cleared, so it is the durable idempotency key for referral redemption.
-- IF NOT EXISTS: the referral base columns (referralCode/referredById) predate tracked
-- migration history (added via db push), so this migration is written to be safe/idempotent
-- on both the live DB (columns present) and a fresh rebuild (referral schema absent).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralRedeemedAt" TIMESTAMP(3);

-- Backfill (REF-001): switching the redemption guard from referredById to this marker
-- would otherwise let every EXISTING redeemer redeem again on deploy. Stamp existing
-- redeemers from the durable redeemer-side ledger row (survives referrer deletion).
-- CreditTransaction always exists, so this runs unconditionally.
UPDATE "User" u
SET "referralRedeemedAt" = ct."firstRedeem"
FROM (
  SELECT "userId", MIN("createdAt") AS "firstRedeem"
  FROM "CreditTransaction"
  WHERE "type" = 'REWARD' AND "description" = 'Referral reward (used a code)'
  GROUP BY "userId"
) ct
WHERE u."id" = ct."userId" AND u."referralRedeemedAt" IS NULL;

-- Relation-only fallback: referredById set but no ledger row (legacy rows).
-- Guarded (REF-003): referredById may not exist on a fresh DB where the referral base
-- schema was never migrated; skip rather than crash the deploy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'referredById'
  ) THEN
    UPDATE "User"
    SET "referralRedeemedAt" = "createdAt"
    WHERE "referredById" IS NOT NULL AND "referralRedeemedAt" IS NULL;
  END IF;
END $$;
