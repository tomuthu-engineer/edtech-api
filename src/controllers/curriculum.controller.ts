import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { ValidationError } from '@utils/errors';
import { curriculumService } from '@services/curriculum.service';

function actorContext(req: Request) {
  return { actorId: req.user!.id, roles: req.user!.roles };
}

function fileFromRequest(req: Request) {
  return req.file
    ? {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }
    : undefined;
}

export const curriculumController = {
  listModules: asyncHandler(async (req: Request, res: Response) => {
    const modules = await curriculumService.listModules(req.params.courseId);
    ApiResponse.success(res, { message: 'Modules retrieved', data: modules });
  }),

  createModule: asyncHandler(async (req: Request, res: Response) => {
    const module_ = await curriculumService.createModule(req.params.courseId, req.body, actorContext(req));
    ApiResponse.created(res, 'Module created', module_);
  }),

  updateModule: asyncHandler(async (req: Request, res: Response) => {
    const module_ = await curriculumService.updateModule(req.params.moduleId, req.body, actorContext(req));
    ApiResponse.success(res, { message: 'Module updated', data: module_ });
  }),

  deleteModule: asyncHandler(async (req: Request, res: Response) => {
    await curriculumService.deleteModule(req.params.moduleId, actorContext(req));
    ApiResponse.success(res, { message: 'Module deleted successfully', data: null });
  }),

  reorderModules: asyncHandler(async (req: Request, res: Response) => {
    await curriculumService.reorderModules(req.params.courseId, req.body.orderedIds, actorContext(req));
    ApiResponse.success(res, { message: 'Modules reordered', data: null });
  }),

  listLessons: asyncHandler(async (req: Request, res: Response) => {
    const lessons = await curriculumService.listLessons(req.params.moduleId);
    ApiResponse.success(res, { message: 'Lessons retrieved', data: lessons });
  }),

  createLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await curriculumService.createLesson(req.params.moduleId, req.body, actorContext(req));
    ApiResponse.created(res, 'Lesson created', lesson);
  }),

  updateLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await curriculumService.updateLesson(req.params.lessonId, req.body, actorContext(req));
    ApiResponse.success(res, { message: 'Lesson updated', data: lesson });
  }),

  deleteLesson: asyncHandler(async (req: Request, res: Response) => {
    await curriculumService.deleteLesson(req.params.lessonId, actorContext(req));
    ApiResponse.success(res, { message: 'Lesson deleted successfully', data: null });
  }),

  reorderLessons: asyncHandler(async (req: Request, res: Response) => {
    await curriculumService.reorderLessons(req.params.moduleId, req.body.orderedIds, actorContext(req));
    ApiResponse.success(res, { message: 'Lessons reordered', data: null });
  }),

  getLessonVideoUrl: asyncHandler(async (req: Request, res: Response) => {
    const result = await curriculumService.getLessonVideoUrl(req.params.lessonId, actorContext(req));
    ApiResponse.success(res, { message: 'Signed video URL generated', data: result });
  }),

  attachLessonVideo: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await curriculumService.attachLessonVideo(
      req.params.lessonId,
      req.body.key,
      req.body.durationSec,
      actorContext(req),
    );
    ApiResponse.success(res, { message: 'Lesson video attached', data: lesson });
  }),

  uploadLessonThumbnail: asyncHandler(async (req: Request, res: Response) => {
    const file = fileFromRequest(req);
    if (!file) throw new ValidationError('file is required');
    const lesson = await curriculumService.uploadLessonThumbnail(req.params.lessonId, file, actorContext(req));
    ApiResponse.success(res, { message: 'Lesson thumbnail uploaded', data: lesson });
  }),

  listResources: asyncHandler(async (req: Request, res: Response) => {
    const resources = await curriculumService.listResources(req.params.lessonId);
    ApiResponse.success(res, { message: 'Resources retrieved', data: resources });
  }),

  addResource: asyncHandler(async (req: Request, res: Response) => {
    const resource = await curriculumService.addResource(
      req.params.lessonId,
      req.body,
      fileFromRequest(req),
      actorContext(req),
    );
    ApiResponse.created(res, 'Resource added', resource);
  }),

  removeResource: asyncHandler(async (req: Request, res: Response) => {
    await curriculumService.removeResource(req.params.resourceId, actorContext(req));
    ApiResponse.success(res, { message: 'Resource deleted successfully', data: null });
  }),
};
