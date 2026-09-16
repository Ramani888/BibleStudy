import { Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { env } from '../config/env';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code = 'ERROR',
  details: unknown = null
): void => {
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: { code, details },
  });
};

export function handleControllerError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  // Invalid input parsed inline in a controller (e.g. Dto.parse(req.query)) → 400, not 500.
  if (error instanceof ZodError) {
    sendError(res, error.issues[0]?.message ?? 'Invalid request', 400, 'VALIDATION_ERROR');
    return;
  }
  // Unexpected error: log server-side, but never return a raw error message (e.g. a Prisma
  // diagnostic exposing query/column internals) to the client in production.
  console.error('Unhandled controller error:', error);
  const message = env.NODE_ENV === 'production'
    ? fallback
    : (error instanceof Error ? error.message : fallback);
  sendError(res, message, 500, 'INTERNAL_ERROR');
}
