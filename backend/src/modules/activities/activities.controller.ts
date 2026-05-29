import { Request, Response } from 'express';
import * as activitiesService from './activities.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function getMyFeed(req: Request, res: Response): Promise<void> {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getMyFeed(req.user!.id, page, limit);
    sendSuccess(res, result, 'Activity feed retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get activity feed'); }
}

export async function getFriendsFeed(req: Request, res: Response): Promise<void> {
  try {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await activitiesService.getFriendsFeed(req.user!.id, page, limit);
    sendSuccess(res, result, 'Friends activity feed retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get friends feed'); }
}
