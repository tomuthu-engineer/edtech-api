import { CourseStatus, EnrollmentStatus, NotificationType } from '@prisma/client';
import { enrollmentRepository } from '@repositories/enrollment.repository';
import { progressRepository } from '@repositories/progress.repository';
import { courseRepository } from '@repositories/course.repository';
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '@utils/errors';
import { notificationService } from '@services/notification.service';
import { PaginationQuery } from '@utils/pagination';
import { Role, STAFF_ROLES } from '@constants/roles.constant';

class EnrollmentService {
  async enroll(userId: string, courseId: string) {
    const course = await courseRepository.findSummaryById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ValidationError('This course is not open for enrollment');
    }

    const existing = await enrollmentRepository.findActive(userId, courseId);
    if (existing && existing.status === EnrollmentStatus.ACTIVE) {
      throw new ConflictError('You are already enrolled in this course');
    }

    const enrollment = existing
      ? await enrollmentRepository.update(existing.id, {
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: new Date(),
          cancelledAt: null,
        })
      : await enrollmentRepository.create({
          user: { connect: { id: userId } },
          course: { connect: { id: courseId } },
          pricePaid: course.price,
        });

    const totalLessons = await courseRepository.countTotalLessons(courseId);
    await progressRepository.upsertCourseProgress(
      userId,
      courseId,
      { userId, courseId, totalLessons },
      { totalLessons },
    );

    await courseRepository.recalculateEnrollmentCount(courseId);

    await notificationService.dispatch({
      userIds: [userId],
      type: NotificationType.ENROLLMENT,
      title: 'Enrollment confirmed',
      body: `You're enrolled in "${course.title}". Happy learning!`,
      actionUrl: `/courses/${course.id}`,
    });

    return enrollment;
  }

  async cancel(userId: string, courseId: string) {
    const enrollment = await enrollmentRepository.findActive(userId, courseId);
    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new NotFoundError('Active enrollment');
    }

    const updated = await enrollmentRepository.update(enrollment.id, {
      status: EnrollmentStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    await courseRepository.recalculateEnrollmentCount(courseId);
    return updated;
  }

  listMyEnrollments(userId: string, query: PaginationQuery & { status?: EnrollmentStatus }) {
    return enrollmentRepository.findForUser(userId, query);
  }

  async listCourseEnrollments(
    courseId: string,
    query: PaginationQuery & { status?: EnrollmentStatus },
    requesterId: string,
    requesterRoles: Role[],
  ) {
    const course = await courseRepository.findSummaryById(courseId);
    if (!course) throw new NotFoundError('Course');

    const isStaff = requesterRoles.some((role) => STAFF_ROLES.includes(role));
    const isOwner = course.instructor.id === requesterId;
    if (!isStaff && !isOwner) {
      throw new AuthorizationError('You do not have permission to view this course roster');
    }

    return enrollmentRepository.findForCourse(courseId, query);
  }

  async hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await enrollmentRepository.findActive(userId, courseId);
    return enrollment?.status === EnrollmentStatus.ACTIVE;
  }
}

export const enrollmentService = new EnrollmentService();
