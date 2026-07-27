import { Response } from 'express';
import { isProduction } from '@config/env';

const REFRESH_COOKIE_NAME = 'refresh_token';

/** Web clients (admin portal) can rely on this cookie; mobile uses the JSON body token instead. */
export function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api/v1/auth',
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

export function getRefreshTokenFromCookie(cookies: Record<string, string> | undefined): string | undefined {
  return cookies?.[REFRESH_COOKIE_NAME];
}
