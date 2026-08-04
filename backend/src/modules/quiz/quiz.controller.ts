import { Request, Response } from 'express';
import * as quizService from './quiz.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function recordAttempt(req: Request, res: Response): Promise<void> {
  try {
    const result = await quizService.recordAttempt(req.user!.id, req.body);
    sendSuccess(res, result, 'Quiz attempt recorded', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to record quiz attempt'); }
}

export async function getBest(req: Request, res: Response): Promise<void> {
  try {
    const best = await quizService.getBestForSet(req.user!.id, req.params.setId);
    sendSuccess(res, { best }, 'Best score retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get best score'); }
}

export async function getAllBest(req: Request, res: Response): Promise<void> {
  try {
    const rows = await quizService.getAllBest(req.user!.id);
    sendSuccess(res, rows, 'Best scores retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get best scores'); }
}
