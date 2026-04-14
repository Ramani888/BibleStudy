import { Request, Response } from 'express';
import * as groupsService from './groups.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateGroupDtoType, UpdateGroupDtoType, UpdateRoleDtoType } from './groups.dto';

export async function listPublicGroups(req: Request, res: Response): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await groupsService.listPublicGroups({ search, page, limit });
    sendSuccess(res, result, 'Public groups retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list public groups';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreateGroupDtoType;
    const group = await groupsService.createGroup(userId, dto);
    sendSuccess(res, group, 'Group created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create group';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function listMyGroups(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const groups = await groupsService.listMyGroups(userId);
    sendSuccess(res, groups, 'Groups retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list groups';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function getGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const group = await groupsService.getGroup(userId, id);
    sendSuccess(res, group, 'Group retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get group';
    const statusCode = message === 'Group not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function updateGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateGroupDtoType;
    const group = await groupsService.updateGroup(userId, id, dto);
    sendSuccess(res, group, 'Group updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update group';
    const statusCode = message === 'Not authorized' ? 403 : 400;
    sendError(res, message, statusCode, 'UPDATE_ERROR');
  }
}

export async function deleteGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await groupsService.deleteGroup(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete group';
    const statusCode = message.includes('not found') ? 404 : 400;
    sendError(res, message, statusCode, 'DELETE_ERROR');
  }
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { inviteCode } = req.params;
    const group = await groupsService.joinGroup(userId, inviteCode);
    sendSuccess(res, group, 'Joined group successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join group';
    const statusCode = message === 'Invalid invite code' ? 404 : 400;
    sendError(res, message, statusCode, 'JOIN_ERROR');
  }
}

export async function leaveGroup(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await groupsService.leaveGroup(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to leave group';
    sendError(res, message, 400, 'LEAVE_ERROR');
  }
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id, uid } = req.params;
    const dto = req.body as UpdateRoleDtoType;
    const result = await groupsService.updateMemberRole(userId, id, uid, dto);
    sendSuccess(res, result, 'Member role updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update role';
    const statusCode = message === 'Not authorized' ? 403 : 400;
    sendError(res, message, statusCode, 'ROLE_ERROR');
  }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id, uid } = req.params;
    const result = await groupsService.removeMember(userId, id, uid);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    const statusCode = message === 'Not authorized' ? 403 : 400;
    sendError(res, message, statusCode, 'REMOVE_ERROR');
  }
}

export async function regenerateInviteCode(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await groupsService.regenerateInviteCode(userId, id);
    sendSuccess(res, result, 'Invite code regenerated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate invite code';
    sendError(res, message, 400, 'INVITE_ERROR');
  }
}
