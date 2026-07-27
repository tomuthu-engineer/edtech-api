import { z } from 'zod';
import { FileEntityType } from '@prisma/client';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

const entityTypeEnum = z.nativeEnum(FileEntityType);

export const signedUploadUrlValidator: RequestSchemas = {
  body: z.object({
    originalName: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    entityType: entityTypeEnum,
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
