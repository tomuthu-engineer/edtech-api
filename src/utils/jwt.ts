import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { Role } from '@constants/roles.constant';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: Role[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

const commonOptions = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
} as const;

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    ...commonOptions,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type'>,
  rememberMe: boolean,
): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    ...commonOptions,
    expiresIn: rememberMe ? env.JWT_REFRESH_EXPIRES_IN_REMEMBER : env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET, commonOptions) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, commonOptions) as RefreshTokenPayload;
}

export function decodeToken<T>(token: string): T | null {
  return jwt.decode(token) as T | null;
}
