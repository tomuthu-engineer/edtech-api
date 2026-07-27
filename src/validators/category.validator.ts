import { z } from 'zod';
import { RequestSchemas } from '@middlewares/validateRequest.middleware';

export const createCategoryValidator: RequestSchemas = {
  body: z.object({
    name: z.string().trim().min(1).max(150),
    description: z.string().max(1000).optional(),
    iconKey: z.string().optional(),
    parentId: z.string().uuid().optional(),
    sortOrder: z.number().int().optional(),
  }),
};

export const updateCategoryValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().max(1000).optional(),
    iconKey: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const categoryIdParamValidator: RequestSchemas = {
  params: z.object({ id: z.string().uuid() }),
};

export const listCategoriesValidator: RequestSchemas = {
  query: z.object({
    includeInactive: z.coerce.boolean().optional(),
  }),
};
