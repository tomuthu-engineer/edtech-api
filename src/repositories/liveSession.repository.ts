import { LiveSession, LiveSessionStatus, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

export interface LiveSessionListFilters extends PaginationQuery {
  courseId?: string;
  status?: LiveSessionStatus;
  hostId?: string;
  search?: string;
}

const liveSessionInclude = {
  host: { select: { id: true, firstName: true, lastName: true, avatarKey: true } },
  course: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.LiveSessionInclude;

export type LiveSessionWithRelations = Prisma.LiveSessionGetPayload<{ include: typeof liveSessionInclude }>;

class LiveSessionRepository {
  async findMany(filters: LiveSessionListFilters) {
    const { skip, take, page, limit } = toSkipTake(filters);
    const where: Prisma.LiveSessionWhereInput = {
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.hostId ? { hostId: filters.hostId } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.liveSession.findMany({
        where,
        include: liveSessionInclude,
        orderBy: { scheduledStart: 'asc' },
        skip,
        take,
      }),
      prisma.liveSession.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string): Promise<LiveSessionWithRelations | null> {
    return prisma.liveSession.findUnique({ where: { id }, include: liveSessionInclude });
  }

  create(data: Prisma.LiveSessionCreateInput): Promise<LiveSession> {
    return prisma.liveSession.create({ data });
  }

  update(id: string, data: Prisma.LiveSessionUpdateInput): Promise<LiveSession> {
    return prisma.liveSession.update({ where: { id }, data });
  }
}

export const liveSessionRepository = new LiveSessionRepository();
