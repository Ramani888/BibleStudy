import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  // Anthropic & Cloudinary (optional — AI chat and image upload disabled when absent)
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  // AI provider seam: 'anthropic' (default) or 'openrouter' for text chat.
  // Media always routes to Claude regardless of this setting.
  AI_PROVIDER: z.enum(['anthropic', 'openrouter']).default('anthropic'),
  AI_MODEL: z.string().optional().default(''),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  VOYAGE_API_KEY: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  EMAIL_HOST: z.string().min(1, 'EMAIL_HOST is required'),
  EMAIL_PORT: z.string().transform(Number).default('587'),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required'),
  EMAIL_PASS: z.string().min(1, 'EMAIL_PASS is required'),
  CLIENT_URL: z.string().optional().default(''),
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Social auth (optional — Google/Apple sign-in disabled when absent)
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  APPLE_BUNDLE_ID:  z.string().optional().default(''),

  // IAP subscriptions (optional — receipt verification disabled per-store when absent)
  APPLE_IAP_SHARED_SECRET: z.string().optional().default(''), // App Store Connect → app-specific shared secret
  GOOGLE_PLAY_SA_JSON:     z.string().optional().default(''), // Play service-account JSON (stringified); enables Google verify

  // Firebase (optional — push notifications disabled when absent)
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),

  // Hetzner Object Storage (required for media upload feature)
  HETZNER_S3_ENDPOINT:   z.string().min(1, 'HETZNER_S3_ENDPOINT is required'),
  HETZNER_S3_BUCKET:     z.string().min(1, 'HETZNER_S3_BUCKET is required'),
  HETZNER_S3_REGION:     z.string().min(1, 'HETZNER_S3_REGION is required'),
  HETZNER_S3_ACCESS_KEY: z.string().min(1, 'HETZNER_S3_ACCESS_KEY is required'),
  HETZNER_S3_SECRET_KEY: z.string().min(1, 'HETZNER_S3_SECRET_KEY is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
