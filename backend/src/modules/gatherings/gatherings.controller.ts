import { Request, Response } from 'express';
import * as gatheringsService from './gatherings.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateGatheringDtoType, UpdateGatheringDtoType, RsvpDtoType } from './gatherings.dto';

export async function createGathering(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreateGatheringDtoType;
    const gathering = await gatheringsService.createGathering(userId, dto);
    sendSuccess(res, gathering, 'Gathering created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create gathering';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function listGatherings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const groupId = req.query.groupId as string | undefined;
    const upcoming = req.query.upcoming === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await gatheringsService.listGatherings(userId, { groupId, upcoming, page, limit });
    sendSuccess(res, result, 'Gatherings retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list gatherings';
    sendError(res, message, 400, 'LIST_ERROR');
  }
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

    const userId = req.user!.id;
    const gatherings = await gatheringsService.getNearby(userId, lat, lng, radius);
    sendSuccess(res, gatherings, 'Nearby gatherings retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get nearby gatherings';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function getGathering(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const gathering = await gatheringsService.getGathering(userId, id);
    sendSuccess(res, gathering, 'Gathering retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get gathering';
    const statusCode = message === 'Gathering not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function updateGathering(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateGatheringDtoType;
    const gathering = await gatheringsService.updateGathering(userId, id, dto);
    sendSuccess(res, gathering, 'Gathering updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update gathering';
    const statusCode = message.includes('not authorized') ? 403 : 400;
    sendError(res, message, statusCode, 'UPDATE_ERROR');
  }
}

export async function cancelGathering(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await gatheringsService.cancelGathering(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel gathering';
    sendError(res, message, 400, 'DELETE_ERROR');
  }
}

export async function rsvp(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as RsvpDtoType;
    const result = await gatheringsService.rsvp(userId, id, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to RSVP';
    const statusCode = message === 'Gathering not found' ? 404 : 400;
    sendError(res, message, statusCode, 'RSVP_ERROR');
  }
}

export async function leaveGathering(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await gatheringsService.leaveGathering(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to leave gathering';
    sendError(res, message, 400, 'LEAVE_ERROR');
  }
}

export async function listParticipants(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const participants = await gatheringsService.listParticipants(userId, id);
    sendSuccess(res, participants, 'Participants retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list participants';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}
