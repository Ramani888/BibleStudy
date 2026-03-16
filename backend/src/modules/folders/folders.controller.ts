import { Request, Response } from 'express';
import * as foldersService from './folders.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateFolderDtoType, UpdateFolderDtoType } from './folders.dto';

export async function createFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreateFolderDtoType;
    const folder = await foldersService.createFolder(userId, dto);
    sendSuccess(res, folder, 'Folder created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create folder';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function listFolders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const folders = await foldersService.listFolders(userId);
    sendSuccess(res, folders, 'Folders retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list folders';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function getFolderById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const folder = await foldersService.getFolderById(userId, id);
    sendSuccess(res, folder, 'Folder retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get folder';
    const statusCode = message === 'Folder not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function updateFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateFolderDtoType;
    const folder = await foldersService.updateFolder(userId, id, dto);
    sendSuccess(res, folder, 'Folder updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update folder';
    const statusCode = message === 'Folder not found' ? 404 : 400;
    sendError(res, message, statusCode, 'UPDATE_ERROR');
  }
}

export async function deleteFolder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await foldersService.deleteFolder(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete folder';
    const statusCode = message === 'Folder not found' ? 404 : 400;
    sendError(res, message, statusCode, 'DELETE_ERROR');
  }
}
