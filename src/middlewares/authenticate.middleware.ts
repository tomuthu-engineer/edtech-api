import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@utils/jwt';
import { AuthenticationError } from '@utils/errors';
import { asyncHandler } from '@utils/asyncHandler';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
}

/** Requires a valid access token; populates req.user. */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AuthenticationError('Missing or invalid Authorization header');
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, roles: payload.roles };
      next();
    } catch {
      throw new AuthenticationError('Invalid or expired access token');
    }
  },
);

/** Populates req.user if a valid token is present, but never rejects. */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) return next();

    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, roles: payload.roles };
    } catch {
      // Ignore invalid tokens on optional auth routes.
    }
    next();
  },
);
