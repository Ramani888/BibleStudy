import { Request, Response } from 'express';
import * as foldersService from './folders.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function createFolder(req: Request, res: Response): Promise<void> {
  try {
    const folder = await foldersService.createFolder(req.user!.id, req.body);
    sendSuccess(res, folder, 'Folder created successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create folder'); }
}

export async function listFolders(req: Request, res: Response): Promise<void> {
  try {
    const folders = await foldersService.listFolders(req.user!.id);
    sendSuccess(res, folders, 'Folders retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list folders'); }
}

export async function getFolderById(req: Request, res: Response): Promise<void> {
  try {
    const folder = await foldersService.getFolderById(req.user!.id, req.params.id);
    sendSuccess(res, folder, 'Folder retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get folder'); }
}

export async function updateFolder(req: Request, res: Response): Promise<void> {
  try {
    const folder = await foldersService.updateFolder(req.user!.id, req.params.id, req.body);
    sendSuccess(res, folder, 'Folder updated successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to update folder'); }
}

export async function deleteFolder(req: Request, res: Response): Promise<void> {
  try {
    const result = await foldersService.deleteFolder(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete folder'); }
}
