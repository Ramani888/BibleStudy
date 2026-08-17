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
      await prisma.$transaction([
        prisma.mediaFile.delete({ where: { id: file.id } }),
        prisma.user.update({
          where: { id: file.userId },
          data:  { storageUsed: { decrement: file.sizeBytes } },
        }),
      ]);
      await fs.unlink(path.join(UPLOADS_DIR, file.key)).catch(err =>
        console.error(`[mediaCleanup] disk delete failed for ${file.key}:`, err),
      );
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
