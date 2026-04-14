import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { generalRateLimit } from './middlewares/rateLimit.middleware';
import { sendError } from './utils/response';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import foldersRoutes from './modules/folders/folders.routes';
import setsRoutes from './modules/sets/sets.routes';
import cardsRoutes from './modules/cards/cards.routes';
import aiRoutes from './modules/ai/ai.routes';
import creditsRoutes from './modules/credits/credits.routes';
import friendsRoutes from './modules/friends/friends.routes';
import groupsRoutes from './modules/groups/groups.routes';
import gatheringsRoutes from './modules/gatherings/gatherings.routes';
import mapRoutes from './modules/map/map.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

const app = express();

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
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limit
app.use(generalRateLimit);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'BibleStudy Pro API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
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
app.use('/api/v1/groups',      groupsRoutes);
app.use('/api/v1/gatherings',  gatheringsRoutes);
app.use('/api/v1/map',         mapRoutes);
app.use('/api/v1/activities',      activitiesRoutes);
app.use('/api/v1/notifications',   notificationsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404, 'NOT_FOUND');
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    'INTERNAL_ERROR'
  );
});

export default app;
