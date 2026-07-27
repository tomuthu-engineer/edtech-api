import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { analyticsService } from '@services/analytics.service';
import { auditLogService } from '@services/auditLog.service';
import { settingService } from '@services/setting.service';
import { enqueueReportGeneration } from '@queues/producers/report.producer';

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await analyticsService.getDashboardMetrics();
    ApiResponse.success(res, { message: 'Dashboard metrics retrieved', data: metrics });
  }),

  courseAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getCourseAnalytics();
    ApiResponse.success(res, { message: 'Course analytics retrieved', data });
  }),

  studentAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getStudentAnalytics();
    ApiResponse.success(res, { message: 'Student analytics retrieved', data });
  }),

  communityAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getCommunityAnalytics();
    ApiResponse.success(res, { message: 'Community analytics retrieved', data });
  }),

  liveClassAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getLiveClassAnalytics();
    ApiResponse.success(res, { message: 'Live class analytics retrieved', data });
  }),

  recentActivity: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await analyticsService.getRecentActivity(limit);
    ApiResponse.success(res, { message: 'Recent activity retrieved', data });
  }),

  generateReport: asyncHandler(async (req: Request, res: Response) => {
    await enqueueReportGeneration({ reportType: req.body.reportType, requestedBy: req.user!.id });
    ApiResponse.success(res, {
      message: 'Report generation started — you will be notified when it is ready',
      data: null,
    });
  }),

  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await auditLogService.list(req.query as never);
    ApiResponse.success(res, {
      message: 'Audit logs retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  listSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingService.list(req.query.category as string | undefined);
    ApiResponse.success(res, { message: 'Settings retrieved', data: settings });
  }),

  getSetting: asyncHandler(async (req: Request, res: Response) => {
    const setting = await settingService.get(req.params.key);
    ApiResponse.success(res, { message: 'Setting retrieved', data: setting });
  }),

  upsertSetting: asyncHandler(async (req: Request, res: Response) => {
    const setting = await settingService.set(req.params.key, req.body.value, req.body.category, req.user!.id);
    ApiResponse.success(res, { message: 'Setting saved', data: setting });
  }),

  deleteSetting: asyncHandler(async (req: Request, res: Response) => {
    await settingService.remove(req.params.key, req.user!.id);
    ApiResponse.success(res, { message: 'Setting deleted successfully', data: null });
  }),
};
