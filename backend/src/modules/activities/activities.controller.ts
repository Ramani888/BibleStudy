import { Request, Response } from 'express';
import * as activitiesService from './activities.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getMyFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getMyFeed(userId, page, limit);
    sendSuccess(res, result, 'Activity feed retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get activity feed';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function getFriendsFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getFriendsFeed(userId, page, limit);
    sendSuccess(res, result, 'Friends activity feed retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get friends feed';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}
