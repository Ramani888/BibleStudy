-- Add expiresAt to MediaFile for free-tier 30-day auto-expiry
ALTER TABLE "MediaFile" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Index for the nightly cleanup job query
CREATE INDEX "MediaFile_expiresAt_idx" ON "MediaFile"("expiresAt");

-- Backfill: existing FREE user files expire 30 days from today
UPDATE "MediaFile" mf
SET    "expiresAt" = NOW() + INTERVAL '30 days'
FROM   "User" u
WHERE  mf."userId" = u.id
AND    u.plan = 'FREE';
