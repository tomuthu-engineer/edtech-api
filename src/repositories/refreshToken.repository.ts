import { RefreshToken } from '@prisma/client';
import { prisma } from '@config/database';

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  deviceId?: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  rememberMe: boolean;
  expiresAt: Date;
}

class RefreshTokenRepository {
  create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  findActiveByUser(userId: string): Promise<RefreshToken[]> {
    return prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
