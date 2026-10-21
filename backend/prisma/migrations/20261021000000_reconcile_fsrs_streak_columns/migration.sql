-- Reconcile migration history with the live schema (sequel to
-- 20260917000000_reconcile_base_schema, same cause, different columns).
--
-- The FSRS scheduling columns on Card and the streak-freeze / FSRS opt-in columns
-- on User were introduced via `prisma db push` during the quiz+engine sprint, so no
-- migration ever created them. schema.prisma has them and the code reads them, but a
-- DB built from migrations alone does not — `prisma migrate deploy` on a fresh
-- environment produced a schema where even POST /api/v1/auth/register failed with
--   The column `User.streakFreezes` does not exist in the current database.
-- (reproduced 2026-10-21 bringing the Windows dev box up from scratch).
--
-- IF NOT EXISTS throughout: prod and existing dev DBs already carry these columns
-- from the db push, so this must be a no-op there and a real create on a rebuild.
-- Defaults match schema.prisma exactly, so existing rows need no backfill:
-- counters start at 0, optional FSRS memory state stays NULL until first review,
-- and useFsrs is opt-in (false).

-- Card: FSRS (ts-fsrs) scheduling state. Coexists with the legacy SM-2 columns
-- (interval / ease / nextReviewAt); which one drives scheduling is per-user useFsrs.
ALTER TABLE "Card"
  ADD COLUMN IF NOT EXISTS "fsrsStability"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "fsrsDifficulty"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "fsrsReps"          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fsrsLapses"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fsrsState"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fsrsLearningSteps" INTEGER NOT NULL DEFAULT 0;

-- User: streak-freeze balance + the milestone already rewarded (so a milestone
-- grants once), and the per-user FSRS opt-in. StreakFreezeLog itself was already
-- reconciled in 20260917000000_reconcile_base_schema.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "streakFreezes"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streakFreezeMilestone" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "useFsrs"               BOOLEAN NOT NULL DEFAULT false;
