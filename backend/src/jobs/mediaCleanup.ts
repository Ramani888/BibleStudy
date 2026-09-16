import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/db';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function deleteExpiredMedia() {
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
