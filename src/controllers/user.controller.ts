import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { userService } from '@services/user.service';
import { ValidationError } from '@utils/errors';

function actorContext(req: Request) {
  return { actorId: req.user!.id, ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await userService.list(req.query as never);
    ApiResponse.success(res, {
      message: 'Users retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    ApiResponse.success(res, { message: 'User retrieved', data: user });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.user!.id);
    ApiResponse.success(res, { message: 'Current user profile', data: user });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    ApiResponse.success(res, { message: 'Profile updated', data: user });
  }),

  updateMyAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('No file provided', [{ field: 'file', message: 'file is required' }]);
    }
    const user = await userService.updateAvatar(req.user!.id, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    ApiResponse.success(res, { message: 'Avatar updated', data: user });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateStatus(req.params.id, req.body.status, actorContext(req));
    ApiResponse.success(res, { message: 'User status updated', data: user });
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateRole(req.params.id, req.body.role, req.body.action, actorContext(req));
    ApiResponse.success(res, { message: 'User role updated', data: user });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'User deleted successfully', data: null });
  }),
};
