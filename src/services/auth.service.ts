import { OtpPurpose } from '@prisma/client';
import { userRepository, toRoleNames } from '@repositories/user.repository';
import { refreshTokenRepository } from '@repositories/refreshToken.repository';
import { otpService } from '@services/otp.service';
import { hashPassword, comparePassword, hashToken } from '@utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@utils/jwt';
import { AuthenticationError, ConflictError, ValidationError } from '@utils/errors';
import { Role } from '@constants/roles.constant';
import { env } from '@config/env';
import { toSanitizedUser } from '@utils/mappers/user.mapper';
import { AuthResult, AuthTokens, DeviceContext, LoginInput, RegisterInput } from '@dto/auth.dto';
import { enqueueEmail } from '@queues/producers/email.producer';
import { welcomeEmailTemplate, passwordChangedEmailTemplate } from '@emails/templates/welcome.template';
import { randomUUID } from 'crypto';
import ms from 'ms';

function refreshExpiryDate(rememberMe: boolean): Date {
  const duration = rememberMe ? env.JWT_REFRESH_EXPIRES_IN_REMEMBER : env.JWT_REFRESH_EXPIRES_IN;
  return new Date(Date.now() + (ms(duration) as number));
}

class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      roleNames: [Role.STUDENT],
    });

    const { subject, html } = welcomeEmailTemplate(user.firstName);
    await enqueueEmail({ to: user.email, subject, html });
    await otpService.generateAndSend(user.id, user.email, OtpPurpose.EMAIL_VERIFICATION);

    const tokens = await this.issueTokens(user.id, user.email, toRoleNames(user), false, {});

    return { user: toSanitizedUser(user), tokens };
  }

  async login(input: LoginInput, context: DeviceContext): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED' || user.status === 'DEACTIVATED') {
      throw new AuthenticationError(`Your account is ${user.status.toLowerCase()}. Contact support.`);
    }

    await userRepository.recordLogin(user.id, context.ipAddress);

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      toRoleNames(user),
      input.rememberMe ?? false,
      { ...context, deviceId: input.deviceId, deviceName: input.deviceName },
    );

    return { user: toSanitizedUser(user), tokens };
  }

  async refresh(refreshToken: string, context: DeviceContext): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
      throw new AuthenticationError('Refresh token is no longer valid');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) throw new AuthenticationError('User no longer exists');

    // Rotate: revoke the used token and issue a fresh pair — limits replay window if leaked.
    await refreshTokenRepository.revoke(stored.id);

    return this.issueTokens(user.id, user.email, toRoleNames(user), stored.rememberMe, {
      ...context,
      deviceId: stored.deviceId ?? undefined,
      deviceName: stored.deviceName ?? undefined,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const stored = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (stored && !stored.isRevoked) {
      await refreshTokenRepository.revoke(stored.id);
    }
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Always resolve successfully — do not leak whether an email is registered.
    if (!user) return;
    await otpService.generateAndSend(user.id, user.email, OtpPurpose.PASSWORD_RESET);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ValidationError('Invalid OTP code');

    await otpService.verify(user.id, OtpPurpose.PASSWORD_RESET, otp);

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await refreshTokenRepository.revokeAllForUser(user.id);

    const { subject, html } = passwordChangedEmailTemplate();
    await enqueueEmail({ to: user.email, subject, html });
  }

  async verifyEmail(userId: string, otp: string): Promise<void> {
    await otpService.verify(userId, OtpPurpose.EMAIL_VERIFICATION, otp);
    await userRepository.markEmailVerified(userId);
  }

  async resendOtp(userId: string, email: string, purpose: OtpPurpose): Promise<void> {
    await otpService.generateAndSend(userId, email, purpose);
  }

  private async issueTokens(
    userId: string,
    email: string,
    roles: Role[],
    rememberMe: boolean,
    context: DeviceContext & { deviceId?: string; deviceName?: string },
  ): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: userId, email, roles });
    const refreshTokenJti = randomUUID();
    const refreshToken = signRefreshToken({ sub: userId, jti: refreshTokenJti }, rememberMe);

    await refreshTokenRepository.create({
      userId,
      tokenHash: hashToken(refreshToken),
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      rememberMe,
      expiresAt: refreshExpiryDate(rememberMe),
    });

    return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_EXPIRES_IN };
  }
}

export const authService = new AuthService();
