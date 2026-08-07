import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { prisma } from '../../config/db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../../utils/email';
import {
  RegisterDtoType,
  VerifyEmailDtoType,
  LoginDtoType,
  ResetPasswordDtoType,
  GoogleAuthDtoType,
  AppleAuthDtoType,
} from './auth.dto';
import { env } from '../../config/env';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError } from '../../utils/errors';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function parseDuration(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export async function register(dto: RegisterDtoType) {
  const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });

  if (existingUser) {
    // If account exists but email is unverified, update credentials and resend OTP
    if (!existingUser.emailVerified) {
      const hashedPassword = await bcrypt.hash(dto.password, 12);
      const updated = await prisma.user.update({
        where: { email: dto.email },
        data: { name: dto.name, password: hashedPassword },
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          bio: true,
          church: true,
          creditBalance: true,
          plan: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      const otp = generateOTP();
      await storeOTP(dto.email, otp);
      try {
        await sendVerificationEmail(dto.email, otp);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      return updated;
    }

    throw new ConflictError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(dto.password, 12);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      church: true,
      creditBalance: true,
      plan: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const otp = generateOTP();
  await storeOTP(dto.email, otp);

  try {
    await sendVerificationEmail(dto.email, otp);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  return user;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Return success to prevent email enumeration
    return { message: 'If that email exists and is unverified, a new code has been sent' };
  }

  if (user.emailVerified) {
    throw new ConflictError('Email is already verified');
  }

  const otp = generateOTP();
  await storeOTP(email, otp);

  try {
    await sendVerificationEmail(email, otp);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  return { message: 'If that email exists and is unverified, a new code has been sent' };
}

export async function verifyEmail(dto: VerifyEmailDtoType) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.emailVerified) {
    throw new ConflictError('Email already verified');
  }

  const isValid = await verifyOTP(dto.email, dto.otp);
  if (!isValid) {
    throw new ValidationError('Invalid or expired OTP');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  // Auto-login after verification so frontend doesn't need a separate login step
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES));
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  });

  const { password: _password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: { ...userWithoutPassword, emailVerified: true },
  };
}

export async function login(dto: LoginDtoType) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.password) {
    throw new UnauthorizedError('This account uses social login. Please sign in with Google or Apple.');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES));

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  const { password: _password, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
}

export async function refreshToken(token: string) {
  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Refresh token expired');
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken(payload.userId);
    return { accessToken };
  } catch {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
  return { message: 'Logged out successfully' };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success anyway to prevent email enumeration
    return { message: 'If that email exists, a reset code has been sent' };
  }

  const otp = generateOTP();
  await storeOTP(email, otp);

  try {
    await sendPasswordResetEmail(email, otp);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
  }

  return { message: 'If that email exists, a reset code has been sent' };
}

export async function resetPassword(dto: ResetPasswordDtoType) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    throw new ValidationError('Invalid or expired OTP');
  }

  const isValid = await verifyOTP(dto.email, dto.otp);
  if (!isValid) {
    throw new ValidationError('Invalid or expired OTP');
  }

  if (!user.password && !user.googleId && !user.appleId) {
    throw new ValidationError('Cannot reset password for this account');
  }

  const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return { message: 'Password reset successfully' };
}

// ─── Shared helper: issue tokens + build response ────────────────────────────
const USER_SELECT = {
  id: true, name: true, email: true, profileImage: true, bio: true,
  church: true, creditBalance: true, plan: true, emailVerified: true, createdAt: true,
} as const;

async function issueSocialSession(userId: string) {
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  const expiresAt    = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES));
  await prisma.refreshToken.create({ data: { userId, token: refreshToken, expiresAt } });
  return { accessToken, refreshToken };
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────
export async function googleAuth(dto: GoogleAuthDtoType) {
  if (!env.GOOGLE_CLIENT_ID) throw new ValidationError('Google Sign-In is not configured');

  const ticket  = await googleClient.verifyIdToken({ idToken: dto.idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new UnauthorizedError('Invalid Google token');

  const { sub: googleId, email, name = 'User', picture } = payload;

  // Find by googleId first, then by email (link existing account)
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    select: { ...USER_SELECT, googleId: true },
  });

  if (user) {
    if (!user.googleId) {
      await prisma.user.update({ where: { id: user.id }, data: { googleId } });
    }
  } else {
    user = await prisma.user.create({
      data: { name, email, googleId, emailVerified: true, profileImage: picture },
      select: { ...USER_SELECT, googleId: true },
    });
  }

  const { googleId: _gid, ...userOut } = user;
  const tokens = await issueSocialSession(user.id);
  return { ...tokens, user: userOut };
}

// ─── Apple Sign-In ────────────────────────────────────────────────────────────
export async function appleAuth(dto: AppleAuthDtoType) {
  if (!env.APPLE_BUNDLE_ID) throw new ValidationError('Apple Sign-In is not configured');

  const appleUser = await appleSignin.verifyIdToken(dto.identityToken, {
    audience:         env.APPLE_BUNDLE_ID,
    nonce:            dto.nonce,
    ignoreExpiration: false,
  });

  const appleId = appleUser.sub;
  // Apple only sends email + name on the very first sign-in
  const email = dto.email ?? appleUser.email;
  if (!email) throw new UnauthorizedError('Email not provided by Apple. Please try signing in again.');

  const givenName  = dto.fullName?.givenName  ?? '';
  const familyName = dto.fullName?.familyName ?? '';
  const name       = [givenName, familyName].filter(Boolean).join(' ') || 'User';

  let user = await prisma.user.findFirst({
    where: { OR: [{ appleId }, { email }] },
    select: { ...USER_SELECT, appleId: true },
  });

  if (user) {
    if (!user.appleId) {
      await prisma.user.update({ where: { id: user.id }, data: { appleId } });
    }
  } else {
    user = await prisma.user.create({
      data: { name, email, appleId, emailVerified: true },
      select: { ...USER_SELECT, appleId: true },
    });
  }

  const { appleId: _aid, ...userOut } = user;
  const tokens = await issueSocialSession(user.id);
  return { ...tokens, user: userOut };
}

