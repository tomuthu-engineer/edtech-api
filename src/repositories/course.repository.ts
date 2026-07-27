import { Course, CourseDifficulty, CourseStatus, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { toSkipTake, PaginationQuery } from '@utils/pagination';

export interface CourseListFilters extends PaginationQuery {
  search?: string;
  categoryId?: string;
  instructorId?: string;
  status?: CourseStatus;
  difficulty?: CourseDifficulty;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
}

const courseSummaryInclude = {
  category: { select: { id: true, name: true, slug: true } },
  instructor: { select: { id: true, firstName: true, lastName: true, avatarKey: true } },
} satisfies Prisma.CourseInclude;

const courseDetailInclude = {
  ...courseSummaryInclude,
  modules: {
    orderBy: { sortOrder: 'asc' },
    include: { lessons: { orderBy: { sortOrder: 'asc' }, include: { resources: true } } },
  },
} satisfies Prisma.CourseInclude;

export type CourseSummary = Prisma.CourseGetPayload<{ include: typeof courseSummaryInclude }>;
export type CourseDetail = Prisma.CourseGetPayload<{ include: typeof courseDetailInclude }>;

function sortOrderClause(sortBy: CourseListFilters['sortBy']): Prisma.CourseOrderByWithRelationInput {
  switch (sortBy) {
    case 'popular':
      return { enrollmentCount: 'desc' };
    case 'rating':
      return { averageRating: 'desc' };
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

class CourseRepository {
  async findMany(filters: CourseListFilters) {
    const { skip, take, page, limit } = toSkipTake(filters);

    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.instructorId ? { instructorId: filters.instructorId } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { subtitle: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: courseSummaryInclude,
        orderBy: sortOrderClause(filters.sortBy),
        skip,
        take,
      }),
      prisma.course.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string): Promise<CourseDetail | null> {
    return prisma.course.findUnique({ where: { id }, include: courseDetailInclude });
  }

  findBySlug(slug: string): Promise<CourseDetail | null> {
    return prisma.course.findUnique({ where: { slug }, include: courseDetailInclude });
  }

  findSummaryById(id: string): Promise<CourseSummary | null> {
    return prisma.course.findUnique({ where: { id }, include: courseSummaryInclude });
  }

  create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  }

  update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return prisma.course.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async recalculateEnrollmentCount(courseId: string): Promise<void> {
    const count = await prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } });
    await prisma.course.update({ where: { id: courseId }, data: { enrollmentCount: count } });
  }

  async countTotalLessons(courseId: string): Promise<number> {
    return prisma.lesson.count({ where: { module: { courseId } } });
  }
}

export const courseRepository = new CourseRepository();
