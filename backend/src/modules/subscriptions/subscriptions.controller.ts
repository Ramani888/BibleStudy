import { Request, Response } from 'express';
import * as subscriptionsService from './subscriptions.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function verifyPurchase(req: Request, res: Response): Promise<void> {
  try {
    const result = await subscriptionsService.verifyPurchase(req.user!.id, req.body);
    sendSuccess(res, result, 'Purchase verified');
  } catch (error) { handleControllerError(res, error, 'Failed to verify purchase'); }
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const status = await subscriptionsService.getStatus(req.user!.id);
    sendSuccess(res, status, 'Subscription status retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get subscription status'); }
}
