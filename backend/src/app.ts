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

const app = express();

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/folders', foldersRoutes);
app.use('/api/v1/sets', setsRoutes);
app.use('/api/v1/cards', cardsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/credits', creditsRoutes);

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
