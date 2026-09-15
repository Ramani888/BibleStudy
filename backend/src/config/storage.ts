import fs from 'fs/promises';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

/**
 * Media storage seam. Two backends, chosen by env.MEDIA_STORAGE:
 *  - 'local': files on disk under ./uploads, served publicly by express.static('/uploads').
 *  - 's3'   : files in object storage (Hetzner/AWS), served via time-limited presigned URLs.
 *
 * The DB stores each file's `key`; the servable `url` is derived on read via getFileUrl()
 * (presigned + expiring in s3 mode) so private media is never permanently public.
 */

const IS_S3 = env.MEDIA_STORAGE === 's3';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Presigned GET lifetime. Long enough to view media and for Claude to fetch an
// attachment during a chat turn; the media list refetches on focus so links refresh.
const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60; // 6h

let _s3: S3Client | null = null;
function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: env.HETZNER_S3_REGION,
      endpoint: env.HETZNER_S3_ENDPOINT || undefined,
      forcePathStyle: !!env.HETZNER_S3_ENDPOINT, // path-style for non-AWS (Hetzner) endpoints
      credentials: {
        accessKeyId: env.HETZNER_S3_ACCESS_KEY,
        secretAccessKey: env.HETZNER_S3_SECRET_KEY,
      },
    });
  }
  return _s3;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (IS_S3) {
    await s3().send(new PutObjectCommand({ Bucket: env.HETZNER_S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
    return;
  }
  const filePath = path.join(UPLOADS_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body);
}

/** Delete an object. Rejects on failure so callers can decide whether to swallow. */
export async function deleteObject(key: string): Promise<void> {
  if (IS_S3) {
    await s3().send(new DeleteObjectCommand({ Bucket: env.HETZNER_S3_BUCKET, Key: key }));
    return;
  }
  await fs.unlink(path.join(UPLOADS_DIR, key));
}

/** Stable, non-expiring URL stored in the DB for record-keeping. */
export function canonicalUrl(key: string): string {
  if (!IS_S3) return `${env.APP_URL}/uploads/${key}`;
  if (env.HETZNER_S3_PUBLIC_URL) return `${env.HETZNER_S3_PUBLIC_URL}/${key}`;
  if (env.HETZNER_S3_ENDPOINT)   return `${env.HETZNER_S3_ENDPOINT}/${env.HETZNER_S3_BUCKET}/${key}`;
  return key;
}

/** Servable URL returned to clients: presigned (expiring) in s3, static in local. */
export async function getFileUrl(key: string): Promise<string> {
  if (!IS_S3) return `${env.APP_URL}/uploads/${key}`;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.HETZNER_S3_BUCKET, Key: key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
