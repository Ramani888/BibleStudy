-- Reconcile migration history with the live schema.
--
-- The referral base columns (User.referralCode / User.referredById) and the
-- StreakFreezeLog table were introduced via `prisma db push`, so no migration
-- ever created them (grep-confirmed). The live/prod DBs already have them; a
-- fresh `prisma migrate deploy` (disaster recovery / new environment) would be
-- missing them and break streak-freeze writes + referral redemption.
--
-- Every statement here is idempotent (IF NOT EXISTS / constraint guards) so it
-- is a no-op on the existing DBs and fully provisions a clean rebuild. Object
-- names match what Prisma db-push produced in prod so a later diff stays clean.

-- ── Referral base columns ──────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'User_referredById_fkey' AND conrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_referredById_fkey"
      FOREIGN KEY ("referredById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── StreakFreezeLog ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "StreakFreezeLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "date"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StreakFreezeLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StreakFreezeLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StreakFreezeLog_userId_date_key" ON "StreakFreezeLog"("userId", "date");
CREATE INDEX IF NOT EXISTS "StreakFreezeLog_userId_idx" ON "StreakFreezeLog"("userId");
