import bcrypt from 'bcryptjs';
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
} from './auth.dto';
import { env } from '../../config/env';

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
    throw new Error('Email already registered');
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
  storeOTP(dto.email, otp);

  try {
    await sendVerificationEmail(dto.email, otp);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  return user;
}

export async function verifyEmail(dto: VerifyEmailDtoType) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    throw new Error('Email already verified');
  }

  const isValid = verifyOTP(dto.email, dto.otp);
  if (!isValid) {
    throw new Error('Invalid or expired OTP');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { message: 'Email verified successfully' };
}

export async function login(dto: LoginDtoType) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new Error('Please verify your email before logging in');
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
    throw new Error('Invalid refresh token');
  }

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new Error('Refresh token expired');
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken(payload.userId);
    return { accessToken };
  } catch {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new Error('Invalid refresh token');
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
  storeOTP(email, otp);

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
    throw new Error('Invalid or expired OTP');
  }

  const isValid = verifyOTP(dto.email, dto.otp);
  if (!isValid) {
    throw new Error('Invalid or expired OTP');
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

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      church: true,
      creditBalance: true,
      storageUsed: true,
      storageLimit: true,
      plan: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
