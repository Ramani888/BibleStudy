import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/db';
import { getEffectivePlan } from '../modules/subscriptions/subscriptions.service';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// SUB-REVIEW-02: durable retention reconcile. A user whose subscription lapses naturally but who never
// opens the app (no verify-on-open) and whose RC EXPIRATION webhook is missed would keep null-expiry
// (paid) media forever. Give any null-expiry file owned by an effectively-FREE user the 30-day deadline,
// independent of uploads/webhooks — so mediaCleanup can then age it out.
async function reconcileLapsedRetention() {
  const rows = await prisma.mediaFile.findMany({ where: { expiresAt: null }, distinct: ['userId'], select: { userId: true } });
  for (const { userId } of rows) {
    if ((await getEffectivePlan(userId)) !== 'FREE') continue; // still entitled → keep indefinitely
    await prisma.mediaFile.updateMany({ where: { userId, expiresAt: null }, data: { expiresAt: new Date(Date.now() + THIRTY_DAYS_MS) } });
  }
}

async function deleteExpiredMedia() {
  await reconcileLapsedRetention(); // date any lapsed-user null-expiry media first, then sweep
  const expired = await prisma.mediaFile.findMany({
    where: { expiresAt: { lte: new Date() } },
  });

  if (expired.length === 0) return;
  console.log(`[mediaCleanup] deleting ${expired.length} expired file(s)`);

  for (const file of expired) {
    try {
      // DB first, conditional on the row STILL being expired. A subscription upgrade can set
      // expiresAt=null (retention extended) between our snapshot above and now; deleteMany with the
      // `expiresAt <= now` predicate and the upgrade's updateMany contend for the same row lock, so
      // whichever commits first wins — we NEVER delete a file whose retention was just extended.
      // count===0 → extended (or already gone): leave the file entirely, don't touch disk.
      const deleted = await prisma.$transaction(async (tx) => {
        // Lock the User row FIRST. Subscription activation locks User (user.update) then MediaFile
        // (updateMany); acquiring MediaFile before User here would deadlock AB-BA. This matches its
        // order (User → MediaFile), so the two serialize on the User lock instead.
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${file.userId} FOR UPDATE`;
        const { count } = await tx.mediaFile.deleteMany({
          where: { id: file.id, expiresAt: { lte: new Date() } },
        });
        if (count === 0) return false;
        await tx.$executeRaw`
          UPDATE "User"
          SET    "storageUsed" = GREATEST(0::bigint, "storageUsed" - ${file.sizeBytes}::bigint)
          WHERE  id = ${file.userId}
        `;
        return true;
      });
      if (!deleted) continue;

      // Row is gone → remove the bytes. ENOENT is fine. A rare non-ENOENT failure leaves an orphaned
      // (already-expired) file on disk — log it; the cron can't retry (row is gone). This is the
      // deliberate inverse of the old disk-first order: preventing paid-user data loss (an upgrade
      // racing the delete) outweighs a rare orphaned expired file.
      try {
        await fs.unlink(path.join(UPLOADS_DIR, file.key));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`[mediaCleanup] row deleted but disk unlink failed for ${file.key} (orphaned expired file):`, err);
        }
      }
    } catch (err) {
      console.error(`[mediaCleanup] failed to delete file ${file.id}:`, err);
    }
  }

  console.log('[mediaCleanup] done');
}

export function startMediaCleanupJob() {
  // Runs at 02:00 every day server time.
  cron.schedule('0 2 * * *', () => {
    deleteExpiredMedia().catch(err =>
      console.error('[mediaCleanup] job error:', err),
    );
  });
  console.log('[mediaCleanup] scheduled daily at 02:00');
}
