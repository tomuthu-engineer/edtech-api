import { z } from 'zod';
import { LessonContentType } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const courseIdParamValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
};

export const moduleIdParamValidator: RequestSchemas = {
  params: z.object({ moduleId: z.string().uuid() }),
};

export const lessonIdParamValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
};

export const resourceIdParamValidator: RequestSchemas = {
  params: z.object({ resourceId: z.string().uuid() }),
};

export const createModuleValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(1000).optional(),
  }),
};

export const updateModuleValidator: RequestSchemas = {
  params: z.object({ moduleId: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
  }),
};

export const reorderModulesValidator: RequestSchemas = {
  params: z.object({ courseId: z.string().uuid() }),
  body: z.object({ orderedIds: z.array(z.string().uuid()).min(1) }),
};

export const createLessonValidator: RequestSchemas = {
  params: z.object({ moduleId: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    articleContent: z.string().optional(),
    externalUrl: z.string().url().optional(),
    isPreview: z.boolean().optional(),
    isLocked: z.boolean().optional(),
  }),
};

export const updateLessonValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    articleContent: z.string().optional(),
    externalUrl: z.string().url().optional(),
    isPreview: z.boolean().optional(),
    isLocked: z.boolean().optional(),
  }),
};

export const reorderLessonsValidator: RequestSchemas = {
  params: z.object({ moduleId: z.string().uuid() }),
  body: z.object({ orderedIds: z.array(z.string().uuid()).min(1) }),
};

export const attachLessonVideoValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
  body: z.object({
    key: z
      .string()
      .min(1)
      .describe(
        'The "key" returned by POST /storage/signed-upload-url (entityType=LESSON_VIDEO), ' +
          'AFTER you have PUT the actual video file to that URL. Must start with ' +
          '"uploads/lessons/videos/" and must already exist in S3 — verified server-side.',
      ),
    durationSec: z.number().int().min(0).optional().describe('Video duration in seconds, if known.'),
  }),
};

export const createResourceValidator: RequestSchemas = {
  params: z.object({ lessonId: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    externalUrl: z.string().url().optional(),
  }),
};
