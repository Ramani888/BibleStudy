import { Request, Response } from 'express';
import * as authService from './auth.service';
import * as usersService from '../users/users.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const user = await authService.register(dto);
    sendSuccess(res, user, 'Registration successful. Please verify your email.', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Registration failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.verifyEmail(dto);
    sendSuccess(res, result, 'Email verified successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Email verification failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.login(dto);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Login failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.refreshToken(dto.refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.logout(dto.refreshToken);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Logout failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const result = await authService.resendVerification(email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Request failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.forgotPassword(dto.email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Request failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body;
    const result = await authService.resetPassword(dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode, error.code);
      return;
    }
    const message = error instanceof Error ? error.message : 'Password reset failed';
    sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
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

export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.googleAuth(req.body);
    sendSuccess(res, result, 'Google sign-in successful');
  } catch (error) {
    if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
    sendError(res, 'Google sign-in failed', 500, 'INTERNAL_ERROR');
  }
}

export async function appleAuth(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.appleAuth(req.body);
    sendSuccess(res, result, 'Apple sign-in successful');
  } catch (error) {
    if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
    sendError(res, 'Apple sign-in failed', 500, 'INTERNAL_ERROR');
  }
}
