import { Request, Response } from 'express';
import * as groupsService from './groups.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function listPublicGroups(req: Request, res: Response): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await groupsService.listPublicGroups({ search, page, limit });
    sendSuccess(res, result, 'Public groups retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list public groups'); }
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    const group = await groupsService.createGroup(req.user!.id, req.body);
    sendSuccess(res, group, 'Group created successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to create group'); }
}

export async function listMyGroups(req: Request, res: Response): Promise<void> {
  try {
    const groups = await groupsService.listMyGroups(req.user!.id);
    sendSuccess(res, groups, 'Groups retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list groups'); }
}

export async function getGroup(req: Request, res: Response): Promise<void> {
  try {
    const group = await groupsService.getGroup(req.user!.id, req.params.id);
    sendSuccess(res, group, 'Group retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get group'); }
}

export async function updateGroup(req: Request, res: Response): Promise<void> {
  try {
    const group = await groupsService.updateGroup(req.user!.id, req.params.id, req.body);
    sendSuccess(res, group, 'Group updated successfully');
  } catch (error) { handleError(res, error, 'Failed to update group'); }
}

export async function deleteGroup(req: Request, res: Response): Promise<void> {
  try {
    const result = await groupsService.deleteGroup(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to delete group'); }
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  try {
    const group = await groupsService.joinGroup(req.user!.id, req.params.inviteCode);
    sendSuccess(res, group, 'Joined group successfully');
  } catch (error) { handleError(res, error, 'Failed to join group'); }
}

export async function leaveGroup(req: Request, res: Response): Promise<void> {
  try {
    const result = await groupsService.leaveGroup(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to leave group'); }
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  try {
    const result = await groupsService.updateMemberRole(req.user!.id, req.params.id, req.params.uid, req.body);
    sendSuccess(res, result, 'Member role updated');
  } catch (error) { handleError(res, error, 'Failed to update role'); }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const result = await groupsService.removeMember(req.user!.id, req.params.id, req.params.uid);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to remove member'); }
}

export async function regenerateInviteCode(req: Request, res: Response): Promise<void> {
  try {
    const result = await groupsService.regenerateInviteCode(req.user!.id, req.params.id);
    sendSuccess(res, result, 'Invite code regenerated');
  } catch (error) { handleError(res, error, 'Failed to regenerate invite code'); }
}
