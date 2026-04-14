import { Request, Response } from 'express';
import * as notificationsService from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await notificationsService.listNotifications(userId, page, limit);
    sendSuccess(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list notifications';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await notificationsService.markAsRead(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark notification';
    const statusCode = message === 'Notification not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await notificationsService.markAllAsRead(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark notifications';
    sendError(res, message, 400, 'UPDATE_ERROR');
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await notificationsService.deleteNotification(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    const statusCode = message === 'Notification not found' ? 404 : 400;
    sendError(res, message, statusCode, 'DELETE_ERROR');
  }
}
