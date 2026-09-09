import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { PLAN_BENEFITS } from '../config/plans';
import { getEffectivePlan } from '../modules/subscriptions/subscriptions.service';
import { verifyAccessToken } from '../utils/jwt';

// Key by user id when a valid Bearer token is present, else by IP. This runs as a
// global limiter (before authMiddleware), so we decode the token here ourselves;
// keying per-user stops shared-NAT/carrier users from splitting one IP budget.
function userOrIpKey(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      return `user:${verifyAccessToken(authHeader.substring(7)).userId}`;
    } catch {
      // invalid/expired token → fall back to IP
    }
  }
  return req.ip ?? 'anon';
}

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // 1000/15min (~66/min) per user (or per IP when unauthenticated). A React-Query
  // app fires many reads per screen + refetches after staleTime; 100 was hit in one
  // active session.
  max: 1000,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many requests, please try again later.',
    error: { code: 'RATE_LIMIT_EXCEEDED', details: null },
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many authentication attempts, please try again later.',
    error: { code: 'RATE_LIMIT_EXCEEDED', details: null },
  },
});

// Per-tier AI limit: keyed by user, ceiling from the caller's plan (FREE 30 / STARTER 60 / PRO 120).
// Runs after authMiddleware, so req.user.id is set. One indexed sub lookup per request.
export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  limit: async (req) => {
    if (!req.user?.id) return PLAN_BENEFITS.FREE.aiPerHour;
    const plan = await getEffectivePlan(req.user.id);
    return PLAN_BENEFITS[plan].aiPerHour;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many AI requests, please try again later.',
    error: { code: 'RATE_LIMIT_EXCEEDED', details: null },
  },
});
