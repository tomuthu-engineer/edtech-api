import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '@middlewares/authenticate.middleware';
import { validateRequest } from '@middlewares/validateRequest.middleware';
import { authRateLimiter, otpRateLimiter } from '@middlewares/rateLimiter.middleware';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  logoutValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendOtpValidator,
} from '@validators/auth.validator';

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new student account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterBody' }
 *     responses:
 *       201: { description: Registered and logged in }
 */
authRouter.post('/register', authRateLimiter, validateRequest(registerValidator), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginBody' }
 *     responses:
 *       200: { description: Logged in }
 */
authRouter.post('/login', authRateLimiter, validateRequest(loginValidator), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access/refresh token pair
 *     description: >
 *       The refresh token can be supplied in the JSON body OR read from the
 *       httpOnly `refresh_token` cookie set on login — the body field is
 *       optional if you're testing with a browser session that already has
 *       that cookie.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefreshTokenBody' }
 *     responses:
 *       200: { description: Token refreshed }
 */
authRouter.post('/refresh', validateRequest(refreshTokenValidator), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current device's refresh token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LogoutBody' }
 *     responses:
 *       200: { description: Logged out }
 */
authRouter.post('/logout', validateRequest(logoutValidator), authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke every refresh token for the current user (all devices)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out everywhere }
 */
authRouter.post('/logout-all', authenticate, authController.logoutAllDevices);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ForgotPasswordBody' }
 *     responses:
 *       200: { description: Reset code sent if the account exists }
 */
authRouter.post(
  '/forgot-password',
  otpRateLimiter,
  validateRequest(forgotPasswordValidator),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a valid OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordBody' }
 *     responses:
 *       200: { description: Password reset }
 */
authRouter.post(
  '/reset-password',
  otpRateLimiter,
  validateRequest(resetPasswordValidator),
  authController.resetPassword,
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify the current user's email using an OTP
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyEmailBody' }
 *     responses:
 *       200: { description: Email verified }
 */
authRouter.post('/verify-email', authenticate, validateRequest(verifyEmailValidator), authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend an OTP for email verification or password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResendOtpBody' }
 *     responses:
 *       200: { description: OTP resent }
 */
authRouter.post(
  '/resend-otp',
  otpRateLimiter,
  optionalAuthenticate,
  validateRequest(resendOtpValidator),
  authController.resendOtp,
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 */
authRouter.get('/me', authenticate, authController.me);
