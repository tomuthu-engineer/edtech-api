import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { liveService } from '@services/live.service';

function actorContext(req: Request) {
  return { actorId: req.user!.id, roles: req.user!.roles };
}

export const liveController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit } = await liveService.list(req.query as never);
    ApiResponse.success(res, {
      message: 'Live sessions retrieved',
      data: items,
      meta: { pagination: ApiResponse.buildPaginationMeta(page, limit, total) },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const session = await liveService.getById(req.params.id);
    ApiResponse.success(res, { message: 'Live session retrieved', data: session });
  }),

  schedule: asyncHandler(async (req: Request, res: Response) => {
    const session = await liveService.schedule(req.body, actorContext(req));
    ApiResponse.created(res, 'Live session scheduled', session);
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const session = await liveService.start(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'Live session started', data: session });
  }),

  end: asyncHandler(async (req: Request, res: Response) => {
    const session = await liveService.end(req.params.id, actorContext(req), req.body.recordingKey);
    ApiResponse.success(res, { message: 'Live session ended', data: session });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const session = await liveService.cancel(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'Live session cancelled', data: session });
  }),

  join: asyncHandler(async (req: Request, res: Response) => {
    const result = await liveService.join(req.params.id, actorContext(req), req.body.displayName);
    ApiResponse.success(res, { message: 'Join token generated', data: result });
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    await liveService.leave(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'Left live session', data: null });
  }),

  attendance: asyncHandler(async (req: Request, res: Response) => {
    const attendees = await liveService.getAttendance(req.params.id, actorContext(req));
    ApiResponse.success(res, { message: 'Attendance retrieved', data: attendees });
  }),
};
