import 'express-async-errors'; // must be first — patches Express 4 async error propagation
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { prisma } from './config/db';
import { generalRateLimit } from './middlewares/rateLimit.middleware';
import { sendError } from './utils/response';
import { AppError } from './utils/errors';

// Route imports
import multer from 'multer';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import foldersRoutes from './modules/folders/folders.routes';
import setsRoutes from './modules/sets/sets.routes';
import cardsRoutes from './modules/cards/cards.routes';
import aiRoutes from './modules/ai/ai.routes';
import creditsRoutes from './modules/credits/credits.routes';
import friendsRoutes from './modules/friends/friends.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import notesRoutes from './modules/notes/notes.routes';
import mediaRoutes from './modules/media/media.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import achievementsRoutes from './modules/achievements/achievements.routes';
import plansRoutes from './modules/plans/plans.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';

const app = express();

// Trust the first reverse proxy (Caddy/Nginx) so req.ip reflects the real client IP.
// Required for rate limiting to work correctly behind a proxy.
app.set('trust proxy', 1);

// CORS
// React Native mobile apps do not send an Origin header (not a browser).
// Allow those unconditionally. Optionally restrict browser-origin requests
// to CLIENT_URL when set (useful for a future web front-end).
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile / curl / server-to-server
      if (env.CLIENT_URL && origin === env.CLIENT_URL) return callback(null, true);
      if (env.NODE_ENV === 'development') return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global rate limit
app.use(generalRateLimit);

// Health check (verifies DB connectivity)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'BibleStudy Pro API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
});

// API routes
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/users',       usersRoutes);
app.use('/api/v1/folders',     foldersRoutes);
app.use('/api/v1/sets',        setsRoutes);
app.use('/api/v1/cards',       cardsRoutes);
app.use('/api/v1/ai',          aiRoutes);
app.use('/api/v1/credits',     creditsRoutes);
app.use('/api/v1/friends',     friendsRoutes);
app.use('/api/v1/activities',      activitiesRoutes);
app.use('/api/v1/notifications',   notificationsRoutes);
app.use('/api/v1/notes',           notesRoutes);
app.use('/api/v1/media',           mediaRoutes);
app.use('/api/v1/quiz',            quizRoutes);
app.use('/api/v1/achievements',    achievementsRoutes);
app.use('/api/v1/plans',           plansRoutes);
app.use('/api/v1/subscriptions',   subscriptionsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404, 'NOT_FOUND');
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 20 MB limit' : err.message;
    sendError(res, message, 400, 'FILE_ERROR');
    return;
  }
  console.error('Unhandled error:', err);
  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_ERROR'
  );
});

export default app;
