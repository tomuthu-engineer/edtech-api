import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { enrollmentService } from '@services/enrollment.service';

export const enrollmentController = {
  enroll: asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await enrollmentService.enroll(req.user!.id, req.params.courseId);
    ApiResponse.created(res, 'Enrolled successfully', enrollment);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    await enrollmentService.cancel(req.user!.id, req.params.courseId);
    ApiResponse.success(res, { message: 'Enrollment cancelled successfully', data: null });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await enrollmentService.listMyEnrollments(req.user!.id, req.query as never);
    ApiResponse.success(res, {
      message: 'Enrollments retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  listForCourse: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await enrollmentService.listCourseEnrollments(
      req.params.courseId,
      req.query as never,
      req.user!.id,
      req.user!.roles,
    );
    ApiResponse.success(res, {
      message: 'Course roster retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),
};
