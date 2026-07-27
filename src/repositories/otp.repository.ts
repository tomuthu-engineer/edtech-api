import { OtpCode, OtpPurpose } from '@prisma/client';
import { prisma } from '@config/database';

class OtpRepository {
  create(data: { userId: string; codeHash: string; purpose: OtpPurpose; expiresAt: Date }): Promise<OtpCode> {
    return prisma.otpCode.create({ data });
  }

  findLatestActive(userId: string, purpose: OtpPurpose): Promise<OtpCode | null> {
    return prisma.otpCode.findFirst({
      where: { userId, purpose, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempts(id: string): Promise<OtpCode> {
    return prisma.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async markUsed(id: string): Promise<void> {
    await prisma.otpCode.update({ where: { id }, data: { isUsed: true } });
  }

  async invalidateActiveForPurpose(userId: string, purpose: OtpPurpose): Promise<void> {
    await prisma.otpCode.updateMany({
      where: { userId, purpose, isUsed: false },
      data: { isUsed: true },
    });
  }
}

export const otpRepository = new OtpRepository();
