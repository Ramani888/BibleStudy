import { Request, Response } from 'express';
import * as friendsService from './friends.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function listFriends(req: Request, res: Response): Promise<void> {
  try {
    const friends = await friendsService.listFriends(req.user!.id);
    sendSuccess(res, friends, 'Friends retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list friends'); }
}

export async function listRequests(req: Request, res: Response): Promise<void> {
  try {
    const type = (req.query.type as 'incoming' | 'outgoing') || 'incoming';
    const requests = await friendsService.listRequests(req.user!.id, type);
    sendSuccess(res, requests, 'Friend requests retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list requests'); }
}

export async function sendRequest(req: Request, res: Response): Promise<void> {
  try {
    const request = await friendsService.sendRequest(req.user!.id, req.body.receiverId);
    sendSuccess(res, request, 'Friend request sent', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to send friend request'); }
}

export async function acceptRequest(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.acceptRequest(req.user!.id, req.params.requestId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to accept request'); }
}

export async function cancelRequest(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.cancelRequest(req.user!.id, req.params.requestId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to cancel request'); }
}

export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.rejectRequest(req.user!.id, req.params.requestId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to reject request'); }
}

export async function removeFriend(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.removeFriend(req.user!.id, req.params.friendId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to remove friend'); }
}

export async function blockUser(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.blockUser(req.user!.id, req.params.userId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to block user'); }
}

export async function unblockUser(req: Request, res: Response): Promise<void> {
  try {
    const result = await friendsService.unblockUser(req.user!.id, req.params.userId);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to unblock user'); }
}

export async function listBlocked(req: Request, res: Response): Promise<void> {
  try {
    const blocked = await friendsService.listBlocked(req.user!.id);
    sendSuccess(res, blocked, 'Blocked users retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list blocked users'); }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    if (!q.trim()) { sendSuccess(res, [], 'No query provided'); return; }
    const users = await friendsService.searchUsers(req.user!.id, q, page, limit);
    sendSuccess(res, users, 'Users found');
  } catch (error) { handleControllerError(res, error, 'Failed to search users'); }
}
