import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as string,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as string,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  return decoded;
}
