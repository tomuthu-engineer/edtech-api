import { Enrollment, EnrollmentStatus, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

class EnrollmentRepository {
  findActive(userId: string, courseId: string): Promise<Enrollment | null> {
    return prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  }

  create(data: Prisma.EnrollmentCreateInput): Promise<Enrollment> {
    return prisma.enrollment.create({ data });
  }

  update(id: string, data: Prisma.EnrollmentUpdateInput): Promise<Enrollment> {
    return prisma.enrollment.update({ where: { id }, data });
  }

  async findForUser(userId: string, query: PaginationQuery & { status?: EnrollmentStatus }) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnailKey: true, instructor: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findActiveUserIdsForCourse(courseId: string): Promise<string[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: EnrollmentStatus.ACTIVE },
      select: { userId: true },
    });
    return enrollments.map((e) => e.userId);
  }

  async findForCourse(courseId: string, query: PaginationQuery & { status?: EnrollmentStatus }) {
    const { skip, take, page, limit } = toSkipTake(query);
    const where: Prisma.EnrollmentWhereInput = {
      courseId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarKey: true } } },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}

export const enrollmentRepository = new EnrollmentRepository();
