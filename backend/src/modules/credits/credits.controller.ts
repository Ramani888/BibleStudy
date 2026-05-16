import { Request, Response } from 'express';
import * as creditsService from './credits.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const result = await creditsService.getBalance(req.user!.id);
    sendSuccess(res, result, 'Balance retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get balance'); }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await creditsService.getTransactions(req.user!.id, page, limit);
    sendSuccess(res, result, 'Transactions retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get transactions'); }
}

export async function claimDailyLogin(req: Request, res: Response): Promise<void> {
  try {
    const result = await creditsService.claimDailyLogin(req.user!.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to claim daily reward'); }
}
