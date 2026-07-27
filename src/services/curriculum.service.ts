import { FileEntityType, LessonContentType } from '@prisma/client';
import { moduleRepository } from '@repositories/module.repository';
import { lessonRepository } from '@repositories/lesson.repository';
import { lessonResourceRepository } from '@repositories/lessonResource.repository';
import { courseService } from '@services/course.service';
import { enrollmentService } from '@services/enrollment.service';
import { storageService } from '@storage/storage.service';
import { NotFoundError, ValidationError, AuthorizationError } from '@utils/errors';
import { Role, STAFF_ROLES } from '@constants/roles.constant';

interface ActorContext {
  actorId: string;
  roles: Role[];
}

interface ModuleInput {
  title: string;
  description?: string;
}

interface LessonInput {
  title: string;
  description?: string;
  contentType?: LessonContentType;
  articleContent?: string;
  externalUrl?: string;
  isPreview?: boolean;
  isLocked?: boolean;
}

interface ResourceInput {
  title: string;
  externalUrl?: string;
}

type UploadableFile = { buffer: Buffer; originalName: string; mimeType: string; size: number };

class CurriculumService {
  // ---- Modules -------------------------------------------------------------

  listModules(courseId: string) {
    return moduleRepository.findByCourse(courseId);
  }

  async createModule(courseId: string, input: ModuleInput, actor: ActorContext) {
    await courseService.assertEditable(courseId, actor);
    const sortOrder = await moduleRepository.nextSortOrder(courseId);
    return moduleRepository.create({
      title: input.title,
      description: input.description,
      sortOrder,
      course: { connect: { id: courseId } },
    });
  }

  async updateModule(moduleId: string, input: Partial<ModuleInput>, actor: ActorContext) {
    const module_ = await this.getModuleOrThrow(moduleId);
    await courseService.assertEditable(module_.courseId, actor);
    return moduleRepository.update(moduleId, input);
  }

  async deleteModule(moduleId: string, actor: ActorContext) {
    const module_ = await this.getModuleOrThrow(moduleId);
    await courseService.assertEditable(module_.courseId, actor);
    await moduleRepository.delete(moduleId);
  }

  async reorderModules(courseId: string, orderedIds: string[], actor: ActorContext) {
    await courseService.assertEditable(courseId, actor);
    await moduleRepository.reorder(orderedIds);
  }

  // ---- Lessons ---------------------------------------------------------------

  listLessons(moduleId: string) {
    return lessonRepository.findByModule(moduleId);
  }

  async createLesson(moduleId: string, input: LessonInput, actor: ActorContext) {
    const module_ = await this.getModuleOrThrow(moduleId);
    await courseService.assertEditable(module_.courseId, actor);
    const sortOrder = await lessonRepository.nextSortOrder(moduleId);

    return lessonRepository.create({
      title: input.title,
      description: input.description,
      contentType: input.contentType ?? LessonContentType.VIDEO,
      articleContent: input.articleContent,
      externalUrl: input.externalUrl,
      isPreview: input.isPreview ?? false,
      isLocked: input.isLocked ?? true,
      sortOrder,
      module: { connect: { id: moduleId } },
    });
  }

  async updateLesson(lessonId: string, input: Partial<LessonInput>, actor: ActorContext) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);
    return lessonRepository.update(lessonId, input);
  }

  async deleteLesson(lessonId: string, actor: ActorContext) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);
    await lessonRepository.delete(lessonId);
  }

  async reorderLessons(moduleId: string, orderedIds: string[], actor: ActorContext) {
    const module_ = await this.getModuleOrThrow(moduleId);
    await courseService.assertEditable(module_.courseId, actor);
    await lessonRepository.reorder(orderedIds);
  }

  /** Called after the client finishes a signed-URL upload for a lesson video. */
  async attachLessonVideo(lessonId: string, key: string, durationSec: number | undefined, actor: ActorContext) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);

    if (lesson.videoKey) {
      await storageService.delete(lesson.videoKey).catch(() => undefined);
    }

    return lessonRepository.update(lessonId, {
      videoKey: key,
      videoDurationSec: durationSec,
      contentType: LessonContentType.VIDEO,
    });
  }

  /** Gates playback behind enrollment (or preview/staff/ownership) before minting a signed URL. */
  async getLessonVideoUrl(lessonId: string, actor: ActorContext) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    if (!lesson.videoKey) throw new NotFoundError('Lesson video');

    const isStaff = actor.roles.some((role) => STAFF_ROLES.includes(role));
    const isOwner = lesson.module.course.instructorId === actor.actorId;

    if (!lesson.isPreview && !isStaff && !isOwner) {
      const hasAccess = await enrollmentService.hasActiveEnrollment(actor.actorId, lesson.module.courseId);
      if (!hasAccess) {
        throw new AuthorizationError('You must be enrolled in this course to watch this lesson');
      }
    }

    const url = await storageService.generateSignedDownloadUrl(lesson.videoKey);
    return { url };
  }

  async uploadLessonThumbnail(lessonId: string, file: UploadableFile, actor: ActorContext) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);

    const result = await storageService.replace(lesson.thumbnailKey, {
      ...file,
      entityType: FileEntityType.LESSON_THUMBNAIL,
      uploadedBy: actor.actorId,
    });

    return lessonRepository.update(lessonId, { thumbnailKey: result.key });
  }

  // ---- Resources ---------------------------------------------------------

  listResources(lessonId: string) {
    return lessonResourceRepository.findByLesson(lessonId);
  }

  async addResource(
    lessonId: string,
    input: ResourceInput,
    file: UploadableFile | undefined,
    actor: ActorContext,
  ) {
    const lesson = await this.getLessonWithCourseOrThrow(lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);

    if (!file && !input.externalUrl) {
      throw new ValidationError('Provide either a file or an externalUrl for the resource');
    }

    if (file) {
      const uploadResult = await storageService.upload({
        ...file,
        entityType: FileEntityType.LESSON_RESOURCE,
        uploadedBy: actor.actorId,
      });

      return lessonResourceRepository.create({
        title: input.title,
        fileKey: uploadResult.key,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.size,
        lesson: { connect: { id: lessonId } },
      });
    }

    return lessonResourceRepository.create({
      title: input.title,
      externalUrl: input.externalUrl,
      lesson: { connect: { id: lessonId } },
    });
  }

  async removeResource(resourceId: string, actor: ActorContext) {
    const resource = await lessonResourceRepository.findById(resourceId);
    if (!resource) throw new NotFoundError('Lesson resource');

    const lesson = await this.getLessonWithCourseOrThrow(resource.lessonId);
    await courseService.assertEditable(lesson.module.courseId, actor);

    if (resource.fileKey) {
      await storageService.delete(resource.fileKey).catch(() => undefined);
    }
    await lessonResourceRepository.delete(resourceId);
  }

  // ---- Internal helpers ----------------------------------------------------

  private async getModuleOrThrow(moduleId: string) {
    const module_ = await moduleRepository.findById(moduleId);
    if (!module_) throw new NotFoundError('Module');
    return module_;
  }

  private async getLessonWithCourseOrThrow(lessonId: string) {
    const lesson = await lessonRepository.findByIdWithCourse(lessonId);
    if (!lesson) throw new NotFoundError('Lesson');
    return lesson;
  }
}

export const curriculumService = new CurriculumService();
