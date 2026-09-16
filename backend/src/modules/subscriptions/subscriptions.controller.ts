import { Request, Response } from 'express';
import * as subscriptionsService from './subscriptions.service';
import { sendSuccess, handleControllerError } from '../../utils/response';
import { env } from '../../config/env';

// Legacy POST /verify (Apple receipt verification) removed — RevenueCat is the sole entitlement source
// and the webhook grants entitlements. The app never called /verify. See PLAN.md #20 (SUB-1/2/6/7).

export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const status = await subscriptionsService.getStatus(req.user!.id);
    sendSuccess(res, status, 'Subscription status retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get subscription status'); }
}

// RevenueCat webhook (unauthenticated route; verified via the configured Authorization header).
export async function rcWebhook(req: Request, res: Response): Promise<void> {
  if (!env.RC_WEBHOOK_AUTH) { res.status(503).json({ success: false, message: 'RC webhook not configured' }); return; }
  if (req.header('authorization') !== env.RC_WEBHOOK_AUTH) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const event = req.body?.event;
  if (!event?.id) { res.status(200).json({ success: true, status: 'ignored', detail: 'no event id' }); return; }

  try {
    const result = await subscriptionsService.handleRcWebhook(event);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    // Return 5xx so RevenueCat retries transient failures; permanent no-ops already returned 200 above.
    handleControllerError(res, error, 'Webhook processing failed');
  }
}
