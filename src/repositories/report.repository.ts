import { Prisma, Report, ReportStatus, ReportTargetType } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

class ReportRepository {
  create(data: Prisma.ReportCreateInput): Promise<Report> {
    return prisma.report.create({ data });
  }

  findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({ where: { id } });
  }

  async findMany(query: PaginationQuery & { status?: ReportStatus; targetType?: ReportTargetType }) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          post: { select: { id: true, content: true } },
          comment: { select: { id: true, content: true } },
          reply: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  resolve(id: string, status: ReportStatus, reviewedById: string, resolutionNote?: string): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data: { status, reviewedById, reviewedAt: new Date(), resolutionNote },
    });
  }
}

export const reportRepository = new ReportRepository();
