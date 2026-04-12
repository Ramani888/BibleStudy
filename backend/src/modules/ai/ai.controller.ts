import { Request, Response } from 'express';
import * as aiService from './ai.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AskQuestionDtoType } from './ai.dto';

export async function askQuestion(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as AskQuestionDtoType;
    const result = await aiService.askQuestion(userId, dto);
    sendSuccess(res, result, 'Question answered successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process question';
    const statusCode =
      message === 'Insufficient credits. Please earn more credits to use AI chat.' ? 402 : 400;
    sendError(res, message, statusCode, 'AI_ERROR');
  }
}

export async function getChatHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await aiService.getChatHistory(userId, page, limit);
    sendSuccess(res, result, 'Chat history retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get chat history';
    sendError(res, message, 400, 'HISTORY_ERROR');
  }
}

export async function getDailyVerse(req: Request, res: Response): Promise<void> {
  try {
    const verse = await aiService.getDailyVerse();
    sendSuccess(res, verse, 'Daily verse retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get daily verse';
    sendError(res, message, 400, 'VERSE_ERROR');
  }
}
