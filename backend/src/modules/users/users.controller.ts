import { Request, Response } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await usersService.getProfile(userId);
    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const user = await usersService.updateProfile(userId, dto);
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const result = await usersService.changePassword(userId, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to change password';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}


export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await usersService.deleteAccount(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to delete account';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const requesterId = req.user!.id;
    const { id } = req.params;
    const user = await usersService.getUserById(id, requesterId);
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to get user';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function registerDeviceToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token, platform } = req.body;
    const result = await usersService.registerDeviceToken(userId, token, platform);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to register device token';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function removeDeviceToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token } = req.body;
    const result = await usersService.removeDeviceToken(userId, token);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Failed to remove device token';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}
