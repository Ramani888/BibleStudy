import { Request, Response } from 'express';
import * as quizService from './quiz.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function recordAttempt(req: Request, res: Response): Promise<void> {
  try {
    const result = await quizService.recordAttempt(req.user!.id, req.body);
    sendSuccess(res, result, 'Quiz attempt recorded', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to record quiz attempt'); }
}

export async function deleteAttempt(req: Request, res: Response): Promise<void> {
  try {
    await quizService.deleteAttempt(req.user!.id, req.params.id);
    sendSuccess(res, null, 'Quiz attempt deleted');
  } catch (error) { handleControllerError(res, error, 'Failed to delete quiz attempt'); }
}

export async function updateAttempt(req: Request, res: Response): Promise<void> {
  try {
    const result = await quizService.updateAttempt(req.user!.id, req.params.id, req.body);
    sendSuccess(res, result, 'Quiz attempt updated');
  } catch (error) { handleControllerError(res, error, 'Failed to update quiz attempt'); }
}

export async function getBest(req: Request, res: Response): Promise<void> {
  try {
    const best = await quizService.getBestForSet(req.user!.id, req.params.setId);
    sendSuccess(res, { best }, 'Best score retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get best score'); }
}

export async function getRecentAttempts(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const rows = await quizService.getRecentAttempts(req.user!.id, limit);
    sendSuccess(res, rows, 'Recent attempts retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get recent attempts'); }
}

export async function getAttemptResponses(req: Request, res: Response): Promise<void> {
  try {
    const result = await quizService.getAttemptResponses(req.user!.id, req.params.id);
    sendSuccess(res, result, 'Attempt responses retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get attempt responses'); }
}

export async function getAllBest(req: Request, res: Response): Promise<void> {
  try {
    const rows = await quizService.getAllBest(req.user!.id);
    sendSuccess(res, rows, 'Best scores retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get best scores'); }
}
