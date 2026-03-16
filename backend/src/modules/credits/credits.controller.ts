import { Request, Response } from 'express';
import * as creditsService from './credits.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await creditsService.getBalance(userId);
    sendSuccess(res, result, 'Balance retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get balance';
    sendError(res, message, 400, 'BALANCE_ERROR');
  }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await creditsService.getTransactions(userId, page, limit);
    sendSuccess(res, result, 'Transactions retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get transactions';
    sendError(res, message, 400, 'TRANSACTION_ERROR');
  }
}

export async function claimDailyLogin(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await creditsService.claimDailyLogin(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to claim daily reward';
    const statusCode =
      message === 'Daily login reward already claimed today' ? 409 : 400;
    sendError(res, message, statusCode, 'REWARD_ERROR');
  }
}
