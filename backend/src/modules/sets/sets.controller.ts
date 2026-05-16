import { Request, Response } from 'express';
import * as setsService from './sets.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function createSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.createSet(req.user!.id, req.body);
    sendSuccess(res, set, 'Set created successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to create set'); }
}

export async function listSets(req: Request, res: Response): Promise<void> {
  try {
    const folderId = req.query.folderId as string | undefined;
    const sets = await setsService.listSets(req.user!.id, folderId);
    sendSuccess(res, sets, 'Sets retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list sets'); }
}

export async function getSetById(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.getSetById(req.user!.id, req.params.id);
    sendSuccess(res, set, 'Set retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get set'); }
}

export async function updateSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.updateSet(req.user!.id, req.params.id, req.body);
    sendSuccess(res, set, 'Set updated successfully');
  } catch (error) { handleError(res, error, 'Failed to update set'); }
}

export async function deleteSet(req: Request, res: Response): Promise<void> {
  try {
    const result = await setsService.deleteSet(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to delete set'); }
}

export async function getPublicSets(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await setsService.getPublicSets(page, limit);
    sendSuccess(res, result, 'Public sets retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get public sets'); }
}

export async function cloneSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.cloneSet(req.user!.id, req.params.id);
    sendSuccess(res, set, 'Set cloned successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to clone set'); }
}
