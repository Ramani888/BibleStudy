import { Request, Response } from 'express';
import * as mapService from './map.service';
import { sendSuccess, sendError } from '../../utils/response';
import { UpdateLocationDtoType, PrivacyDtoType } from './map.dto';

export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as UpdateLocationDtoType;
    const result = await mapService.updateLocation(userId, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update location';
    sendError(res, message, 400, 'UPDATE_ERROR');
  }
}

export async function getFriendsLocations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const locations = await mapService.getFriendsLocations(userId);
    sendSuccess(res, locations, 'Friends locations retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get friends locations';
    sendError(res, message, 400, 'LIST_ERROR');
  }
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

    const userId = req.user!.id;
    const gatherings = await mapService.getNearbyGatherings(userId, lat, lng, radius);
    sendSuccess(res, gatherings, 'Nearby gatherings retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get nearby gatherings';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function updatePrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as PrivacyDtoType;
    const result = await mapService.updatePrivacy(userId, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update privacy';
    sendError(res, message, 400, 'UPDATE_ERROR');
  }
}
