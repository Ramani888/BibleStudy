import { Request, Response } from 'express';
import * as setsService from './sets.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function createSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.createSet(req.user!.id, req.body);
    sendSuccess(res, set, 'Set created successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create set'); }
}

export async function listSets(req: Request, res: Response): Promise<void> {
  try {
    const folderId = req.query.folderId as string | undefined;
    const sets = await setsService.listSets(req.user!.id, folderId);
    sendSuccess(res, sets, 'Sets retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list sets'); }
}

export async function getSetById(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.getSetById(req.user!.id, req.params.id);
    sendSuccess(res, set, 'Set retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get set'); }
}

export async function updateSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.updateSet(req.user!.id, req.params.id, req.body);
    sendSuccess(res, set, 'Set updated successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to update set'); }
}

export async function deleteSet(req: Request, res: Response): Promise<void> {
  try {
    const result = await setsService.deleteSet(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete set'); }
}

export async function getPublicSets(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string | undefined)?.trim() || undefined;
    const result = await setsService.getPublicSets(page, limit, search);
    sendSuccess(res, result, 'Public sets retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get public sets'); }
}

export async function getFriendsSets(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await setsService.getFriendsSets(req.user!.id, page, limit);
    sendSuccess(res, result, 'Friends sets retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get friends sets'); }
}

export async function cloneSet(req: Request, res: Response): Promise<void> {
  try {
    const set = await setsService.cloneSet(req.user!.id, req.params.id);
    sendSuccess(res, set, 'Set cloned successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to clone set'); }
}
