import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError, NotFoundError } from '../../utils/errors';
import { PLAN_BENEFITS } from '../../config/plans';
import { getEffectivePlan, reconcileEntitlement, withUserLock } from '../subscriptions/subscriptions.service';
import type { ListMediaDtoType } from './media.dto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export async function uploadFile(userId: string, file: Express.Multer.File) {
  const isPdf   = file.mimetype === 'application/pdf';
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

  if (!isPdf && !isImage) {
    throw new AppError('Unsupported file type', 400, 'INVALID_FILE_TYPE');
  }

  let buffer: Buffer;
  let mimeType: string;
  let ext: string;
  let finalSize: number;

  if (isPdf) {
    // PDF spec: %PDF marker must appear within first 1024 bytes
    const header = file.buffer.subarray(0, 1024).toString('latin1');
    if (!header.includes('%PDF')) {
      throw new AppError('File is not a valid PDF', 400, 'INVALID_FILE');
    }
    buffer    = file.buffer;
    mimeType  = 'application/pdf';
    ext       = 'pdf';
    finalSize = file.size;
  } else {
    // Compress + convert image to WebP
    try {
      buffer = await sharp(file.buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new AppError('Could not process image. The file may be corrupted or in an unsupported format.', 400, 'INVALID_FILE');
    }
    mimeType  = 'image/webp';
    ext       = 'webp';
    finalSize = buffer.length;
  }

  // Quota + retention are based on the EFFECTIVE (expiry-aware) plan, not the cached User.plan/limit
  // mirror (SUB-R4/R5): a naturally-lapsed PRO reads as FREE here even before getStatus reconciles.
  const effPlan = await getEffectivePlan(userId);
  const effLimit = BigInt(PLAN_BENEFITS[effPlan].storageBytes);

  // Fast pre-check: not atomic — the real enforcement is the conditional UPDATE below.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.storageUsed + BigInt(finalSize) > effLimit) {
    throw new AppError(
      `Storage quota exceeded. You have ${formatBytes(Number(effLimit - user.storageUsed))} remaining.`,
      413,
      'QUOTA_EXCEEDED',
    );
  }

  const uuid        = randomUUID();
  const baseName    = file.originalname.replace(/\.[^.]+$/, '');
  const displayName = `${baseName}.${ext}`;
  const subDir      = isPdf ? 'pdfs' : 'images';
  const key         = `users/${userId}/${subDir}/${uuid}.${ext}`;
  const filePath    = path.join(UPLOADS_DIR, key);
  const url         = `${env.APP_URL}/uploads/${key}`;

  // Write to disk
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  // Persist record + update quota atomically.
  // The conditional UPDATE is the real quota enforcement — closes the race window where
  // two concurrent uploads both pass the pre-check before either has incremented.
  // If the DB step fails after writing to disk, clean up the orphaned file.
  try {
    return await withUserLock(userId, async (tx) => {
      // Under the per-user lock (advisory + User FOR UPDATE), reconcile the User mirror AND existing
      // media retention to the effective entitlement — read fresh inside the tx so a concurrent
      // EXPIRATION can't be lost (SUB-I1) and existing null-expiry files get the FREE deadline too
      // (SUB-I3). Returns the authoritative effective plan; the conditional UPDATE then enforces
      // against the reconciled storageLimit (canonical User → MediaFile order).
      const eff = await reconcileEntitlement(tx, userId);

      const affected = await tx.$executeRaw`
        UPDATE "User"
        SET    "storageUsed" = "storageUsed" + ${finalSize}::bigint
        WHERE  id = ${userId}
        AND    "storageUsed" + ${finalSize}::bigint <= "storageLimit"
      `;

      if (affected === 0) {
        const fresh = await tx.user.findUnique({
          where:  { id: userId },
          select: { storageUsed: true, storageLimit: true },
        });
        const remaining = fresh ? Math.max(0, Number(fresh.storageLimit - fresh.storageUsed)) : 0;
        throw new AppError(
          `Storage quota exceeded. You have ${formatBytes(remaining)} remaining.`,
          413,
          'QUOTA_EXCEEDED',
        );
      }

      // Retention from the effective plan (free-tier files expire in 30 days; paid keep indefinitely).
      const expiresAt = eff.plan === 'FREE'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      return tx.mediaFile.create({
        data: {
          userId,
          key,
          url,
          name:      displayName,
          mimeType,
          sizeBytes: finalSize,
          type:      isPdf ? 'PDF' : 'IMAGE',
          expiresAt,
        },
      });
    });
  } catch (dbError) {
    await fs.unlink(filePath).catch(() => {});
    throw dbError;
  }
}

