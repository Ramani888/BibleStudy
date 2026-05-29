import { Request, Response } from 'express';
import * as notificationsService from './notifications.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await notificationsService.listNotifications(req.user!.id, page, limit);
    sendSuccess(res, result, 'Notifications retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list notifications'); }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const result = await notificationsService.markAsRead(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to mark notification'); }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const result = await notificationsService.markAllAsRead(req.user!.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to mark notifications'); }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const result = await notificationsService.deleteNotification(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete notification'); }
}
