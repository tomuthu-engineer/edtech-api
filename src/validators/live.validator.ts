import { z } from 'zod';
import { LiveSessionProvider, LiveSessionStatus } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const liveIdParamValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
};

export const listLiveSessionsValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    courseId: z.string().uuid().optional(),
    status: z.nativeEnum(LiveSessionStatus).optional(),
    hostId: z.string().uuid().optional(),
  }),
};

// scheduledEnd > scheduledStart is enforced in LiveService.schedule() — kept
// out of the zod schema because RequestSchemas requires a plain ZodObject
// (refine() returns a ZodEffects wrapper the validateRequest middleware
// doesn't accept).
export const scheduleLiveSessionValidator: RequestSchemas = {
  body: z.object({
    title: z.string().trim().min(3).max(200),
    description: z.string().max(2000).optional(),
    courseId: z.string().uuid().optional(),
    provider: z.nativeEnum(LiveSessionProvider).optional(),
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
    maxAttendees: z.number().int().min(1).optional(),
  }),
};

export const endLiveSessionValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ recordingKey: z.string().optional() }),
};

export const joinLiveSessionValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ displayName: z.string().trim().min(1).max(100) }),
};
