import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { progressService } from '@services/progress.service';

export const progressController = {
  updateLessonProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.updateLessonProgress(req.user!.id, req.params.lessonId, req.body);
    ApiResponse.success(res, { message: 'Progress updated', data: progress });
  }),

  getLessonProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.getLessonProgress(req.user!.id, req.params.lessonId);
    ApiResponse.success(res, { message: 'Lesson progress retrieved', data: progress });
  }),

  getCourseProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.getCourseProgress(req.user!.id, req.params.courseId);
    ApiResponse.success(res, { message: 'Course progress retrieved', data: progress });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const progress = await progressService.listMyProgress(req.user!.id);
    ApiResponse.success(res, { message: 'Progress retrieved', data: progress });
  }),
};
