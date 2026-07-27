import { z } from 'zod';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const createReportValidator: RequestSchemas = {
  body: z.object({
    targetType: z.nativeEnum(ReportTargetType),
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    replyId: z.string().uuid().optional(),
    reportedUserId: z.string().uuid().optional(),
    reason: z.string().trim().min(3).max(1000),
  }),
};

export const listReportsValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(ReportStatus).optional(),
    targetType: z.nativeEnum(ReportTargetType).optional(),
  }),
};

export const resolveReportValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(ReportStatus),
    resolutionNote: z.string().max(1000).optional(),
  }),
};
