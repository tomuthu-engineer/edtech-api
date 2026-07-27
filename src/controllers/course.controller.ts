import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { courseService } from '@services/course.service';
import { ValidationError } from '@utils/errors';

function actorContext(req: Request) {
  return { actorId: req.user!.id, roles: req.user!.roles, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

export const courseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await courseService.list(req.query as never, req.user?.roles ?? []);
    ApiResponse.success(res, {
      message: 'Courses retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getById(req.params.id);
    ApiResponse.success(res, { message: 'Course retrieved', data: course });
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getBySlug(req.params.slug);
    ApiResponse.success(res, { message: 'Course retrieved', data: course });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.create(req.body, actorContext(req));
    ApiResponse.created(res, 'Course created', course);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.update(req.params.id, req.body, actorContext(req));
    ApiResponse.success(res, { message: 'Course updated', data: course });
  }),

  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.changeStatus(req.params.id, req.body.status, actorContext(req));
    ApiResponse.success(res, { message: 'Course status updated', data: course });
  }),

  uploadThumbnail: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('No file provided', [{ field: 'file', message: 'file is required' }]);
    const course = await courseService.uploadThumbnail(
      req.params.id,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size },
      actorContext(req),
    );
    ApiResponse.success(res, { message: 'Thumbnail uploaded', data: course });
  }),

  uploadBanner: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError('No file provided', [{ field: 'file', message: 'file is required' }]);
    const course = await courseService.uploadBanner(
      req.params.id,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size },
      actorContext(req),
    );
    ApiResponse.success(res, { message: 'Banner uploaded', data: course });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await courseService.remove(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'Course deleted successfully', data: null });
  }),
};
