import { AttendeeRole, LiveAttendee, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

const attendeeWithUserInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatarKey: true } },
} satisfies Prisma.LiveAttendeeInclude;

export type LiveAttendeeWithUser = Prisma.LiveAttendeeGetPayload<{ include: typeof attendeeWithUserInclude }>;

class LiveAttendeeRepository {
  findByUser(liveSessionId: string, userId: string): Promise<LiveAttendee | null> {
    return prisma.liveAttendee.findUnique({
      where: { liveSessionId_userId: { liveSessionId, userId } },
    });
  }

  upsertJoin(liveSessionId: string, userId: string, role: AttendeeRole): Promise<LiveAttendee> {
    return prisma.liveAttendee.upsert({
      where: { liveSessionId_userId: { liveSessionId, userId } },
      create: { liveSessionId, userId, role, joinedAt: new Date() },
      update: { joinedAt: new Date(), leftAt: null },
    });
  }

  async recordLeave(liveSessionId: string, userId: string): Promise<void> {
    const attendee = await this.findByUser(liveSessionId, userId);
    if (!attendee?.joinedAt) return;

    const durationSec = Math.round((Date.now() - attendee.joinedAt.getTime()) / 1000);
    await prisma.liveAttendee.update({
      where: { id: attendee.id },
      data: { leftAt: new Date(), durationSec: { increment: durationSec } },
    });
  }

  findBySession(liveSessionId: string): Promise<LiveAttendeeWithUser[]> {
    return prisma.liveAttendee.findMany({
      where: { liveSessionId },
      include: attendeeWithUserInclude,
      orderBy: { joinedAt: 'asc' },
    });
  }

  count(liveSessionId: string): Promise<number> {
    return prisma.liveAttendee.count({ where: { liveSessionId } });
  }
}

export const liveAttendeeRepository = new LiveAttendeeRepository();
