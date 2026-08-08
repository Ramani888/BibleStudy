import { Request, Response } from 'express';
import * as achievementsService from './achievements.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    const result = await achievementsService.getAchievements(req.user!.id);
    sendSuccess(res, result, 'Achievements retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get achievements'); }
}
