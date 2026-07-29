import { z } from 'zod';
import { FileEntityType } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

const entityTypeEnum = z.nativeEnum(FileEntityType);

export const signedUploadUrlValidator: RequestSchemas = {
  body: z.object({
    originalName: z.string().min(1).max(255).describe('Original filename, used only to derive the file extension.'),
    mimeType: z.string().min(1).describe('Must match one of the allowed MIME types for the given entityType.'),
    entityType: entityTypeEnum.describe(
      'What this file is for. Determines the S3 folder, size limit, and allowed MIME types — ' +
        'e.g. LESSON_VIDEO (5GB max) always requires this signed-URL flow rather than a direct upload.',
    ),
  }),
};

export const fileIdParamValidator: RequestSchemas = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const uploadFileValidator: RequestSchemas = {
  params: z.object({
    entityType: entityTypeEnum,
  }),
};
