import { Request, Response } from 'express';
import * as reportsService from './reports.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const result = await reportsService.createReport(req.user!.id, req.body);
    sendSuccess(res, result, 'Report sent', 201);
  } catch (error) {
    handleControllerError(res, error, 'Failed to send report');
  }
}
