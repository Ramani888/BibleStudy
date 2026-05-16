import { Request, Response } from 'express';
import * as activitiesService from './activities.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function getMyFeed(req: Request, res: Response): Promise<void> {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getMyFeed(req.user!.id, page, limit);
    sendSuccess(res, result, 'Activity feed retrieved');
  } catch (error) { handleError(res, error, 'Failed to get activity feed'); }
}

export async function getFriendsFeed(req: Request, res: Response): Promise<void> {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getFriendsFeed(req.user!.id, page, limit);
    sendSuccess(res, result, 'Friends activity feed retrieved');
  } catch (error) { handleError(res, error, 'Failed to get friends feed'); }
}
