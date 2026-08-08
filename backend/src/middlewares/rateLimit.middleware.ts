import rateLimit from 'express-rate-limit';
import { PLAN_BENEFITS } from '../config/plans';
import { getEffectivePlan } from '../modules/subscriptions/subscriptions.service';

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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
