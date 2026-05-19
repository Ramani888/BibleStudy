import { Request, Response } from 'express';
import * as aiService from './ai.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function askQuestion(req: Request, res: Response): Promise<void> {
  try {
    const result = await aiService.askQuestion(req.user!.id, req.body);
    sendSuccess(res, result, 'Question answered successfully');
  } catch (error) { handleError(res, error, 'Failed to process question'); }
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const result = await aiService.getChatHistory(req.user!.id, page, limit);
    sendSuccess(res, result, 'Chat history retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get chat history'); }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    await aiService.deleteSession(req.user!.id, req.params.sessionId);
    sendSuccess(res, null, 'Session deleted successfully');
  } catch (error) { handleError(res, error, 'Failed to delete session'); }
}

export async function clearHistory(req: Request, res: Response): Promise<void> {
  try {
    await aiService.clearHistory(req.user!.id);
    sendSuccess(res, null, 'Chat history cleared successfully');
  } catch (error) { handleError(res, error, 'Failed to clear history'); }
}

export async function renameSession(req: Request, res: Response): Promise<void> {
  try {
    await aiService.renameSession(req.user!.id, req.params.sessionId, req.body.title);
    sendSuccess(res, null, 'Session renamed successfully');
  } catch (error) { handleError(res, error, 'Failed to rename session'); }
}

export async function updateSessionTags(req: Request, res: Response): Promise<void> {
  try {
    await aiService.updateSessionTags(req.user!.id, req.params.sessionId, req.body.tags);
    sendSuccess(res, null, 'Tags updated successfully');
  } catch (error) { handleError(res, error, 'Failed to update tags'); }
}

export async function addBookmark(req: Request, res: Response): Promise<void> {
  try {
    await aiService.addBookmark(req.user!.id, req.body.chatId);
    sendSuccess(res, null, 'Bookmarked successfully');
  } catch (error) { handleError(res, error, 'Failed to bookmark message'); }
}

export async function removeBookmark(req: Request, res: Response): Promise<void> {
  try {
    await aiService.removeBookmark(req.user!.id, req.params.chatId);
    sendSuccess(res, null, 'Bookmark removed');
  } catch (error) { handleError(res, error, 'Failed to remove bookmark'); }
}

export async function getBookmarks(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await aiService.getBookmarks(req.user!.id, page, limit);
    sendSuccess(res, result, 'Bookmarks retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get bookmarks'); }
}

export async function getDailyVerse(req: Request, res: Response): Promise<void> {
  try {
    const verse = await aiService.getDailyVerse();
    sendSuccess(res, verse, 'Daily verse retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get daily verse'); }
}
