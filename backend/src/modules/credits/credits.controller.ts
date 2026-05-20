import { Request, Response } from 'express';
import * as creditsService from './credits.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError, ValidationError } from '../../utils/errors';
import type { StatPeriod, StatInterval } from './credits.service';

const VALID_PERIODS:   StatPeriod[]   = ['today', 'week', 'month', 'year', 'custom'];
const VALID_INTERVALS: StatInterval[] = ['1h', '2h', '6h', 'day', 'week', 'month', 'quarter'];
const MAX_CUSTOM_DAYS = 90;

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

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const period = (req.query.period as string) ?? 'week';
    if (!VALID_PERIODS.includes(period as StatPeriod)) {
      throw new ValidationError('period must be one of: today, week, month, year, custom');
    }

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (period === 'custom') {
      const fromStr = req.query.from as string;
      const toStr   = req.query.to   as string;
      if (!fromStr || !toStr) throw new ValidationError('custom period requires from and to query params');

      fromDate = new Date(fromStr);
      toDate   = new Date(toStr);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw new ValidationError('from and to must be valid ISO dates');
      if (toDate < fromDate) throw new ValidationError('to must be after from');

      const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > MAX_CUSTOM_DAYS) throw new ValidationError(`Custom range cannot exceed ${MAX_CUSTOM_DAYS} days`);
    }

    const intervalStr = req.query.interval as string | undefined;
    let interval: StatInterval | undefined;
    if (intervalStr) {
      if (!VALID_INTERVALS.includes(intervalStr as StatInterval)) {
        throw new ValidationError(`interval must be one of: ${VALID_INTERVALS.join(', ')}`);
      }
      interval = intervalStr as StatInterval;

      const hourIntervals: StatInterval[] = ['1h', '2h', '6h'];
      if (hourIntervals.includes(interval) && period !== 'today' && period !== 'custom') {
        throw new ValidationError('Hour-based intervals are only valid for today or custom periods');
      }
      if (interval === 'quarter' && period !== 'year' && period !== 'custom') {
        throw new ValidationError('Quarter interval is only valid for year or custom periods');
      }
    }

    const result = await creditsService.getStats(req.user!.id, period as StatPeriod, fromDate, toDate, interval);
    sendSuccess(res, result, 'Stats retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get stats'); }
}
