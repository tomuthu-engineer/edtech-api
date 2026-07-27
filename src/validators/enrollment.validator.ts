import { z } from 'zod';
import { EnrollmentStatus } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const courseIdParamValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
};

export const listEnrollmentsValidator: RequestSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(EnrollmentStatus).optional(),
  }),
};

export const listCourseRosterValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(EnrollmentStatus).optional(),
  }),
};
