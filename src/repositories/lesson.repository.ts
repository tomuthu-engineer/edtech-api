import { Lesson, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

const lessonWithResourcesInclude = {
  resources: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.LessonInclude;

export type LessonWithResources = Prisma.LessonGetPayload<{ include: typeof lessonWithResourcesInclude }>;

class LessonRepository {
  findByModule(moduleId: string): Promise<LessonWithResources[]> {
    return prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { sortOrder: 'asc' },
      include: lessonWithResourcesInclude,
    });
  }

  findById(id: string): Promise<LessonWithResources | null> {
    return prisma.lesson.findUnique({ where: { id }, include: lessonWithResourcesInclude });
  }

  findByIdWithCourse(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
  }

  async nextSortOrder(moduleId: string): Promise<number> {
    const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { sortOrder: 'desc' } });
    return (last?.sortOrder ?? -1) + 1;
  }

  /** VIDEO-content lessons across a course's modules that have no video uploaded yet — used to gate publishing. */
  findVideoLessonsMissingVideo(courseId: string): Promise<Pick<Lesson, 'id' | 'title'>[]> {
    return prisma.lesson.findMany({
      where: { module: { courseId }, contentType: 'VIDEO', videoKey: null },
      select: { id: true, title: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Total lesson count across a course's modules — used to gate publishing on having any curriculum at all. */
  countByCourse(courseId: string): Promise<number> {
    return prisma.lesson.count({ where: { module: { courseId } } });
  }

  create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return prisma.lesson.create({ data });
  }

  update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return prisma.lesson.update({ where: { id }, data });
  }

  delete(id: string): Promise<Lesson> {
    return prisma.lesson.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.lesson.update({ where: { id }, data: { sortOrder: index } })),
    );
  }
}

export const lessonRepository = new LessonRepository();
