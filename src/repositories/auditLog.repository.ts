import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

export interface CreateAuditLogInput {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogRepository {
  create(data: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: { ...data, metadata: data.metadata as Prisma.InputJsonValue } satisfies Prisma.AuditLogUncheckedCreateInput,
    });
  }

  async findMany(filters: PaginationQuery & { entityType?: string; action?: AuditAction; actorId?: string }) {
    const { skip, take, page, limit } = toSkipTake(filters);
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}

export const auditLogRepository = new AuditLogRepository();
