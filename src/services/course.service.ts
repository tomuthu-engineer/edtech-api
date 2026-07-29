import { Course, CourseStatus, FileEntityType } from '@prisma/client';
import { courseRepository, CourseListFilters } from '@repositories/course.repository';
import { lessonRepository } from '@repositories/lesson.repository';
import { storageService } from '@storage/storage.service';
import { auditLogService } from '@services/auditLog.service';
import { NotFoundError, AuthorizationError, ValidationError } from '@utils/errors';
import { slugify, uniqueSlug } from '@utils/slugify';
import { Role, STAFF_ROLES } from '@constants/roles.constant';

export interface CourseInput {
  title: string;
  subtitle?: string;
  description: string;
  categoryId?: string;
  difficulty?: Course['difficulty'];
  price?: number;
  discountPrice?: number;
  currency?: string;
  durationMinutes?: number;
  learningOutcomes?: string[];
  requirements?: string[];
  language?: string;
}

interface ActorContext {
  actorId: string;
  roles: Role[];
  ipAddress?: string;
  userAgent?: string;
}

class CourseService {
  async list(filters: CourseListFilters, requesterRoles: Role[] = []) {
    // Public/student callers only ever see published courses regardless of what they ask for.
    const isStaffOrInstructor = requesterRoles.some((r) =>
      [...STAFF_ROLES, Role.INSTRUCTOR].includes(r),
    );
    const effectiveFilters = isStaffOrInstructor ? filters : { ...filters, status: CourseStatus.PUBLISHED };

    return courseRepository.findMany(effectiveFilters);
  }

  async getById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) throw new NotFoundError('Course');
    return course;
  }

  async getBySlug(slug: string) {
    const course = await courseRepository.findBySlug(slug);
    if (!course) throw new NotFoundError('Course');
    return course;
  }

  async create(input: CourseInput, actor: ActorContext) {
    const slug = uniqueSlug(input.title);

    const course = await courseRepository.create({
      title: input.title,
      slug,
      subtitle: input.subtitle,
      description: input.description,
      difficulty: input.difficulty,
      price: input.price ?? 0,
      discountPrice: input.discountPrice,
      currency: input.currency ?? 'USD',
      durationMinutes: input.durationMinutes ?? 0,
      learningOutcomes: input.learningOutcomes ?? [],
      requirements: input.requirements ?? [],
      language: input.language ?? 'en',
      instructor: { connect: { id: actor.actorId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
    });

    await auditLogService.record({
      actorId: actor.actorId,
      action: 'CREATE',
      entityType: 'Course',
      entityId: course.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return course;
  }

  async update(id: string, input: Partial<CourseInput>, actor: ActorContext) {
    const course = await this.assertEditable(id, actor);

    const updated = await courseRepository.update(course.id, {
      ...(input.title ? { title: input.title, slug: slugify(input.title) } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.discountPrice !== undefined ? { discountPrice: input.discountPrice } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.learningOutcomes !== undefined ? { learningOutcomes: input.learningOutcomes } : {}),
      ...(input.requirements !== undefined ? { requirements: input.requirements } : {}),
      ...(input.categoryId !== undefined ? { category: { connect: { id: input.categoryId } } } : {}),
    });

    await auditLogService.record({
      actorId: actor.actorId,
      action: 'UPDATE',
      entityType: 'Course',
      entityId: id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async changeStatus(id: string, status: CourseStatus, actor: ActorContext) {
    const course = await this.assertEditable(id, actor);

    if (status === CourseStatus.PUBLISHED) {
      const lessonCount = await lessonRepository.countByCourse(course.id);
      if (lessonCount === 0) {
        throw new ValidationError('Add at least one lesson before the course can be published');
      }

      const missingVideos = await lessonRepository.findVideoLessonsMissingVideo(course.id);
      if (missingVideos.length > 0) {
        throw new ValidationError(
          'Every video lesson needs its video uploaded before the course can be published',
          missingVideos.map((lesson) => ({ field: 'lessons', message: `"${lesson.title}" has no video uploaded` })),
        );
      }
    }

    const timestampField =
      status === CourseStatus.PUBLISHED
        ? { publishedAt: new Date() }
        : status === CourseStatus.ARCHIVED
          ? { archivedAt: new Date() }
          : {};

    const updated = await courseRepository.update(course.id, { status, ...timestampField });

    await auditLogService.record({
      actorId: actor.actorId,
      action: status === CourseStatus.PUBLISHED ? 'PUBLISH' : status === CourseStatus.ARCHIVED ? 'ARCHIVE' : 'UPDATE',
      entityType: 'Course',
      entityId: id,
      metadata: { status },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }

  async uploadThumbnail(id: string, file: { buffer: Buffer; originalName: string; mimeType: string; size: number }, actor: ActorContext) {
    const course = await this.assertEditable(id, actor);
    const result = await storageService.replace(course.thumbnailKey, {
      ...file,
      entityType: FileEntityType.COURSE_THUMBNAIL,
      uploadedBy: actor.actorId,
    });
    return courseRepository.update(course.id, { thumbnailKey: result.key });
  }

  async uploadBanner(id: string, file: { buffer: Buffer; originalName: string; mimeType: string; size: number }, actor: ActorContext) {
    const course = await this.assertEditable(id, actor);
    const result = await storageService.replace(course.bannerKey, {
      ...file,
      entityType: FileEntityType.COURSE_BANNER,
      uploadedBy: actor.actorId,
    });
    return courseRepository.update(course.id, { bannerKey: result.key });
  }

  async remove(id: string, actor: ActorContext) {
    await this.assertEditable(id, actor);
    await courseRepository.softDelete(id);
    await auditLogService.record({
      actorId: actor.actorId,
      action: 'DELETE',
      entityType: 'Course',
      entityId: id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  /** Instructors may only edit their own courses; staff can edit anything. */
  async assertEditable(id: string, actor: ActorContext) {
    const course = await courseRepository.findSummaryById(id);
    if (!course) throw new NotFoundError('Course');

    const isStaff = actor.roles.some((role) => STAFF_ROLES.includes(role));
    const isOwner = course.instructor.id === actor.actorId;

    if (!isStaff && !isOwner) {
      throw new AuthorizationError('You do not have permission to modify this course');
    }

    return course;
  }
}

export const courseService = new CourseService();
