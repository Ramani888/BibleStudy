import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authRateLimit } from '../../middlewares/rateLimit.middleware';
import {
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  RefreshDto,
  LogoutDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';

const router = Router();

router.post('/register', authRateLimit, validate(RegisterDto), authController.register);
router.post('/verify-email', authRateLimit, validate(VerifyEmailDto), authController.verifyEmail);
router.post('/resend-verification', authRateLimit, validate(ResendVerificationDto), authController.resendVerification);
router.post('/login', authRateLimit, validate(LoginDto), authController.login);
router.post('/refresh', validate(RefreshDto), authController.refreshToken);
router.post('/logout', authMiddleware, validate(LogoutDto), authController.logout);
router.post('/forgot-password', authRateLimit, validate(ForgotPasswordDto), authController.forgotPassword);
router.post('/reset-password', authRateLimit, validate(ResetPasswordDto), authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);

export default router;
