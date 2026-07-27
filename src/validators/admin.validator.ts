import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const listAuditLogsValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    entityType: z.string().optional(),
    action: z.nativeEnum(AuditAction).optional(),
    actorId: z.string().uuid().optional(),
  }),
};

export const upsertSettingValidator: RequestSchemas = {
  params: z.object({ key: z.string().min(1) }),
  body: z.object({
    value: z.unknown(),
    category: z.string().default('general'),
  }),
};

export const settingKeyParamValidator: RequestSchemas = {
  params: z.object({ key: z.string().min(1) }),
};

export const listSettingsValidator: RequestSchemas = {
  query: z.object({ category: z.string().optional() }),
};

export const generateReportValidator: RequestSchemas = {
  body: z.object({
    reportType: z.enum(['COURSE_ANALYTICS', 'STUDENT_ANALYTICS', 'COMMUNITY_ANALYTICS', 'LIVE_CLASS_ANALYTICS']),
  }),
};
