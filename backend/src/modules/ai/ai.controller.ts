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
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await aiService.getChatHistory(req.user!.id, page, limit);
    sendSuccess(res, result, 'Chat history retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get chat history'); }
}

export async function getDailyVerse(req: Request, res: Response): Promise<void> {
  try {
    const verse = await aiService.getDailyVerse();
    sendSuccess(res, verse, 'Daily verse retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get daily verse'); }
}
