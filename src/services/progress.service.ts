import { LessonProgressStatus, NotificationType } from '@prisma/client';
import { progressRepository } from '@repositories/progress.repository';
import { lessonRepository } from '@repositories/lesson.repository';
import { enrollmentService } from '@services/enrollment.service';
import { notificationService } from '@services/notification.service';
import { NotFoundError, AuthorizationError } from '@utils/errors';

interface LessonProgressInput {
  watchTimeSec?: number;
  lastPositionSec?: number;
  status?: LessonProgressStatus;
}

class ProgressService {
  async updateLessonProgress(userId: string, lessonId: string, input: LessonProgressInput) {
    const lesson = await lessonRepository.findByIdWithCourse(lessonId);
    if (!lesson) throw new NotFoundError('Lesson');

    const courseId = lesson.module.courseId;
    if (!lesson.isPreview) {
      const hasAccess = await enrollmentService.hasActiveEnrollment(userId, courseId);
      if (!hasAccess) throw new AuthorizationError('You must be enrolled in this course to track progress');
    }

    const wasCompletedBefore = await progressRepository.findLessonProgress(userId, lessonId);
    const status = input.status ?? (wasCompletedBefore?.status || LessonProgressStatus.IN_PROGRESS);

    const lessonProgress = await progressRepository.upsertLessonProgress(
      userId,
      lessonId,
      {
        userId,
        lessonId,
        status,
        watchTimeSec: input.watchTimeSec ?? 0,
        lastPositionSec: input.lastPositionSec ?? 0,
        completedAt: status === LessonProgressStatus.COMPLETED ? new Date() : undefined,
      },
      {
        status,
        ...(input.watchTimeSec !== undefined ? { watchTimeSec: input.watchTimeSec } : {}),
        ...(input.lastPositionSec !== undefined ? { lastPositionSec: input.lastPositionSec } : {}),
        ...(status === LessonProgressStatus.COMPLETED && wasCompletedBefore?.status !== LessonProgressStatus.COMPLETED
          ? { completedAt: new Date() }
          : {}),
      },
    );

    await this.recalculateCourseProgress(userId, courseId, lessonId);

    return lessonProgress;
  }

  private async recalculateCourseProgress(userId: string, courseId: string, currentLessonId: string) {
    const [completedLessons, totalWatchTimeSec, existing] = await Promise.all([
      progressRepository.countCompletedForCourse(userId, courseId),
      progressRepository.sumWatchTimeForCourse(userId, courseId),
      progressRepository.findCourseProgress(userId, courseId),
    ]);

    const totalLessons = existing?.totalLessons ?? completedLessons;
    const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 10000) / 100 : 0;
    const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;
    const wasCompleted = existing?.isCompleted ?? false;

    const updated = await progressRepository.upsertCourseProgress(
      userId,
      courseId,
      {
        userId,
        courseId,
        currentLessonId,
        completedLessons,
        totalLessons,
        completionPercent,
        totalWatchTimeSec,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
      {
        currentLessonId,
        completedLessons,
        completionPercent,
        totalWatchTimeSec,
        isCompleted,
        lastAccessedAt: new Date(),
        ...(isCompleted && !wasCompleted ? { completedAt: new Date() } : {}),
      },
    );

    if (isCompleted && !wasCompleted) {
      await notificationService.dispatch({
        userIds: [userId],
        type: NotificationType.PROGRESS,
        title: 'Course completed! 🎉',
        body: 'Congratulations on finishing the course. Your certificate will be ready shortly.',
        actionUrl: `/courses/${courseId}`,
      });
    }

    return updated;
  }

  async getCourseProgress(userId: string, courseId: string) {
    const progress = await progressRepository.findCourseProgress(userId, courseId);
    if (!progress) throw new NotFoundError('Course progress');
    return progress;
  }

  listMyProgress(userId: string) {
    return progressRepository.listForUser(userId);
  }

  async getLessonProgress(userId: string, lessonId: string) {
    return progressRepository.findLessonProgress(userId, lessonId);
  }
}

export const progressService = new ProgressService();
