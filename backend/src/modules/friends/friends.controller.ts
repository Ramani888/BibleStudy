import { Request, Response } from 'express';
import * as friendsService from './friends.service';
import { sendSuccess, sendError } from '../../utils/response';
import { SendRequestDtoType } from './friends.dto';

export async function listFriends(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const friends = await friendsService.listFriends(userId);
    sendSuccess(res, friends, 'Friends retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list friends';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function listRequests(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const type = (req.query.type as 'incoming' | 'outgoing') || 'incoming';
    const requests = await friendsService.listRequests(userId, type);
    sendSuccess(res, requests, 'Friend requests retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list requests';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function sendRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { receiverId } = req.body as SendRequestDtoType;
    const request = await friendsService.sendRequest(userId, receiverId);
    sendSuccess(res, request, 'Friend request sent', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send friend request';
    const statusCode = message === 'User not found' ? 404 : 400;
    sendError(res, message, statusCode, 'REQUEST_ERROR');
  }
}

export async function acceptRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const result = await friendsService.acceptRequest(userId, requestId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept request';
    const statusCode = message === 'Friend request not found' ? 404 : 400;
    sendError(res, message, statusCode, 'ACCEPT_ERROR');
  }
}

export async function cancelRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const result = await friendsService.cancelRequest(userId, requestId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel request';
    const statusCode = message === 'Friend request not found' ? 404 : 400;
    sendError(res, message, statusCode, 'CANCEL_ERROR');
  }
}

export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const result = await friendsService.rejectRequest(userId, requestId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject request';
    const statusCode = message === 'Friend request not found' ? 404 : 400;
    sendError(res, message, statusCode, 'REJECT_ERROR');
  }
}

export async function removeFriend(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { friendId } = req.params;
    const result = await friendsService.removeFriend(userId, friendId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove friend';
    const statusCode = message === 'Friend not found' ? 404 : 400;
    sendError(res, message, statusCode, 'REMOVE_ERROR');
  }
}

export async function blockUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { userId: targetId } = req.params;
    const result = await friendsService.blockUser(userId, targetId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to block user';
    const statusCode = message === 'User not found' ? 404 : 400;
    sendError(res, message, statusCode, 'BLOCK_ERROR');
  }
}

export async function unblockUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { userId: targetId } = req.params;
    const result = await friendsService.unblockUser(userId, targetId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unblock user';
    const statusCode = message === 'Block not found' ? 404 : 400;
    sendError(res, message, statusCode, 'UNBLOCK_ERROR');
  }
}

export async function listBlocked(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const blocked = await friendsService.listBlocked(userId);
    sendSuccess(res, blocked, 'Blocked users retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list blocked users';
    sendError(res, message, 400, 'LIST_ERROR');
  }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    if (!q.trim()) {
      sendSuccess(res, [], 'No query provided');
      return;
    }
    const users = await friendsService.searchUsers(userId, q, page, limit);
    sendSuccess(res, users, 'Users found');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search users';
    sendError(res, message, 400, 'SEARCH_ERROR');
  }
}
