import { Request, Response } from 'express';
import * as waitlistService from './waitlist.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function join(req: Request, res: Response): Promise<void> {
  try {
    const entry = await waitlistService.joinWaitlist(req.body);
    sendSuccess(res, entry, 'You are on the waitlist', 201);
  } catch (error) {
    handleControllerError(res, error, 'Failed to join waitlist');
  }
}
