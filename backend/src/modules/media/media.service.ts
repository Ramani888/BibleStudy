import { randomUUID } from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { prisma } from '../../config/db';
import { s3, S3_BUCKET, S3_BASE_URL } from '../../config/s3.client';
import { AppError, NotFoundError } from '../../utils/errors';
import type { ListMediaDtoType } from './media.dto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

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
    buffer    = await sharp(file.buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    mimeType  = 'image/webp';
    ext       = 'webp';
    finalSize = buffer.length;
  }

  // Fast pre-check: avoids S3 upload cost when quota is clearly exceeded.
  // Not atomic — the real enforcement is the conditional UPDATE inside the transaction below.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.storageUsed + BigInt(finalSize) > user.storageLimit) {
    throw new AppError(
      `Storage quota exceeded. You have ${formatBytes(Number(user.storageLimit - user.storageUsed))} remaining.`,
      413,
      'QUOTA_EXCEEDED',
    );
  }

  const uuid         = randomUUID();
  const baseName     = file.originalname.replace(/\.[^.]+$/, ''); // strip original extension
  const displayName  = `${baseName}.${ext}`;                       // reflect actual stored format
  const key          = isPdf
    ? `users/${userId}/pdfs/${uuid}.${ext}`
    : `users/${userId}/images/${uuid}.${ext}`;
  const url          = `${S3_BASE_URL}/${key}`;

  // Upload to Hetzner Object Storage
  await s3.send(new PutObjectCommand({
    Bucket:      S3_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
    ACL:         'public-read' as const,
  }));

  // Persist record + update quota atomically.
  // The conditional UPDATE is the real quota enforcement — it only increments storageUsed
  // if the post-upload total still fits within the limit, closing the race window where
  // two concurrent uploads could both pass the pre-check before either has incremented.
  // If the DB step fails for any reason after a successful S3 upload, clean up the orphaned file.
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

      return tx.mediaFile.create({
        data: {
          userId,
          key,
          url,
          name:      displayName,
          mimeType,
          sizeBytes: finalSize,
          type:      isPdf ? 'PDF' : 'IMAGE',
        },
      });
    });
  } catch (dbError) {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key })).catch(() => {});
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

  // DB transaction first — if this fails the S3 file is untouched (consistent state).
  await prisma.$transaction([
    prisma.mediaFile.delete({ where: { id: fileId } }),
    prisma.user.update({
      where: { id: userId },
      data:  { storageUsed: { decrement: file.sizeBytes } },
    }),
  ]);

  // S3 after DB — if S3 delete fails the file is orphaned in storage but is removed from
  // the user's listing. DB state is the source of truth; don't surface this error.
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: file.key })).catch(err => {
    console.error(`[media] S3 delete failed for key ${file.key}:`, err);
  });

  return { message: 'File deleted successfully' };
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
