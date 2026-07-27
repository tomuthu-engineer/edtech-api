import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { notificationService } from '@services/notification.service';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await notificationService.listForUser(req.user!.id, req.query as never);
    ApiResponse.success(res, {
      message: 'Notifications retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const unreadCount = await notificationService.getUnreadCount(req.user!.id);
    ApiResponse.success(res, { message: 'Unread count retrieved', data: { unreadCount } });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(req.params.id, req.user!.id);
    ApiResponse.success(res, { message: 'Notification marked as read', data: null });
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    ApiResponse.success(res, { message: 'All notifications marked as read', data: null });
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.archive(req.params.id, req.user!.id);
    ApiResponse.success(res, { message: 'Notification archived', data: null });
  }),
};
