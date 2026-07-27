import { CourseProgress, LessonProgress, LessonProgressStatus, Prisma } from '@prisma/client';
import { prisma } from '@config/database';

class ProgressRepository {
  // ---- Course-level ----------------------------------------------------------

  findCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    return prisma.courseProgress.findUnique({ where: { userId_courseId: { userId, courseId } } });
  }

  upsertCourseProgress(
    userId: string,
    courseId: string,
    create: Prisma.CourseProgressUncheckedCreateInput,
    update: Prisma.CourseProgressUpdateInput,
  ): Promise<CourseProgress> {
    return prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      create,
      update,
    });
  }

  listForUser(userId: string): Promise<CourseProgress[]> {
    return prisma.courseProgress.findMany({ where: { userId }, orderBy: { lastAccessedAt: 'desc' } });
  }

  // ---- Lesson-level ------------------------------------------------------

  findLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    return prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  }

  upsertLessonProgress(
    userId: string,
    lessonId: string,
    create: Prisma.LessonProgressUncheckedCreateInput,
    update: Prisma.LessonProgressUpdateInput,
  ): Promise<LessonProgress> {
    return prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create,
      update,
    });
  }

  countCompletedForCourse(userId: string, courseId: string): Promise<number> {
    return prisma.lessonProgress.count({
      where: {
        userId,
        status: LessonProgressStatus.COMPLETED,
        lesson: { module: { courseId } },
      },
    });
  }

  sumWatchTimeForCourse(userId: string, courseId: string): Promise<number> {
    return prisma.lessonProgress
      .aggregate({
        where: { userId, lesson: { module: { courseId } } },
        _sum: { watchTimeSec: true },
      })
      .then((result) => result._sum.watchTimeSec ?? 0);
  }
}

export const progressRepository = new ProgressRepository();
