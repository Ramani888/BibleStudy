import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      sendError(res, 'No token provided', 401, 'UNAUTHORIZED');
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId };
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}
