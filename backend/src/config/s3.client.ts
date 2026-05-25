import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

export const s3 = new S3Client({
  endpoint: env.HETZNER_S3_ENDPOINT,
  region: env.HETZNER_S3_REGION,
  credentials: {
    accessKeyId: env.HETZNER_S3_ACCESS_KEY,
    secretAccessKey: env.HETZNER_S3_SECRET_KEY,
  },
  forcePathStyle: false,
});

export const S3_BUCKET = env.HETZNER_S3_BUCKET;

// Derive location from endpoint: "https://nbg1.your-objectstorage.com" → "nbg1"
const s3Location = new URL(env.HETZNER_S3_ENDPOINT).hostname.split('.')[0];
if (!s3Location || s3Location === 'your-objectstorage') {
  console.error('[s3] HETZNER_S3_ENDPOINT must be in the form https://<location>.your-objectstorage.com');
  process.exit(1);
}
export const S3_BASE_URL = `https://${env.HETZNER_S3_BUCKET}.${s3Location}.your-objectstorage.com`;
