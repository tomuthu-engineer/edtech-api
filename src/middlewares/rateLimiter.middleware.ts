import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '@config/env';
import { ApiResponse } from '@utils/ApiResponse';

function tooManyRequestsHandler(_req: Request, res: Response): void {
  ApiResponse.error(res, {
    message: 'Too many requests, please try again later',
    statusCode: 429,
  });
}

/** General API-wide throttle. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

/** Tighter throttle for auth endpoints (login/register/otp) to blunt brute force. */
export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: tooManyRequestsHandler,
});

/** Stricter still for OTP/password-reset requests, which are cheap to abuse. */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});
