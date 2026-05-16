import { Request, Response } from 'express';
import * as mapService from './map.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const result = await mapService.updateLocation(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to update location'); }
}

export async function getFriendsLocations(req: Request, res: Response): Promise<void> {
  try {
    const locations = await mapService.getFriendsLocations(req.user!.id);
    sendSuccess(res, locations, 'Friends locations retrieved');
  } catch (error) { handleError(res, error, 'Failed to get friends locations'); }
}

export async function getNearbyGatherings(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 50;
    if (isNaN(lat) || isNaN(lng)) {
      sendError(res, 'lat and lng are required', 400, 'VALIDATION_ERROR');
      return;
    }
    const gatherings = await mapService.getNearbyGatherings(req.user!.id, lat, lng, radius);
    sendSuccess(res, gatherings, 'Nearby gatherings retrieved');
  } catch (error) { handleError(res, error, 'Failed to get nearby gatherings'); }
}

export async function updatePrivacy(req: Request, res: Response): Promise<void> {
  try {
    const result = await mapService.updatePrivacy(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to update privacy'); }
}
