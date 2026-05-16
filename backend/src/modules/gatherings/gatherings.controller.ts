import { Request, Response } from 'express';
import * as gatheringsService from './gatherings.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function createGathering(req: Request, res: Response): Promise<void> {
  try {
    const gathering = await gatheringsService.createGathering(req.user!.id, req.body);
    sendSuccess(res, gathering, 'Gathering created successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to create gathering'); }
}

export async function listGatherings(req: Request, res: Response): Promise<void> {
  try {
    const groupId = req.query.groupId as string | undefined;
    const upcoming = req.query.upcoming === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await gatheringsService.listGatherings(req.user!.id, { groupId, upcoming, page, limit });
    sendSuccess(res, result, 'Gatherings retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list gatherings'); }
}

export async function getNearby(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 50;
    if (isNaN(lat) || isNaN(lng)) {
      sendError(res, 'lat and lng are required', 400, 'VALIDATION_ERROR');
      return;
    }
    const gatherings = await gatheringsService.getNearby(req.user!.id, lat, lng, radius);
    sendSuccess(res, gatherings, 'Nearby gatherings retrieved');
  } catch (error) { handleError(res, error, 'Failed to get nearby gatherings'); }
}

export async function getGathering(req: Request, res: Response): Promise<void> {
  try {
    const gathering = await gatheringsService.getGathering(req.user!.id, req.params.id);
    sendSuccess(res, gathering, 'Gathering retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get gathering'); }
}

export async function updateGathering(req: Request, res: Response): Promise<void> {
  try {
    const gathering = await gatheringsService.updateGathering(req.user!.id, req.params.id, req.body);
    sendSuccess(res, gathering, 'Gathering updated successfully');
  } catch (error) { handleError(res, error, 'Failed to update gathering'); }
}

export async function cancelGathering(req: Request, res: Response): Promise<void> {
  try {
    const result = await gatheringsService.cancelGathering(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to cancel gathering'); }
}

export async function rsvp(req: Request, res: Response): Promise<void> {
  try {
    const result = await gatheringsService.rsvp(req.user!.id, req.params.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to RSVP'); }
}

export async function leaveGathering(req: Request, res: Response): Promise<void> {
  try {
    const result = await gatheringsService.leaveGathering(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to leave gathering'); }
}

export async function listParticipants(req: Request, res: Response): Promise<void> {
  try {
    const participants = await gatheringsService.listParticipants(req.user!.id, req.params.id);
    sendSuccess(res, participants, 'Participants retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list participants'); }
}
