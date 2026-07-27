import { z } from 'zod';
import { LessonProgressStatus } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const lessonIdParamValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
};

export const courseIdParamValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
};

export const updateLessonProgressValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(LessonProgressStatus).optional(),
    watchTimeSec: z.number().int().min(0).optional(),
    lastPositionSec: z.number().int().min(0).optional(),
  }),
};
