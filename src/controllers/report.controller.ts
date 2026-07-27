import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { reportService } from '@services/report.service';

export const reportController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.create(req.user!.id, req.body);
    ApiResponse.created(res, 'Report submitted', report);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await reportService.list(req.query as never);
    ApiResponse.success(res, {
      message: 'Reports retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.resolve(req.params.id, req.user!.id, req.body.status, req.body.resolutionNote);
    ApiResponse.success(res, { message: 'Report resolved', data: report });
  }),
};
