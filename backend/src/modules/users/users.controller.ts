import { Request, Response } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendError } from '../../utils/response';
import { UpdateProfileDtoType, ChangePasswordDtoType, DeviceTokenDtoType, RemoveTokenDtoType } from './users.dto';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await usersService.getProfile(userId);
    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    sendError(res, message, 404, 'NOT_FOUND');
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as UpdateProfileDtoType;
    const user = await usersService.updateProfile(userId, dto);
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    sendError(res, message, 400, 'UPDATE_ERROR');
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as ChangePasswordDtoType;
    const result = await usersService.changePassword(userId, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change password';
    const statusCode = message === 'Current password is incorrect' ? 401 : 400;
    sendError(res, message, statusCode, 'PASSWORD_ERROR');
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await usersService.deleteAccount(userId);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete account';
    sendError(res, message, 400, 'DELETE_ERROR');
  }
}

export async function registerDeviceToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token, platform } = req.body as DeviceTokenDtoType;
    const result = await usersService.registerDeviceToken(userId, token, platform);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register device token';
    sendError(res, message, 400, 'TOKEN_ERROR');
  }
}

export async function removeDeviceToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token } = req.body as RemoveTokenDtoType;
    const result = await usersService.removeDeviceToken(userId, token);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove device token';
    sendError(res, message, 400, 'TOKEN_ERROR');
  }
}
