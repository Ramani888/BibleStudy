import { Request, Response } from 'express';
import * as setsService from './sets.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateSetDtoType, UpdateSetDtoType } from './sets.dto';

export async function createSet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreateSetDtoType;
    const set = await setsService.createSet(userId, dto);
    sendSuccess(res, set, 'Set created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create set';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function listSets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const folderId = req.query.folderId as string | undefined;
    const sets = await setsService.listSets(userId, folderId);
    sendSuccess(res, sets, 'Sets retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list sets';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function getSetById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const set = await setsService.getSetById(userId, id);
    sendSuccess(res, set, 'Set retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get set';
    const statusCode = message === 'Set not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function updateSet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateSetDtoType;
    const set = await setsService.updateSet(userId, id, dto);
    sendSuccess(res, set, 'Set updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update set';
    const statusCode = message === 'Set not found' ? 404 : 400;
    sendError(res, message, statusCode, 'UPDATE_ERROR');
  }
}

export async function deleteSet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await setsService.deleteSet(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete set';
    const statusCode = message === 'Set not found' ? 404 : 400;
    sendError(res, message, statusCode, 'DELETE_ERROR');
  }
}

export async function getPublicSets(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await setsService.getPublicSets(page, limit);
    sendSuccess(res, result, 'Public sets retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get public sets';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function cloneSet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const set = await setsService.cloneSet(userId, id);
    sendSuccess(res, set, 'Set cloned successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clone set';
    const statusCode = message === 'Set not found or is not public' ? 404 : 400;
    sendError(res, message, statusCode, 'CLONE_ERROR');
  }
}
