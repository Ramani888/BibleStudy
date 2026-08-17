import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError, NotFoundError } from '../../utils/errors';
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

  // Fast pre-check: not atomic — the real enforcement is the conditional UPDATE below.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.storageUsed + BigInt(finalSize) > user.storageLimit) {
    throw new AppError(
      `Storage quota exceeded. You have ${formatBytes(Number(user.storageLimit - user.storageUsed))} remaining.`,
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
    return await prisma.$transaction(async (tx) => {
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

      const expiresAt = user.plan === 'FREE'
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

  // DB first — if this fails the file on disk is untouched (consistent state).
  await prisma.$transaction([
    prisma.mediaFile.delete({ where: { id: fileId } }),
    prisma.user.update({
      where: { id: userId },
      data:  { storageUsed: { decrement: file.sizeBytes } },
    }),
  ]);

  // Disk delete after DB — if it fails the file is orphaned but removed from listing.
  const filePath = path.join(UPLOADS_DIR, file.key);
  await fs.unlink(filePath).catch(err => {
    console.error(`[media] disk delete failed for key ${file.key}:`, err);
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
