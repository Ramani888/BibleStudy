import { Request, Response } from 'express';
import * as mediaService from './media.service';
import { sendSuccess, sendError, handleControllerError } from '../../utils/response';
import { ListMediaDto, RenameMediaDto } from './media.dto';

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) { sendError(res, 'No file provided', 400, 'NO_FILE'); return; }
    const file = await mediaService.uploadFile(req.user!.id, req.file);
    sendSuccess(res, file, 'File uploaded successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to upload file'); }
}

export async function listFiles(req: Request, res: Response): Promise<void> {
  try {
    const dto = ListMediaDto.parse(req.query);
    const files = await mediaService.listFiles(req.user!.id, dto);
    sendSuccess(res, files, 'Files retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list files'); }
}

export async function deleteFile(req: Request, res: Response): Promise<void> {
  try {
    const result = await mediaService.deleteFile(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete file'); }
}

export async function renameFile(req: Request, res: Response): Promise<void> {
  try {
    const dto = RenameMediaDto.parse(req.body);
    const file = await mediaService.renameFile(req.user!.id, req.params.id, dto.name);
    sendSuccess(res, file, 'File renamed');
  } catch (error) { handleControllerError(res, error, 'Failed to rename file'); }
}

export async function getStorageUsage(req: Request, res: Response): Promise<void> {
  try {
    const usage = await mediaService.getStorageUsage(req.user!.id);
    sendSuccess(res, usage, 'Storage usage retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get storage usage'); }
}
