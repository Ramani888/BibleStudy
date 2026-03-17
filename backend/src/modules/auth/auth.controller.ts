import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import {
  RegisterDtoType,
  VerifyEmailDtoType,
  LoginDtoType,
  RefreshDtoType,
  LogoutDtoType,
  ForgotPasswordDtoType,
  ResetPasswordDtoType,
} from './auth.dto';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as RegisterDtoType;
    const user = await authService.register(dto);
    sendSuccess(res, user, 'Registration successful. Please verify your email.', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = message === 'Email already registered' ? 409 : 400;
    sendError(res, message, statusCode, 'REGISTRATION_ERROR');
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as VerifyEmailDtoType;
    const result = await authService.verifyEmail(dto);
    sendSuccess(res, result, 'Email verified successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email verification failed';
    sendError(res, message, 400, 'VERIFICATION_ERROR');
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as LoginDtoType;
    const result = await authService.login(dto);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    if (message === 'Please verify your email before logging in') {
      sendError(res, message, 403, 'EMAIL_NOT_VERIFIED');
    } else {
      sendError(res, message, 401, 'LOGIN_ERROR');
    }
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as RefreshDtoType;
    const result = await authService.refreshToken(dto.refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    sendError(res, message, 401, 'REFRESH_ERROR');
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as LogoutDtoType;
    const result = await authService.logout(dto.refreshToken);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    sendError(res, message, 400, 'LOGOUT_ERROR');
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const result = await authService.resendVerification(email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    sendError(res, message, 400, 'RESEND_VERIFICATION_ERROR');
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as ForgotPasswordDtoType;
    const result = await authService.forgotPassword(dto.email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    sendError(res, message, 400, 'FORGOT_PASSWORD_ERROR');
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const dto = req.body as ResetPasswordDtoType;
    const result = await authService.resetPassword(dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset failed';
    sendError(res, message, 400, 'RESET_PASSWORD_ERROR');
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await authService.getMe(userId);
    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    sendError(res, message, 404, 'NOT_FOUND');
  }
}
