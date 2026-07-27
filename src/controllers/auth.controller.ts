import { Request, Response } from 'express';
import { OtpPurpose } from '@prisma/client';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { authService } from '@services/auth.service';
import { userRepository } from '@repositories/user.repository';
import { AuthenticationError, NotFoundError } from '@utils/errors';
import { decodeToken } from '@utils/jwt';
import { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } from '@utils/cookies';
import { AuthTokens, DeviceContext } from '@dto/auth.dto';
import { toSanitizedUser } from '@utils/mappers/user.mapper';

function deviceContext(req: Request): DeviceContext {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

function applyRefreshCookie(res: Response, tokens: AuthTokens): void {
  const decoded = decodeToken<{ exp: number }>(tokens.refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  setRefreshTokenCookie(res, tokens.refreshToken, expiresAt);
}

function extractRefreshToken(req: Request): string {
  const fromBody = req.body?.refreshToken as string | undefined;
  const fromCookie = getRefreshTokenFromCookie(req.cookies);
  const token = fromBody ?? fromCookie;
  if (!token) throw new AuthenticationError('Refresh token is required');
  return token;
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    applyRefreshCookie(res, result.tokens);
    ApiResponse.created(res, 'Registration successful. Please verify your email.', result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, deviceContext(req));
    applyRefreshCookie(res, result.tokens);
    ApiResponse.success(res, { message: 'Login successful', data: result });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = extractRefreshToken(req);
    const tokens = await authService.refresh(refreshToken, deviceContext(req));
    applyRefreshCookie(res, tokens);
    ApiResponse.success(res, { message: 'Token refreshed', data: tokens });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken ?? getRefreshTokenFromCookie(req.cookies);
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshTokenCookie(res);
    ApiResponse.success(res, { message: 'Logged out successfully', data: null });
  }),

  logoutAllDevices: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAllDevices(req.user!.id);
    clearRefreshTokenCookie(res);
    ApiResponse.success(res, { message: 'Logged out from all devices', data: null });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    ApiResponse.success(res, {
      message: 'If an account with that email exists, a reset code has been sent',
      data: null,
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
    ApiResponse.success(res, { message: 'Password reset successfully', data: null });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.user!.id, req.body.otp);
    ApiResponse.success(res, { message: 'Email verified successfully', data: null });
  }),

  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    const purpose = req.body.purpose as OtpPurpose;
    const user = req.user
      ? await userRepository.findById(req.user.id)
      : await userRepository.findByEmail(req.body.email);

    if (!user) throw new NotFoundError('User');

    await authService.resendOtp(user.id, user.email, purpose);
    ApiResponse.success(res, { message: 'Verification code sent', data: null });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.id);
    if (!user) throw new NotFoundError('User');
    ApiResponse.success(res, { message: 'Current user', data: toSanitizedUser(user) });
  }),
};
