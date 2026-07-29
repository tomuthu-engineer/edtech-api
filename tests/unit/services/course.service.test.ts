import { CourseStatus } from '@prisma/client';
import { courseRepository } from '@repositories/course.repository';
import { lessonRepository } from '@repositories/lesson.repository';
import { courseService } from '@services/course.service';
import { auditLogService } from '@services/auditLog.service';
import { AuthorizationError, NotFoundError, ValidationError } from '@utils/errors';
import { Role } from '@constants/roles.constant';

jest.mock('@repositories/course.repository');
jest.mock('@repositories/lesson.repository');
jest.mock('@services/auditLog.service', () => ({
  auditLogService: { record: jest.fn().mockResolvedValue(undefined) },
}));

const mockedCourseRepo = courseRepository as jest.Mocked<typeof courseRepository>;
const mockedLessonRepo = lessonRepository as jest.Mocked<typeof lessonRepository>;
const mockedAuditLogService = auditLogService as jest.Mocked<typeof auditLogService>;

const instructorActor = { actorId: 'instructor-1', roles: [Role.INSTRUCTOR] };
const staffActor = { actorId: 'staff-1', roles: [Role.ADMIN] };

function fakeCourseSummary(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'course-1',
    instructor: { id: 'instructor-1' },
    ...overrides,
  } as never;
}

describe('CourseService.changeStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('blocks publishing when the course has no lessons at all', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary());
    mockedLessonRepo.countByCourse.mockResolvedValue(0);

    const promise = courseService.changeStatus('course-1', CourseStatus.PUBLISHED, instructorActor);

    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    await expect(promise).rejects.toMatchObject({ message: expect.stringContaining('at least one lesson') });
    expect(mockedLessonRepo.countByCourse).toHaveBeenCalledWith('course-1');
    // Should fail fast on the lesson-count check without even querying for missing videos.
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).not.toHaveBeenCalled();
    expect(mockedCourseRepo.update).not.toHaveBeenCalled();
    expect(mockedAuditLogService.record).not.toHaveBeenCalled();
  });

  it('blocks publishing when a VIDEO lesson has no video uploaded', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary());
    mockedLessonRepo.countByCourse.mockResolvedValue(2);
    mockedLessonRepo.findVideoLessonsMissingVideo.mockResolvedValue([
      { id: 'lesson-1', title: 'Intro to Hooks' },
      { id: 'lesson-2', title: 'useEffect Deep Dive' },
    ] as never);

    const promise = courseService.changeStatus('course-1', CourseStatus.PUBLISHED, instructorActor);

    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    await expect(promise).rejects.toMatchObject({
      errors: [
        { field: 'lessons', message: expect.stringContaining('Intro to Hooks') },
        { field: 'lessons', message: expect.stringContaining('useEffect Deep Dive') },
      ],
    });
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).toHaveBeenCalledWith('course-1');
    expect(mockedCourseRepo.update).not.toHaveBeenCalled();
    expect(mockedAuditLogService.record).not.toHaveBeenCalled();
  });

  it('publishes when the course has lessons and every VIDEO lesson has a video uploaded', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary());
    mockedLessonRepo.countByCourse.mockResolvedValue(3);
    mockedLessonRepo.findVideoLessonsMissingVideo.mockResolvedValue([]);
    mockedCourseRepo.update.mockResolvedValue({ id: 'course-1', status: CourseStatus.PUBLISHED } as never);

    const result = await courseService.changeStatus('course-1', CourseStatus.PUBLISHED, instructorActor);

    expect(mockedCourseRepo.update).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ status: CourseStatus.PUBLISHED, publishedAt: expect.any(Date) }),
    );
    expect(mockedAuditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PUBLISH', entityType: 'Course', entityId: 'course-1' }),
    );
    expect(result).toEqual({ id: 'course-1', status: CourseStatus.PUBLISHED });
  });

  it('does not run the publish checks when moving to DRAFT', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary());
    mockedCourseRepo.update.mockResolvedValue({ id: 'course-1', status: CourseStatus.DRAFT } as never);

    await courseService.changeStatus('course-1', CourseStatus.DRAFT, instructorActor);

    expect(mockedLessonRepo.countByCourse).not.toHaveBeenCalled();
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).not.toHaveBeenCalled();
    expect(mockedCourseRepo.update).toHaveBeenCalledWith('course-1', expect.objectContaining({ status: CourseStatus.DRAFT }));
  });

  it('does not run the publish checks when archiving', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary());
    mockedCourseRepo.update.mockResolvedValue({ id: 'course-1', status: CourseStatus.ARCHIVED } as never);

    await courseService.changeStatus('course-1', CourseStatus.ARCHIVED, instructorActor);

    expect(mockedLessonRepo.countByCourse).not.toHaveBeenCalled();
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).not.toHaveBeenCalled();
    expect(mockedCourseRepo.update).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ status: CourseStatus.ARCHIVED, archivedAt: expect.any(Date) }),
    );
  });

  it('blocks even a staff (admin) actor from publishing a lesson-less course', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary({ instructor: { id: 'someone-else' } }));
    mockedLessonRepo.countByCourse.mockResolvedValue(0);

    await expect(
      courseService.changeStatus('course-1', CourseStatus.PUBLISHED, staffActor),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockedCourseRepo.update).not.toHaveBeenCalled();
  });

  it('allows staff to publish a course they do not own once lessons and videos are complete', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary({ instructor: { id: 'someone-else' } }));
    mockedLessonRepo.countByCourse.mockResolvedValue(1);
    mockedLessonRepo.findVideoLessonsMissingVideo.mockResolvedValue([]);
    mockedCourseRepo.update.mockResolvedValue({ id: 'course-1', status: CourseStatus.PUBLISHED } as never);

    await expect(courseService.changeStatus('course-1', CourseStatus.PUBLISHED, staffActor)).resolves.toBeDefined();
  });

  it('throws AuthorizationError when a non-owner, non-staff instructor tries to publish', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(fakeCourseSummary({ instructor: { id: 'someone-else' } }));

    await expect(
      courseService.changeStatus('course-1', CourseStatus.PUBLISHED, instructorActor),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(mockedLessonRepo.countByCourse).not.toHaveBeenCalled();
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the course does not exist', async () => {
    mockedCourseRepo.findSummaryById.mockResolvedValue(null);

    await expect(
      courseService.changeStatus('missing-course', CourseStatus.PUBLISHED, instructorActor),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedLessonRepo.countByCourse).not.toHaveBeenCalled();
    expect(mockedLessonRepo.findVideoLessonsMissingVideo).not.toHaveBeenCalled();
  });
});