export async function listFiles(userId: string, dto: ListMediaDtoType) {
  return prisma.mediaFile.findMany({
    where: { userId, ...(dto.type && { type: dto.type }) },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteFile(userId: string, fileId: string) {
  const file = await prisma.mediaFile.findFirst({ where: { id: fileId, userId } });
  if (!file) throw new NotFoundError('Media file not found');

  // Disk first, so we never leave an orphaned file with no DB row. Tolerate ENOENT
  // (already gone); on any other error abort so the row stays and the delete is
  // retryable (consistent state, no silent orphan).
  const filePath = path.join(UPLOADS_DIR, file.key);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`[media] disk delete failed for key ${file.key}:`, err);
      throw new AppError('Could not delete the file from storage. Please try again.', 500, 'STORAGE_DELETE_FAILED');
    }
  }

  // Row + quota refund, clamped at 0 so storageUsed can never go negative. Refund ONLY if THIS
  // call removed the row: deleteMany({id,userId}) + count guards against a concurrent delete (a
  // double-tap, or the cleanup cron racing this) double-refunding, and the loser no longer P2025→500
  // (delete-by-id would). Refund and delete share one transaction so they commit together.
  await prisma.$transaction(async (tx) => {
    // Lock the User row first (same order as subscription activation: User → MediaFile) so a
    // concurrent plan change can't deadlock this AB-BA.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const { count } = await tx.mediaFile.deleteMany({ where: { id: fileId, userId } });
    if (count === 0) return; // already removed by a concurrent delete — nothing to refund
    await tx.$executeRaw`
      UPDATE "User"
      SET    "storageUsed" = GREATEST(0::bigint, "storageUsed" - ${file.sizeBytes}::bigint)
      WHERE  id = ${userId}
    `;
  });

  return { message: 'File deleted successfully' };
}

export async function renameFile(userId: string, fileId: string, name: string) {
  const file = await prisma.mediaFile.findFirst({ where: { id: fileId, userId } });
  if (!file) throw new NotFoundError('Media file not found');
  try {
    return await prisma.mediaFile.update({ where: { id: fileId }, data: { name } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new NotFoundError('Media file not found');
    }
    throw e;
  }
}

/** Best-effort disk cleanup of every file a user owns. Call BEFORE the DB rows are
 *  removed (e.g. account deletion) — the cascade only frees DB rows, not the bytes. */
export async function deleteUserFilesFromDisk(userId: string) {
  // Remove the user's ENTIRE upload tree (all files live under users/<id>/), not a snapshot of
  // MediaFile rows. This also removes files whose row was written by an upload racing account
  // deletion — that row is cascade-deleted, but the file would otherwise be orphaned on the public
  // /uploads route. force:true ignores a missing dir (ENOENT); any OTHER error (EACCES/I/O)
  // PROPAGATES so account deletion fails and can be retried with the DB rows still intact — never
  // silently leave a deleted user's files publicly served.
  await fs.rm(path.join(UPLOADS_DIR, 'users', userId), { recursive: true, force: true });
}

export async function getStorageUsage(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { storageUsed: true, storageLimit: true },
  });

  const used    = Number(user.storageUsed);
  const limit   = Number(user.storageLimit);
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return { used, limit, percent };
}
